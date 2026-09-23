import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { handleInquiry } from "@/lib/inquiry/submit";
import { resetRateLimits } from "@/lib/rate-limit";

/**
 * These run against the real pipeline with no Resend credentials, which is the
 * dry-run path: the enquiry is logged rather than sent. That is deliberate —
 * everything worth asserting here (the bot traps, the two tiers of rate limit,
 * what the guest is told) happens before delivery.
 */

const NOW = 1_750_000_000_000;

/**
 * Every call gets an in-memory booking store, so nothing here writes into the
 * real data directory. `stored` is what the pipeline tried to keep; `result`
 * is what the store answers — `null` for "could not save", and `durable`
 * for whether it would survive a restart.
 */
function ctx(ip: string, result: { durable: boolean } | null = null) {
  const stored: unknown[] = [];
  return {
    ip,
    now: () => NOW,
    stored,
    saveBooking: async (inquiry: unknown) => {
      stored.push(inquiry);
      return result ? { id: "bk-test", ref: "APS-TEST1", durable: result.durable } : null;
    },
    markEmailed: async () => {},
  };
}

/**
 * Next types `NODE_ENV` as read-only, which is right for application code and
 * in the way here: one test needs to see what a guest would be told on the
 * deployed site rather than on a laptop.
 */
const mutableEnv = process.env as Record<string, string | undefined>;

function validInput(overrides: Record<string, string> = {}): Record<string, string> {
  return {
    name: "Test Guest",
    email: "guest@example.com",
    phone: "+1 555 0100",
    location: "Jackson Heights",
    guests: "8",
    experience: "tasting-menu",
    budget: "2k-5k",
    message: "We would like to book the chef's tasting menu for eight guests next month.",
    company: "",
    startedAt: String(NOW - 10_000),
    ...overrides,
  };
}

beforeEach(() => {
  resetRateLimits();
  // The dry-run path logs every enquiry; silence it so failures stand out.
  console.info = () => {};
});

test("a genuine enquiry is accepted", async () => {
  const state = await handleInquiry(validInput(), ctx("1.1.1.1"));

  assert.equal(state.status, "success");
  if (state.status !== "success") return;
  assert.equal(state.name, "Test Guest");
  assert.equal(state.email, "guest@example.com");
});

test("a filled honeypot is answered as though it worked", async () => {
  // Answering with an error would tell a bot which field caught it.
  const state = await handleInquiry(validInput({ company: "Acme Ltd" }), ctx("2.2.2.2"));

  assert.equal(state.status, "success");
  if (state.status !== "success") return;
  // The giveaway that nothing was sent: no address to reply to was recorded.
  assert.equal(state.email, undefined);
});

test("a form completed faster than a human could is answered the same way", async () => {
  const state = await handleInquiry(validInput({ startedAt: String(NOW - 500) }), ctx("3.3.3.3"));

  assert.equal(state.status, "success");
  if (state.status !== "success") return;
  assert.equal(state.email, undefined);
});

test("a form with no timing evidence is still accepted", async () => {
  // Scripted submissions omit the field entirely; that alone is not proof, and
  // treating it as such would reject guests whose JavaScript failed to run.
  const input = validInput();
  delete input.startedAt;

  assert.equal((await handleInquiry(input, ctx("4.4.4.4"))).status, "success");
});

test("an incomplete enquiry comes back with per-field errors", async () => {
  const state = await handleInquiry(
    validInput({ email: "not-an-address", message: "too short" }),
    ctx("5.5.5.5"),
  );

  assert.equal(state.status, "error");
  if (state.status !== "error") return;
  assert.ok(state.fieldErrors.email, "the email should be flagged");
  assert.ok(state.fieldErrors.message, "the short message should be flagged");
});

test("the anti-spam fields are never echoed back to the browser", async () => {
  const state = await handleInquiry(
    validInput({ message: "short", company: "", startedAt: String(NOW - 10_000) }),
    ctx("6.6.6.6"),
  );

  assert.equal(state.status, "error");
  if (state.status !== "error") return;
  // Naming them in the response would tell an attacker exactly what to strip.
  assert.ok(!("company" in state.values));
  assert.ok(!("startedAt" in state.values));
  assert.equal(state.values.name, "Test Guest", "the rest is echoed so the form can be restored");
});

