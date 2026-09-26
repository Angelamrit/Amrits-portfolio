import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  CHALLENGE_MAX_AGE_MS,
  consumeChallenge,
  issueChallenge,
  resetChallenges,
  spentCount,
  verifyChallenge,
} from "@/lib/inquiry/challenge";
import { CHALLENGE_MIN_AGE_MS, PROOF_BITS, leadingZeroBits, solveProof, verifyProof } from "@/lib/inquiry/proof";

/**
 * The challenge on its own: what the server signs, what it accepts back, and
 * the arithmetic of the proof of work. `inquiry.test.ts` covers what the form
 * does with each verdict.
 */

const NOW = 1_750_000_000_000;
const BITS = 4;

/** Issued `age` milliseconds before NOW, and solved. */
async function solvedChallenge(age = 10_000) {
  const { token, bits } = await issueChallenge({ now: NOW - age, bits: BITS });
  return { token, solution: await solveProof(token, bits) };
}

beforeEach(() => resetChallenges());

test("a solved challenge verifies once it is old enough", async () => {
  const { token, solution } = await solvedChallenge();
  const verdict = await verifyChallenge(token, solution, NOW);

  assert.equal(verdict.ok, true);
  if (!verdict.ok) return;
  assert.ok(verdict.nonce.length > 0);
});

test("a challenge is refused before a person could have filled the form", async () => {
  const { token, solution } = await solvedChallenge(CHALLENGE_MIN_AGE_MS - 1);

  assert.deepEqual(await verifyChallenge(token, solution, NOW), { ok: false, reason: "too-fast" });
});

test("a challenge expires", async () => {
  const { token, solution } = await solvedChallenge(CHALLENGE_MAX_AGE_MS);

  assert.deepEqual(await verifyChallenge(token, solution, NOW), { ok: false, reason: "expired" });
});

test("a missing token is reported as missing, not as anything worse", async () => {
  assert.deepEqual(await verifyChallenge(undefined, "1", NOW), { ok: false, reason: "missing" });
  assert.deepEqual(await verifyChallenge("", "1", NOW), { ok: false, reason: "missing" });
});

test("an edited token is refused, however it was edited", async () => {
  const { token, solution } = await solvedChallenge();
  const [payload, signature] = token.split(".");

  // The claims changed under a genuine signature. The edit is to the first
  // character, which always carries real bits (the last one may not), so the
  // edited token can never decode to the original by accident.
  const editedClaims = `${payload[0] === "A" ? "B" : "A"}${payload.slice(1)}.${signature}`;
  assert.deepEqual(await verifyChallenge(editedClaims, solution, NOW), { ok: false, reason: "invalid" });

  // The signature changed under genuine claims.
  const editedSignature = `${payload}.${signature[0] === "A" ? "B" : "A"}${signature.slice(1)}`;
  assert.deepEqual(await verifyChallenge(editedSignature, solution, NOW), { ok: false, reason: "invalid" });

  // A signature that is not base64 at all.
  assert.deepEqual(await verifyChallenge(`${payload}.not*base64`, solution, NOW), { ok: false, reason: "invalid" });

  // No signature, no payload, and nonsense.
  assert.deepEqual(await verifyChallenge(payload, solution, NOW), { ok: false, reason: "invalid" });
  assert.deepEqual(await verifyChallenge(`.${signature}`, solution, NOW), { ok: false, reason: "invalid" });
  assert.deepEqual(await verifyChallenge("garbage", solution, NOW), { ok: false, reason: "invalid" });

  // Absurdly long: refused before any crypto runs.
  assert.deepEqual(await verifyChallenge("x".repeat(10_000), solution, NOW), { ok: false, reason: "invalid" });
});

test("a token dated in the future is refused", async () => {
  const { token, bits } = await issueChallenge({ now: NOW + 5 * 60_000, bits: BITS });
  const solution = await solveProof(token, bits);

  assert.deepEqual(await verifyChallenge(token, solution, NOW), { ok: false, reason: "invalid" });
});

test("a token is spent once, and a spent token is refused", async () => {
  const { token, solution } = await solvedChallenge();
  const verdict = await verifyChallenge(token, solution, NOW);
  assert.equal(verdict.ok, true);
  if (!verdict.ok) return;

  assert.equal(consumeChallenge(verdict.nonce, NOW), true, "the first spend succeeds");
  assert.equal(consumeChallenge(verdict.nonce, NOW), false, "the second does not");
  assert.deepEqual(await verifyChallenge(token, solution, NOW + 1000), { ok: false, reason: "replayed" });
});

