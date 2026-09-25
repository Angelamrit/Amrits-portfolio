import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { FORM_FIELDS, handleInquiry, issueInquiryChallenge, type InquiryContext } from "@/lib/inquiry/submit";
import { issueChallenge, resetChallenges } from "@/lib/inquiry/challenge";
import { solveProof, verifyProof } from "@/lib/inquiry/proof";
import { resetRateLimits } from "@/lib/rate-limit";

/**
 * These run against the real pipeline with no Resend credentials, which is the
 * dry-run path: the message is logged rather than sent. That is deliberate —
 * everything worth asserting here (the bot traps, the three tiers of rate
 * limit, what the guest is told) happens before delivery.
 */

const NOW = 1_750_000_000_000;
const SECOND = 1000;

/**
 * Cheap enough to solve in microseconds. The difficulty is signed into the
 * token and checked against, so this exercises the real code path.
 */
const TEST_BITS = 4;

/** The decoy delay is a real timer in production; here it is skipped unless a test wants to watch it. */
const noSleep = async () => {};

function ctx(ip: string, at = NOW, extra: Partial<InquiryContext> = {}): InquiryContext {
  return { ip, now: () => at, sleep: noSleep, ...extra };
}

/**
 * Next types `NODE_ENV` as read-only, which is right for application code and
 * in the way here: one test needs to see what a guest would be told on the
 * deployed site rather than on a laptop.
 */
const mutableEnv = process.env as Record<string, string | undefined>;

/** What a genuine browser sends: a challenge issued ten seconds ago, solved. */
async function solved(at = NOW): Promise<{ challenge: string; proof: string }> {
  const { token, bits } = await issueChallenge({ now: at - 10 * SECOND, bits: TEST_BITS });
  return { challenge: token, proof: await solveProof(token, bits) };
}

/** The smallest counter that is not a proof for this token: a deterministic wrong answer. */
async function wrongProofFor(token: string): Promise<string> {
  for (let counter = 0; ; counter += 1) {
    const candidate = String(counter);
    if (!(await verifyProof(token, candidate, TEST_BITS))) return candidate;
  }
}

async function validInput(overrides: Record<string, string> = {}, at = NOW): Promise<Record<string, string>> {
  return {
    name: "Test Guest",
    email: "guest@example.com",
    phone: "+1 555 0100",
    topic: "angel",
    message: "We loved the tasting menu last week and wanted to say thank you to the kitchen.",
    company: "",
    ...(await solved(at)),
    ...overrides,
  };
}

beforeEach(() => {
  resetRateLimits();
  resetChallenges();
  // The dry-run path logs every enquiry; silence it so failures stand out.
  console.info = () => {};
});

test("a genuine enquiry is accepted", async () => {
  const state = await handleInquiry(await validInput(), ctx("1.1.1.1"));

  assert.equal(state.status, "success");
  if (state.status !== "success") return;
  assert.equal(state.name, "Test Guest");
  assert.equal(state.email, "guest@example.com");
});

test("a filled honeypot is answered as though it worked", async () => {
  // Answering with an error would tell a bot which field caught it.
  const state = await handleInquiry(await validInput({ company: "Acme Ltd" }), ctx("2.2.2.2"));

  assert.equal(state.status, "success");
  if (state.status !== "success") return;
  // The giveaway that nothing was sent: no address to reply to was recorded.
  assert.equal(state.email, undefined);
});

test("a caught bot is kept waiting about as long as a real send, so timing gives nothing away", async () => {
  const waits: number[] = [];
  const watch = { sleep: async (ms: number) => void waits.push(ms) };

  const decoy = await handleInquiry(await validInput({ company: "Acme Ltd" }), ctx("2.2.2.3", NOW, watch));
  assert.equal(decoy.status, "success");
  assert.equal(waits.length, 1, "the decoy should wait once");
  assert.ok(waits[0] >= 300 && waits[0] <= 900, `a wait of ${waits[0]}ms is not in the range of a real send`);

  const genuine = await handleInquiry(await validInput(), ctx("2.2.2.4", NOW, watch));
  assert.equal(genuine.status, "success");
  assert.equal(waits.length, 1, "a genuine send is not slowed down");
});

