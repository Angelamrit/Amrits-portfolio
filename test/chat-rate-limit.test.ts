import test from "node:test";
import assert from "node:assert/strict";
import { checkRateLimit, clientKey, resetRateLimits } from "../src/lib/chat/rate-limit.ts";

const req = (headers: Record<string, string>) =>
  new Request("https://example.com/api/chat", { method: "POST", headers });

// --- Caller identity ---------------------------------------------------------

test("platform edge headers win over anything the caller sends", () => {
  const key = clientKey(
    req({
      "x-vercel-forwarded-for": "9.9.9.9",
      "x-forwarded-for": "1.1.1.1",
      "x-real-ip": "2.2.2.2",
    }),
  );
  assert.equal(key, "9.9.9.9");
});

test("the spoofable leftmost x-forwarded-for entry is ignored", () => {
  // Regression: taking hops[0] let a caller rotate the header and get an
  // unlimited number of fresh buckets. The rightmost hop is the one the nearest
  // proxy appended, so that is what identifies the caller.
  assert.equal(clientKey(req({ "x-forwarded-for": "1.2.3.4, 10.0.0.1, 203.0.113.9" })), "203.0.113.9");

  // A caller prepending junk must not change the identity the limiter sees.
  const spoofed = clientKey(req({ "x-forwarded-for": "6.6.6.6, 203.0.113.9" }));
  const plain = clientKey(req({ "x-forwarded-for": "203.0.113.9" }));
  assert.equal(spoofed, plain);
});

test("identity falls back sensibly, and unknown callers share one bucket", () => {
  assert.equal(clientKey(req({ "x-real-ip": "2.2.2.2" })), "2.2.2.2");
  assert.equal(clientKey(req({})), "unknown");
  assert.equal(clientKey(req({ "x-forwarded-for": "   " })), "unknown");
  assert.equal(clientKey(req({})), clientKey(req({})));
});

// --- Windowing ---------------------------------------------------------------

test("a caller is allowed up to the limit, then told when to retry", () => {
  resetRateLimits();
  const start = 1_000_000;

  for (let i = 0; i < 12; i++) {
    assert.equal(checkRateLimit("a", start + i).ok, true, `request ${i + 1} should pass`);
  }

  const blocked = checkRateLimit("a", start + 12);
  assert.equal(blocked.ok, false);
  if (blocked.ok === false) {
    assert.ok(blocked.retryAfterSeconds > 0 && blocked.retryAfterSeconds <= 60);
  }
});

test("callers are limited independently", () => {
  resetRateLimits();
  for (let i = 0; i < 12; i++) checkRateLimit("a", 1000);
  assert.equal(checkRateLimit("a", 1000).ok, false);
  assert.equal(checkRateLimit("b", 1000).ok, true, "one caller must not exhaust another's budget");
});

test("the window reopens once it has elapsed", () => {
  resetRateLimits();
  const start = 5_000_000;
  for (let i = 0; i < 12; i++) checkRateLimit("a", start);
  assert.equal(checkRateLimit("a", start + 59_000).ok, false, "still inside the window");
  assert.equal(checkRateLimit("a", start + 60_001).ok, true, "window has rolled over");
});
