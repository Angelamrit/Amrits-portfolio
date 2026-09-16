import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { rateLimit, resetRateLimits, type Rule } from "@/lib/rate-limit";

const rule = (limit: number, windowMs = 60_000): Rule => ({ limit, windowMs });

beforeEach(() => resetRateLimits());

test("allows exactly the limit, then turns the next one away", () => {
  const checks = [{ key: "k", rule: rule(3) }];

  assert.ok(rateLimit(checks).allowed);
  assert.ok(rateLimit(checks).allowed);
  assert.ok(rateLimit(checks).allowed);

  const blocked = rateLimit(checks);
  assert.equal(blocked.allowed, false);
  assert.ok(!blocked.allowed && blocked.retryAfterSeconds > 0);
});

test("counters are per key, so one client cannot spend another's budget", () => {
  const first = [{ key: "ip:1", rule: rule(1) }];
  const second = [{ key: "ip:2", rule: rule(1) }];

  assert.ok(rateLimit(first).allowed);
  assert.equal(rateLimit(first).allowed, false);
  assert.ok(rateLimit(second).allowed, "a different key must still have its full budget");
});

test("a request turned away by one rule does not spend budget against the others", () => {
  // This is the property that keeps a blocked caller from also exhausting the
  // looser limits, which would turn a short block into a much longer one.
  const generous = { key: "generous", rule: rule(5) };
  const strict = { key: "strict", rule: rule(1) };

  assert.ok(rateLimit([generous, strict]).allowed); // generous: 1, strict: 1
  assert.equal(rateLimit([generous, strict]).allowed, false, "strict is spent");

  // If the blocked call had still bumped `generous` it would sit at 2, and only
  // three more would fit. Four more proving it is at 1 is the whole assertion.
  for (let i = 0; i < 4; i += 1) {
    assert.ok(rateLimit([generous]).allowed, `call ${i + 1} after the block should fit`);
  }
  assert.equal(rateLimit([generous]).allowed, false, "now it is genuinely exhausted");
});

test("when several rules block, the longest wait is the one reported", () => {
  const shortWindow = { key: "short", rule: rule(1, 1_000) };
  const longWindow = { key: "long", rule: rule(1, 60_000) };

  assert.ok(rateLimit([shortWindow, longWindow]).allowed);

  const blocked = rateLimit([shortWindow, longWindow]);
  assert.equal(blocked.allowed, false);
  assert.ok(!blocked.allowed && blocked.retryAfterSeconds > 1, "should report the 60s window, not the 1s one");
});

test("the window expires and the budget comes back", async () => {
  const checks = [{ key: "expiring", rule: rule(1, 30) }];

  assert.ok(rateLimit(checks).allowed);
  assert.equal(rateLimit(checks).allowed, false);

  await new Promise((resolve) => setTimeout(resolve, 60));
  assert.ok(rateLimit(checks).allowed, "a fresh window should allow again");
});
