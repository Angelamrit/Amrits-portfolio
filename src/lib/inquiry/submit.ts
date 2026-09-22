import "server-only";
import { z } from "zod";
import { inquirySchema, type InquiryField, type InquiryInput } from "@/lib/validation/inquiry";
import { inquiryEmailConfigured, sendAutoReplyEmail, sendInquiryEmail } from "@/lib/email/resend";
import { rateLimit, type Rule } from "@/lib/rate-limit";
import { cleanFieldValue } from "@/lib/sanitize";
import { markEmailed, recordWebsiteBooking } from "@/lib/bookings/bookings";
import { store } from "@/lib/store";

/**
 * Everything the enquiry form does, with the request itself passed in.
 *
 * The Server Action in `app/contact/actions.ts` is only the adapter that reads
 * the request headers and hands the work here. Keeping the logic out of the
 * `"use server"` module means it is an ordinary function that can be called and
 * asserted on directly, which is the only way the rate limiting and the bot
 * traps get verified rather than assumed.
 */

export type InquiryState =
  | { status: "idle" }
  | { status: "error"; fieldErrors: Partial<Record<InquiryField, string>>; formError?: string; values: Record<string, string> }
  | { status: "success"; name: string; email?: string };

/** What the booking store hands back: enough to reference the booking in the chef's email. */
export type SavedBooking = { id: string; ref: string; durable: boolean };

export type InquiryContext = {
  /** Best-effort client address; the key every per-client limit hangs off. */
  readonly ip: string;
  /** Injectable clock, so the fill-time trap can be exercised. */
  readonly now?: () => number;
  /**
   * Where a valid enquiry is kept. Injectable so the tests can assert on what
   * was stored without writing into the real data directory; the default is
   * the dashboard's booking store. Returns `null` when it could not be saved.
   */
  readonly saveBooking?: (inquiry: InquiryInput) => Promise<SavedBooking | null>;
  /** Records on the stored booking that the chef's email went out. */
  readonly markEmailed?: (id: string) => Promise<unknown>;
};

async function saveToDashboard(inquiry: InquiryInput): Promise<SavedBooking | null> {
  try {
    const booking = await recordWebsiteBooking(inquiry);
    return { id: booking.id, ref: booking.ref, durable: store.durable };
  } catch (error) {
    // Logged with the enquiry itself, so a storage failure never loses the
    // guest's details even when the email below fails too.
    console.error("[inquiry:store-error]", error, { name: inquiry.name, email: inquiry.email });
    return null;
  }
}

/** A form filled in faster than this was filled in by a script, not a guest. */
const MIN_FILL_MS = 3000;

/**
 * Nothing on this form is longer than the 2,000-character message, so anything
 * past this is either a mistake or an attempt to make validation expensive.
 * Next.js already caps the whole action body at 1MB; this caps each field.
 */
const MAX_FIELD_LENGTH = 4000;

/**
 * The only answer that may contain line breaks. Everything else is rendered as
 * a single `Label: value` line in the enquiry email, where a newline would let
 * a guest forge a line the form never asked for.
 */
const MULTILINE_FIELDS = new Set(["message"]);

/**
 * Two tiers of limit.
 *
 * `ATTEMPT_RULES` are spent on every call, including ones that fail validation,
 * and exist to keep a script from burning CPU. They are loose enough that a
 * guest correcting typos will never notice.
 *
 * The send rules are spent only when an email is actually about to go out, and
 * are what protect the chef's inbox and the Resend quota. The per-email rule is
 * the one that matters most: without it the guest auto-reply turns this form
 * into a way to mail-bomb any address an attacker cares to type in, since the
 * recipient is whatever the form said.
 */
const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;
const ATTEMPT_RULES: readonly Rule[] = [{ limit: 30, windowMs: 10 * MINUTE }];
const SEND_RULES_PER_IP: readonly Rule[] = [
  { limit: 3, windowMs: 10 * MINUTE },
  { limit: 8, windowMs: DAY },
];
const SEND_RULE_PER_EMAIL: Rule = { limit: 3, windowMs: DAY };
/** A backstop on the day's total sends, so a distributed flood cannot quietly
 *  exhaust the mail quota and leave real enquiries silently undelivered. */
const SEND_RULE_GLOBAL: Rule = { limit: 120, windowMs: DAY };

const TOO_MANY =
  "We have had a lot of enquiries from your connection in the last few minutes. Please try again shortly, or call the restaurant and we will take the details over the phone.";
