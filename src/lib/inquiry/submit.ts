import "server-only";
import { z } from "zod";
import { inquirySchema, type InquiryField } from "@/lib/validation/inquiry";
import { inquiryEmailConfigured, sendAutoReplyEmail, sendInquiryEmail } from "@/lib/email/resend";
import { rateLimit, type Rule } from "@/lib/rate-limit";
import { cleanFieldValue } from "@/lib/sanitize";
import { consumeChallenge, issueChallenge, verifyChallenge, type Challenge, type ChallengeVerdict } from "./challenge";

/**
 * Everything the contact form does, with the request itself passed in.
 *
 * The Server Actions in `app/contact/actions.ts` are only the adapters that
 * read the request headers and hand the work here. Keeping the logic out of
 * the `"use server"` module means it is an ordinary function that can be
 * called and asserted on directly, which is the only way the rate limiting and
 * the bot traps get verified rather than assumed.
 *
 * What stands between a request and the chef's inbox, in the order it is met:
 *
 *   1. Only the eight fields the form has are read; the rest of the body is
 *      never looked at, so the work a request can cause is bounded.
 *   2. A five-second cooldown per connection, spent by every call.
 *   3. A ceiling on attempts per connection, so validation cannot be made expensive.
 *   4. The honeypot field.
 *   5. The signed challenge the browser fetched, aged, solved and sends back
 *      (see `challenge.ts` and `proof.ts`) — proof that a browser ran the page,
 *      waited as long as a person takes, and did the work. Single use.
 *   6. Validation.
 *   7. The send limits: per connection, per address written on the form, and
 *      for the whole site per day.
 *
 * Nothing here throws on purpose, and nothing that is called is allowed to
 * either: the mailer swallows its own failures and is held to a timeout, and
 * the adapter above catches whatever is left. A guest always gets a sentence
 * back, never the error boundary.
 */

export type InquiryState =
  | { status: "idle" }
  | {
      status: "error";
      fieldErrors: Partial<Record<InquiryField, string>>;
      formError?: string;
      values: Record<string, string>;
      /** Set by the cooldown: how long the button should wait before it can be pressed again. */
      retryAfterSeconds?: number;
      /** Set when the challenge that came with the form cannot be used again, so the browser fetches a fresh one first. */
      refreshChallenge?: true;
    }
  | { status: "success"; name: string; email?: string };

export type InquiryContext = {
  /** Best-effort client address; the key every per-client limit hangs off. */
  readonly ip: string;
  /** Injectable clock, so every timing rule can be exercised without waiting. */
  readonly now?: () => number;
  /** Injectable timer, so the decoy delay can be observed rather than waited for. */
  readonly sleep?: (ms: number) => Promise<void>;
  /**
   * Runs work once the response has gone out, where the transport can (the
   * Server Action passes Next's `after`). Without it the work is awaited in
   * line, which is what a test wants.
   */
  readonly defer?: (task: () => Promise<unknown>) => void;
};

/**
 * The only fields ever read from a submission. Anything else in the body is
 * ignored without being looked at, so the cost of a request is bounded by
 * these eight fields at `MAX_FIELD_LENGTH` each, however large the body is.
 */
export const FORM_FIELDS = ["name", "email", "phone", "topic", "message", "company", "challenge", "proof"] as const;

/**
 * The fields that exist to catch bots. They are read here and never echoed
 * back to the browser, because naming them tells an attacker what to remove.
 */
const ANTI_SPAM_FIELDS = new Set<string>(["company", "challenge", "proof"]);

/**
 * Nothing on this form is longer than the 2,000-character message, so anything
 * past this is either a mistake or an attempt to make validation expensive.
 * Next.js already caps the whole action body at 1MB; this caps each field.
 */
const MAX_FIELD_LENGTH = 4000;