test("a form completed faster than a person could is answered the same way", async () => {
  const { token, bits } = await issueChallenge({ now: NOW - 500, bits: TEST_BITS });
  const input = await validInput({ challenge: token, proof: await solveProof(token, bits) });

  const state = await handleInquiry(input, ctx("3.3.3.3"));
  assert.equal(state.status, "success");
  if (state.status !== "success") return;
  assert.equal(state.email, undefined);
});

test("a form with no challenge is refused, and told so", async () => {
  // Scripted submissions post straight at the endpoint and never fetch one.
  // This one is told the truth, because it also happens to a real guest who
  // pressed Send before the page's script ran, and a bot learns nothing here
  // that the form's own HTML does not already show.
  const input = await validInput();
  delete input.challenge;
  delete input.proof;

  const state = await handleInquiry(input, ctx("4.4.4.4"));
  assert.equal(state.status, "error");
  if (state.status !== "error") return;
  assert.match(state.formError ?? "", /could not confirm/i);
  assert.equal(state.refreshChallenge, true, "the browser should fetch a fresh challenge before trying again");
});

test("a challenge this server did not sign is refused", async () => {
  const genuine = await solved();
  // One character of the signature changed: the first, which always carries
  // real bits, so the forgery can never decode to the genuine signature.
  const [payload, signature] = genuine.challenge.split(".");
  const forged = `${payload}.${signature[0] === "A" ? "B" : "A"}${signature.slice(1)}`;

  const state = await handleInquiry(await validInput({ challenge: forged }), ctx("4.4.4.5"));
  assert.equal(state.status, "error");
  if (state.status !== "error") return;
  assert.equal(state.refreshChallenge, true);
});

test("a challenge older than two hours is refused, and a fresh one requested", async () => {
  const { token, bits } = await issueChallenge({ now: NOW - 3 * 60 * 60 * SECOND, bits: TEST_BITS });
  const input = await validInput({ challenge: token, proof: await solveProof(token, bits) });

  const state = await handleInquiry(input, ctx("4.4.4.6"));
  assert.equal(state.status, "error");
  if (state.status !== "error") return;
  assert.equal(state.refreshChallenge, true);
});

test("a challenge without its proof of work is answered as though it worked", async () => {
  // A script that fetched a token but did not do the work behind it. The
  // wrong answer is found rather than hard-coded: at this test's tiny
  // difficulty a fixed number would be a valid proof one time in sixteen.
  const { challenge } = await solved();
  const state = await handleInquiry(
    await validInput({ challenge, proof: await wrongProofFor(challenge) }),
    ctx("4.4.4.7"),
  );

  assert.equal(state.status, "success");
  if (state.status !== "success") return;
  assert.equal(state.email, undefined);
});

test("one challenge sends one message: a captured request cannot be replayed", async () => {
  const input = await validInput();

  const first = await handleInquiry(input, ctx("4.4.4.8", NOW));
  assert.equal(first.status, "success");
  if (first.status !== "success") return;
  assert.equal(first.email, "guest@example.com");

  // Past the cooldown, same request again. Answered like a bot: nothing sent.
  const replay = await handleInquiry(input, ctx("4.4.4.8", NOW + 6 * SECOND));
  assert.equal(replay.status, "success");
  if (replay.status !== "success") return;
  assert.equal(replay.email, undefined);
});

test("a guest can correct a mistake and send on the same challenge", async () => {
  // The token is only spent when a message actually goes out, so a validation
  // error does not cost the guest their challenge.
  const input = await validInput({ message: "too short" });

  const first = await handleInquiry(input, ctx("4.4.4.9", NOW));
  assert.equal(first.status, "error");
  if (first.status !== "error") return;
  assert.ok(first.fieldErrors.message);
  assert.equal(first.refreshChallenge, undefined, "the challenge is still good");

  const fixed = { ...input, message: "We loved the tasting menu and wanted to thank the kitchen." };
  const second = await handleInquiry(fixed, ctx("4.4.4.9", NOW + 6 * SECOND));
  assert.equal(second.status, "success");
  if (second.status !== "success") return;
  assert.equal(second.email, "guest@example.com");
});