test("one address cannot be used to mail-bomb a third party", async () => {
  // The guest auto-reply goes wherever the form said, so without a per-address
  // limit this form is a way to send mail to anyone, from a different IP each
  // time. Three get through; the fourth does not.
  const victim = "victim@example.com";
  for (let i = 1; i <= 3; i += 1) {
    const state = await handleInquiry(validInput({ email: victim }), ctx(`10.0.0.${i}`));
    assert.equal(state.status, "success", `send ${i} should be allowed`);
  }

  const blocked = await handleInquiry(validInput({ email: victim }), ctx("10.0.0.4"));
  assert.equal(blocked.status, "error");
  if (blocked.status !== "error") return;
  assert.match(blocked.formError ?? "", /lot of enquiries/i);
});

test("one connection cannot flood the chef's inbox", async () => {
  // Different addresses each time, so it is the per-IP limit being measured.
  for (let i = 1; i <= 3; i += 1) {
    const state = await handleInquiry(validInput({ email: `guest${i}@example.com` }), ctx("7.7.7.7"));
    assert.equal(state.status, "success", `send ${i} should be allowed`);
  }

  const blocked = await handleInquiry(validInput({ email: "guest4@example.com" }), ctx("7.7.7.7"));
  assert.equal(blocked.status, "error");
});

test("invalid submissions are rate limited too, so validation cannot be made expensive", async () => {
  const junk = validInput({ email: "nope", message: "x" });
  let blocked = 0;

  for (let i = 0; i < 40; i += 1) {
    const state = await handleInquiry(junk, ctx("8.8.8.8"));
    if (state.status === "error" && /lot of enquiries/i.test(state.formError ?? "")) blocked += 1;
  }

  assert.ok(blocked > 0, "a flood of invalid submissions should eventually be turned away");
});

test("in production an enquiry that was not delivered is never reported as sent", async () => {
  // Without credentials the mailer dry-runs. On a laptop that should look like
  // success; in production it is a lost enquiry, and saying "thank you" would
  // be a lie the chef only discovers when the guest gives up waiting.
  const original = process.env.NODE_ENV;
  try {
    mutableEnv.NODE_ENV = "production";
    const state = await handleInquiry(validInput(), ctx("9.9.9.9"));

    assert.equal(state.status, "error");
    if (state.status !== "error") return;
    assert.match(state.formError ?? "", /could not send/i);
  } finally {
    mutableEnv.NODE_ENV = original;
  }
});

test("an enquiry that could not be emailed but is safely stored is not lost", async () => {
  // The dashboard is the record now. A mailer outage in production must not
  // turn a booking the chef can see into an error the guest is shown.
  const original = process.env.NODE_ENV;
  try {
    mutableEnv.NODE_ENV = "production";
    const context = ctx("9.9.9.10", { durable: true });
    const state = await handleInquiry(validInput(), context);

    assert.equal(state.status, "success");
    assert.equal(context.stored.length, 1);
  } finally {
    mutableEnv.NODE_ENV = original;
  }
});

test("storage that will not survive a restart does not count as received", async () => {
  const original = process.env.NODE_ENV;
  try {
    mutableEnv.NODE_ENV = "production";
    const state = await handleInquiry(validInput(), ctx("9.9.9.11", { durable: false }));
    assert.equal(state.status, "error");
  } finally {
    mutableEnv.NODE_ENV = original;
  }
});

test("bot traps and invalid enquiries never reach the bookings list", async () => {
  const honeypot = ctx("9.9.9.12", { durable: true });
  await handleInquiry(validInput({ company: "Acme Ltd" }), honeypot);
  assert.equal(honeypot.stored.length, 0, "a honeypot hit must not be stored");

  const tooFast = ctx("9.9.9.13", { durable: true });
  await handleInquiry(validInput({ startedAt: String(NOW - 500) }), tooFast);
  assert.equal(tooFast.stored.length, 0, "a form filled by a script must not be stored");

  const invalid = ctx("9.9.9.14", { durable: true });
  await handleInquiry(validInput({ email: "not-an-address" }), invalid);
  assert.equal(invalid.stored.length, 0, "an enquiry that failed validation must not be stored");
});