/**
 * Three tiers of limit.
 *
 * The cooldown comes first and is spent by every call, whatever it contains:
 * one submission per connection every five seconds. It is what stops a single
 * client from hammering the action at all — a flood from one address is turned
 * away after a Map lookup, before anything in it is validated. Five seconds is
 * shorter than anything a guest does by hand, and the button counts it down.
 *
 * `ATTEMPT_RULES` are spent on every call past the cooldown, including ones
 * that fail validation, and exist to keep a script from burning CPU. They are
 * loose enough that a guest correcting typos will never notice.
 *
 * The send rules are spent only when an email is actually about to go out, and
 * are what protect the chef's inbox and the Resend quota. The per-email rule is
 * the one that matters most: without it the guest auto-reply turns this form
 * into a way to mail-bomb any address an attacker cares to type in, since the
 * recipient is whatever the form said.
 *
 * `CHALLENGE_RULES` cap how many challenges one connection can be issued, so
 * tokens cannot be farmed — though with a two-hour life and one use each there
 * is little for a stockpile to buy.
 */
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const DAY = 24 * 60 * MINUTE;
const COOLDOWN_RULE: Rule = { limit: 1, windowMs: 5 * SECOND };
const ATTEMPT_RULES: readonly Rule[] = [{ limit: 30, windowMs: 10 * MINUTE }];
const CHALLENGE_RULES: readonly Rule[] = [{ limit: 30, windowMs: 10 * MINUTE }];
const SEND_RULES_PER_IP: readonly Rule[] = [
  { limit: 3, windowMs: 10 * MINUTE },
  { limit: 8, windowMs: DAY },
];
const SEND_RULE_PER_EMAIL: Rule = { limit: 3, windowMs: DAY };
/** A backstop on the day's total sends, so a distributed flood cannot quietly
 *  exhaust the mail quota and leave real enquiries silently undelivered. */
const SEND_RULE_GLOBAL: Rule = { limit: 120, windowMs: DAY };

/**
 * How long a caught bot is kept waiting before its decoy "success". A real
 * send spends a few hundred milliseconds talking to the mail API; an instant
 * answer would tell a script that it had been caught, and by which signal. The
 * decoy waits about as long. It is a timer, not work: nothing runs meanwhile.
 */
const DECOY_DELAY_MS: readonly [min: number, max: number] = [300, 900];

/**
 * Which challenge failures are told to the guest. These three happen to real
 * people — the form was submitted before its script ran, the tab was left open
 * past the token's two hours, the server restarted on a new key — and a bot
 * learns nothing from them it could not read from the form's own HTML. Every
 * other failure is a script's fingerprint and is answered like the honeypot.
 */
const HONEST_CHALLENGE_FAILURES: ReadonlySet<Extract<ChallengeVerdict, { ok: false }>["reason"]> = new Set([
  "missing",
  "invalid",
  "expired",
] as const);

const WAIT = "Please wait a few seconds before sending another message.";
const TOO_MANY =
  "We have had a lot of messages from your connection in the last few minutes. Please try again shortly, or call the restaurant and we will take the details over the phone.";
const UNVERIFIED =
  "We could not confirm that this message was sent from our website, so it was not sent. Please try again — if it keeps happening, call the restaurant and we will take the details over the phone.";
const UNDELIVERABLE =
  "We could not send your message just now. Please try again in a moment — if it keeps failing, call the restaurant and we will pick it up from there.";

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function fieldErrorsFrom<T>(error: z.ZodError<T>): Partial<Record<InquiryField, string>> {
  const byField = z.flattenError(error).fieldErrors as Record<string, string[] | undefined>;
  const fieldErrors: Partial<Record<InquiryField, string>> = {};
  for (const [key, messages] of Object.entries(byField)) {
    if (messages && messages.length) fieldErrors[key as InquiryField] = messages[0];
  }
  return fieldErrors;
}

/** The challenge the browser must solve before it can send. `null` when this connection has asked for too many. */
export async function issueInquiryChallenge(ctx: InquiryContext): Promise<Challenge | null> {
  const now = ctx.now ?? Date.now;
  const verdict = rateLimit(
    CHALLENGE_RULES.map((rule, i) => ({ key: `inquiry:challenge:${i}:${ctx.ip}`, rule })),
    now(),
  );
  if (!verdict.allowed) return null;
  return issueChallenge({ now: now() });
}