test("an incomplete enquiry comes back with per-field errors", async () => {
  const state = await handleInquiry(
    await validInput({ email: "not-an-address", message: "too short" }),
    ctx("5.5.5.5"),
  );

  assert.equal(state.status, "error");
  if (state.status !== "error") return;
  assert.ok(state.fieldErrors.email, "the email should be flagged");
  assert.ok(state.fieldErrors.message, "the short message should be flagged");
});

test("the anti-spam fields are never echoed back to the browser", async () => {
  const state = await handleInquiry(await validInput({ message: "short" }), ctx("6.6.6.6"));

  assert.equal(state.status, "error");
  if (state.status !== "error") return;
  // Naming them in the response would tell an attacker exactly what to strip.
  assert.ok(!("company" in state.values));
  assert.ok(!("challenge" in state.values));
  assert.ok(!("proof" in state.values));
  assert.equal(state.values.name, "Test Guest", "the rest is echoed so the form can be restored");
});

test("fields the form never asked for are ignored, not read and not echoed", async () => {
  // A body padded with thousands of extra fields must cost nothing beyond the
  // eight the form has, and none of it may come back to the browser.
  const padded = await validInput({ message: "short" });
  for (let i = 0; i < 5_000; i += 1) padded[`extra${i}`] = "x".repeat(200);

  const state = await handleInquiry(padded, ctx("6.6.6.7"));
  assert.equal(state.status, "error");
  if (state.status !== "error") return;
  const known = new Set<string>(FORM_FIELDS);
  for (const key of Object.keys(state.values)) assert.ok(known.has(key), `"${key}" should not have been echoed`);
});

test("one connection must wait five seconds between submissions", async () => {
  const ip = "11.11.11.11";

  const first = await handleInquiry(await validInput(), ctx(ip, NOW));
  assert.equal(first.status, "success");

  const tooSoon = await handleInquiry(await validInput({}, NOW + 2 * SECOND), ctx(ip, NOW + 2 * SECOND));
  assert.equal(tooSoon.status, "error");
  if (tooSoon.status !== "error") return;
  assert.match(tooSoon.formError ?? "", /wait a few seconds/i);
  assert.ok(
    tooSoon.retryAfterSeconds !== undefined && tooSoon.retryAfterSeconds >= 1 && tooSoon.retryAfterSeconds <= 5,
    `the wait should be at most five seconds, got ${tooSoon.retryAfterSeconds}`,
  );

  const afterWait = await handleInquiry(await validInput({}, NOW + 5 * SECOND), ctx(ip, NOW + 5 * SECOND));
  assert.equal(afterWait.status, "success", "five seconds later the same connection may send again");

  // The cooldown is per connection: someone else is not made to wait.
  const other = await handleInquiry(await validInput(), ctx("12.12.12.12", NOW + 2 * SECOND));
  assert.equal(other.status, "success");
});

test("the cooldown is spent by every attempt, so a flood is turned away before it is even read", async () => {
  const ip = "13.13.13.13";
  const junk = await validInput({ email: "nope", message: "x" });

  const first = await handleInquiry(junk, ctx(ip, NOW));
  assert.equal(first.status, "error");
  if (first.status !== "error") return;
  assert.ok(first.fieldErrors.email, "the first one is validated");

  const second = await handleInquiry(junk, ctx(ip, NOW + SECOND));
  assert.equal(second.status, "error");
  if (second.status !== "error") return;
  assert.match(second.formError ?? "", /wait a few seconds/i);
  assert.deepEqual(second.fieldErrors, {}, "the second one is not even validated");
});