const UNDELIVERABLE =
  "We could not send your enquiry just now. Please try again in a moment — if it keeps failing, call the restaurant and we will pick it up from there.";

function fieldErrorsFrom<T>(error: z.ZodError<T>): Partial<Record<InquiryField, string>> {
  const byField = z.flattenError(error).fieldErrors as Record<string, string[] | undefined>;
  const fieldErrors: Partial<Record<InquiryField, string>> = {};
  for (const [key, messages] of Object.entries(byField)) {
    if (messages && messages.length) fieldErrors[key as InquiryField] = messages[0];
  }
  return fieldErrors;
}

export async function handleInquiry(input: Record<string, string>, ctx: InquiryContext): Promise<InquiryState> {
  const now = ctx.now ?? Date.now;

  const raw: Record<string, string> = {};
  for (const [key, value] of Object.entries(input)) {
    raw[key] = cleanFieldValue(value, MAX_FIELD_LENGTH, { multiline: MULTILINE_FIELDS.has(key) });
  }
  // Echoed back so the client can restore the form; the two anti-spam fields
  // are never echoed, because naming them tells an attacker what to remove.
  const { company: _company, startedAt: _startedAt, ...values } = raw;
  void _company;
  void _startedAt;

  // Cheap tier: spent whatever the outcome.
  const attempt = rateLimit(ATTEMPT_RULES.map((rule, i) => ({ key: `inquiry:attempt:${i}:${ctx.ip}`, rule })));
  if (!attempt.allowed) {
    return { status: "error", fieldErrors: {}, formError: TOO_MANY, values };
  }

  // Honeypot and fill-time. Both answer as though it worked, so a bot cannot
  // tell which signal caught it and tune its way past.
  const startedAt = Number(raw.startedAt ?? 0);
  const tooFast = startedAt > 0 && now() - startedAt < MIN_FILL_MS;
  if (raw.company || tooFast) {
    return { status: "success", name: raw.name?.trim() || "there" };
  }

  const parsed = inquirySchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error), values };
  }
  const inquiry = parsed.data;

  // Expensive tier: only now, with a valid enquiry about to become two emails,
  // do we spend the limits that protect the inbox and the send quota.
  const send = rateLimit([
    ...SEND_RULES_PER_IP.map((rule, i) => ({ key: `inquiry:send:ip:${i}:${ctx.ip}`, rule })),
    { key: `inquiry:send:email:${inquiry.email.toLowerCase()}`, rule: SEND_RULE_PER_EMAIL },
    { key: "inquiry:send:global", rule: SEND_RULE_GLOBAL },
  ]);
  if (!send.allowed) {
    console.warn("[inquiry:rate-limited]", { ip: ctx.ip, retryAfterSeconds: send.retryAfterSeconds });
    return { status: "error", fieldErrors: {}, formError: TOO_MANY, values };
  }

  // Stored first, emailed second. The dashboard is the record and the email is
  // the notification, so an enquiry whose email bounces, lands in spam or is
  // archived by accident is still sitting in the chef's bookings list.
  const saved = await (ctx.saveBooking ?? saveToDashboard)(inquiry);

  const { delivered } = await sendInquiryEmail(inquiry, saved ? { ref: saved.ref, id: saved.id } : undefined);
  if (delivered && saved) {
    await (ctx.markEmailed ?? markEmailed)(saved.id).catch((error: unknown) => {
      console.error("[inquiry:mark-emailed-error]", error);
    });
  }

  // "Received" means the chef can actually see it: the email landed, or it is
  // in a store that survives a restart. A store on a temporary filesystem does
  // not count — it would be thanking the guest for something that will vanish.
  //
  // With neither, the unconfigured case is a local dry run, where reporting
  // success is what lets the form be exercised without a Resend key. In
  // production it is a lost enquiry, so the guest is told the truth and asked
  // to call instead.
  const received = delivered || Boolean(saved?.durable);
  if (!received && (inquiryEmailConfigured() || process.env.NODE_ENV === "production")) {
    return { status: "error", fieldErrors: {}, formError: UNDELIVERABLE, values };
  }

  // The auto-reply is a courtesy. A failure there is logged inside the sender
  // and must not turn a received enquiry into an error for the guest.
  await sendAutoReplyEmail(inquiry);

  return { status: "success", name: inquiry.name, email: inquiry.email };
}