export async function handleInquiry(input: Record<string, string>, ctx: InquiryContext): Promise<InquiryState> {
  const now = ctx.now ?? Date.now;
  const sleep = ctx.sleep ?? defaultSleep;

  // Only the fields the form has, each cut to size before anything else is
  // done with it. `values` is what the browser gets back to restore the form.
  const raw: Record<string, string> = {};
  const values: Record<string, string> = {};
  for (const field of FORM_FIELDS) {
    const value = input[field];
    if (typeof value !== "string") continue;
    raw[field] = cleanFieldValue(value, MAX_FIELD_LENGTH, { multiline: field === "message" });
    if (!ANTI_SPAM_FIELDS.has(field)) values[field] = raw[field];
  }

  // Tier one: the cooldown. First, because it is the cheapest check there is
  // and the one that decides how often one connection can make us do anything.
  const cooldown = rateLimit([{ key: `inquiry:cooldown:${ctx.ip}`, rule: COOLDOWN_RULE }], now());
  if (!cooldown.allowed) {
    return { status: "error", fieldErrors: {}, formError: WAIT, values, retryAfterSeconds: cooldown.retryAfterSeconds };
  }

  // Tier two: attempts, spent whatever the outcome.
  const attempt = rateLimit(
    ATTEMPT_RULES.map((rule, i) => ({ key: `inquiry:attempt:${i}:${ctx.ip}`, rule })),
    now(),
  );
  if (!attempt.allowed) {
    return { status: "error", fieldErrors: {}, formError: TOO_MANY, values };
  }

  // A caught bot is answered as though it worked, after about the time a real
  // send takes, so it cannot tell which signal caught it and tune its way
  // past. The giveaway, for the tests, is that no reply address is recorded:
  // nothing was sent.
  const caught = async (): Promise<InquiryState> => {
    const [min, max] = DECOY_DELAY_MS;
    await sleep(min + Math.random() * (max - min));
    return { status: "success", name: raw.name?.trim() || "there" };
  };

  if (raw.company) return caught();

  const challenge = await verifyChallenge(raw.challenge, raw.proof, now());
  if (!challenge.ok) {
    return HONEST_CHALLENGE_FAILURES.has(challenge.reason)
      ? { status: "error", fieldErrors: {}, formError: UNVERIFIED, values, refreshChallenge: true }
      : caught();
  }

  const parsed = inquirySchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error), values };
  }
  const inquiry = parsed.data;

  // Tier three: only now, with a valid enquiry about to become two emails, do
  // we spend the limits that protect the inbox and the send quota.
  const send = rateLimit(
    [
      ...SEND_RULES_PER_IP.map((rule, i) => ({ key: `inquiry:send:ip:${i}:${ctx.ip}`, rule })),
      { key: `inquiry:send:email:${inquiry.email.toLowerCase()}`, rule: SEND_RULE_PER_EMAIL },
      { key: "inquiry:send:global", rule: SEND_RULE_GLOBAL },
    ],
    now(),
  );
  if (!send.allowed) {
    console.warn("[inquiry:rate-limited]", { ip: ctx.ip, retryAfterSeconds: send.retryAfterSeconds });
    return { status: "error", fieldErrors: {}, formError: TOO_MANY, values };
  }

  // The token is spent here, at the last moment before anything is sent, so a
  // guest whose message failed validation could fix it and send on the same
  // token, while two copies of one request can only ever produce one email.
  if (!consumeChallenge(challenge.nonce, now())) return caught();

  // The mailer promises not to throw and is held to a timeout. The catch is
  // there for the promise being broken: a lost send is an honest error for the
  // guest and a line in the log, never a crash.
  let delivered = false;
  try {
    ({ delivered } = await sendInquiryEmail(inquiry));
  } catch (error) {
    console.error("[inquiry:send-failed]", error);
  }

  // With no mailer configured, a local dry run reports success so the form can
  // be exercised without a Resend key. In production that is a lost message,
  // so the guest is told the truth and asked to call instead. Their token is
  // spent, so the retry needs a fresh one.
  if (!delivered && (inquiryEmailConfigured() || process.env.NODE_ENV === "production")) {
    return { status: "error", fieldErrors: {}, formError: UNDELIVERABLE, values, refreshChallenge: true };
  }

  // The auto-reply is a courtesy, and it goes out after the guest already has
  // their answer: the enquiry itself is what has to succeed before they are
  // thanked, and there is no reason to make them wait for a second email. A
  // failure there is logged and can never turn a received enquiry into an error.
  const autoReply = () =>
    sendAutoReplyEmail(inquiry).catch((error: unknown) => console.error("[inquiry:auto-reply-failed]", error));
  if (ctx.defer) ctx.defer(autoReply);
  else await autoReply();

  return { status: "success", name: inquiry.name, email: inquiry.email };
}