test("one address cannot be used to mail-bomb a third party", async () => {
  // The guest auto-reply goes wherever the form said, so without a per-address
  // limit this form is a way to send mail to anyone, from a different IP each
  // time. Three get through; the fourth does not.
  const victim = "victim@example.com";
  for (let i = 1; i <= 3; i += 1) {
    const state = await handleInquiry(await validInput({ email: victim }), ctx(`10.0.0.${i}`));
    assert.equal(state.status, "success", `send ${i} should be allowed`);
  }

  const blocked = await handleInquiry(await validInput({ email: victim }), ctx("10.0.0.4"));
  assert.equal(blocked.status, "error");
  if (blocked.status !== "error") return;
  assert.match(blocked.formError ?? "", /lot of messages/i);
});

test("one connection cannot flood the chef's inbox", async () => {
  // Different addresses each time, and past the cooldown each time, so it is
  // the per-IP send limit being measured.
  for (let i = 1; i <= 3; i += 1) {
    const at = NOW + i * 6 * SECOND;
    const state = await handleInquiry(await validInput({ email: `guest${i}@example.com` }, at), ctx("7.7.7.7", at));
    assert.equal(state.status, "success", `send ${i} should be allowed`);
  }

  const at = NOW + 4 * 6 * SECOND;
  const blocked = await handleInquiry(await validInput({ email: "guest4@example.com" }, at), ctx("7.7.7.7", at));
  assert.equal(blocked.status, "error");
  if (blocked.status !== "error") return;
  assert.match(blocked.formError ?? "", /lot of messages/i);
});

test("invalid submissions are rate limited too, so validation cannot be made expensive", async () => {
  let blocked = 0;

  // Six seconds apart, so it is the attempt ceiling and not the cooldown.
  for (let i = 0; i < 40; i += 1) {
    const at = NOW + i * 6 * SECOND;
    const junk = await validInput({ email: "nope", message: "x" }, at);
    const state = await handleInquiry(junk, ctx("8.8.8.8", at));
    if (state.status === "error" && /lot of messages/i.test(state.formError ?? "")) blocked += 1;
  }

  assert.ok(blocked > 0, "a flood of invalid submissions should eventually be turned away");
});

test("one connection cannot be issued challenges without limit", async () => {
  for (let i = 0; i < 30; i += 1) {
    assert.ok(await issueInquiryChallenge(ctx("14.14.14.14")), `challenge ${i + 1} should be issued`);
  }
  assert.equal(await issueInquiryChallenge(ctx("14.14.14.14")), null);
  assert.ok(await issueInquiryChallenge(ctx("15.15.15.15")), "another connection is unaffected");
});

test("the auto-reply is handed to the transport to send after the guest has their answer", async () => {
  // The enquiry itself is awaited; the courtesy email must not make the guest
  // wait for a second round trip to the mail API.
  const deferred: Array<() => Promise<unknown>> = [];
  const state = await handleInquiry(await validInput(), ctx("16.16.16.16", NOW, { defer: (task) => void deferred.push(task) }));

  assert.equal(state.status, "success");
  assert.equal(deferred.length, 1, "exactly the auto-reply should be deferred");
  await deferred[0]();
});

test("in production an enquiry that was not delivered is never reported as sent", async () => {
  // Without credentials the mailer dry-runs. On a laptop that should look like
  // success; in production it is a lost enquiry, and saying "thank you" would
  // be a lie the chef only discovers when the guest gives up waiting.
  const original = process.env.NODE_ENV;
  try {
    mutableEnv.NODE_ENV = "production";
    const state = await handleInquiry(await validInput(), ctx("9.9.9.9"));

    assert.equal(state.status, "error");
    if (state.status !== "error") return;
    assert.match(state.formError ?? "", /could not send/i);
    assert.equal(state.refreshChallenge, true, "the token was spent, so the retry needs a fresh one");
  } finally {
    mutableEnv.NODE_ENV = original;
  }
});

test("a message about a topic the form does not offer is rejected", async () => {
  const state = await handleInquiry(await validInput({ topic: "wedding-catering" }), ctx("9.9.9.12"));

  assert.equal(state.status, "error");
  if (state.status !== "error") return;
  assert.ok(state.fieldErrors.topic, "the topic should be flagged");
});