test("the ledger of spent tokens is capped at every insert, not only at the sweep", () => {
  for (let i = 0; i < 50_500; i += 1) consumeChallenge(`nonce-${i}`, NOW);

  assert.ok(spentCount() <= 50_000, `held ${spentCount()} nonces`);
  assert.equal(consumeChallenge("nonce-50499", NOW), false, "the newest is still remembered");
  assert.equal(consumeChallenge("nonce-0", NOW), true, "the oldest was the one let go");
});

test("verifying a token does not spend it", async () => {
  // A guest whose message failed validation sends again on the same token.
  const { token, solution } = await solvedChallenge();

  assert.equal((await verifyChallenge(token, solution, NOW)).ok, true);
  assert.equal((await verifyChallenge(token, solution, NOW + 1000)).ok, true);
});

test("the proof has to be for this token", async () => {
  // At this test's tiny difficulty one solution in sixteen happens to satisfy
  // another token as well, so this cannot assert on a single random pair. If
  // proofs were not bound to their token, every token would accept a's
  // solution; finding one that does not, in a bounded number of tries, is
  // what shows the binding. Without a bug it takes about one try.
  const a = await solvedChallenge();
  let b: Awaited<ReturnType<typeof solvedChallenge>> | undefined;
  for (let tries = 0; tries < 50 && !b; tries += 1) {
    const candidate = await solvedChallenge();
    if (!(await verifyProof(candidate.token, a.solution, BITS))) b = candidate;
  }
  assert.ok(b, "every token accepted a solution computed for another: proofs are not bound to their token");

  assert.deepEqual(await verifyChallenge(b.token, a.solution, NOW), { ok: false, reason: "unsolved" });
  assert.equal((await verifyChallenge(a.token, a.solution, NOW)).ok, true, "and it still verifies for its own token");
});

test("a wrong, missing or malformed proof is refused", async () => {
  const { token } = await solvedChallenge();

  assert.deepEqual(await verifyChallenge(token, undefined, NOW), { ok: false, reason: "unsolved" });
  assert.deepEqual(await verifyChallenge(token, "", NOW), { ok: false, reason: "unsolved" });
  assert.deepEqual(await verifyChallenge(token, "abc", NOW), { ok: false, reason: "unsolved" });
  assert.deepEqual(await verifyChallenge(token, "-1", NOW), { ok: false, reason: "unsolved" });
  assert.deepEqual(await verifyChallenge(token, "9".repeat(100), NOW), { ok: false, reason: "unsolved" });
});

test("the difficulty is what the token was issued at", async () => {
  const { token } = await issueChallenge({ now: NOW - 10_000, bits: 12 });
  const easy = await solveProof(token, 4);

  // Almost certainly not enough zero bits for what was signed.
  assert.equal(await verifyProof(token, easy, 12), leadingZeroBits(await digest(token, easy)) >= 12);
  // The same solution, judged against 4, would pass — which is why 4 is not what the token says.
  assert.equal(await verifyProof(token, easy, 4), true);
});

test("leading zero bits are counted across bytes", () => {
  assert.equal(leadingZeroBits(new Uint8Array([0x80])), 0);
  assert.equal(leadingZeroBits(new Uint8Array([0x01])), 7);
  assert.equal(leadingZeroBits(new Uint8Array([0x00, 0x0f])), 12);
  assert.equal(leadingZeroBits(new Uint8Array([0x00, 0x00, 0x00])), 24);
});

test("the production difficulty is solvable in a reasonable time", async () => {
  // A guard against someone raising PROOF_BITS to a level that makes a phone
  // spin for a minute. Generous, because the search is a lottery.
  const { token, bits } = await issueChallenge({ now: NOW - 10_000 });
  assert.equal(bits, PROOF_BITS);

  const started = performance.now();
  const solution = await solveProof(token, bits);
  const elapsed = performance.now() - started;

  assert.equal(await verifyProof(token, solution, bits), true);
  assert.ok(elapsed < 10_000, `solving took ${Math.round(elapsed)}ms`);
});

async function digest(token: string, solution: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${token}:${solution}`)));
}
