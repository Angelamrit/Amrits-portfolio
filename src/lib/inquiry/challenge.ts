import "server-only";
import { env } from "@/lib/env";
import { CHALLENGE_MIN_AGE_MS, PROOF_BITS, verifyProof } from "./proof";

/**
 * Signed, single-use challenges for the contact form.
 *
 * A challenge is a small set of claims — when it was issued, a random nonce,
 * the proof-of-work difficulty — and an HMAC over them, so the server can tell
 * its own challenges from anything a client made up, without keeping a record
 * of what it issued. The browser asks for one when the form mounts, solves the
 * proof in the background (see `proof.ts`) and sends both back with the form.
 *
 * The checks, in order: the signature (a forged or edited token is refused),
 * the age (a token is worthless after two hours, and a form submitted sooner
 * than a person could have filled it in was submitted by a script), the nonce
 * (each token sends one message, so a captured request cannot be replayed),
 * and the proof (the browser did the work). What each failure is answered with
 * is decided in `submit.ts`, not here — this only says what went wrong.
 *
 * The nonce ledger lives in memory, exactly like the rate limiter, and with the
 * same known limit: on a host with several instances each keeps its own. That
 * is accepted; the rate limits bound what a replay could achieve anyway.
 */

export type Challenge = { readonly token: string; readonly bits: number };

export type ChallengeVerdict =
  | { ok: true; nonce: string }
  | { ok: false; reason: "missing" | "invalid" | "expired" | "too-fast" | "replayed" | "unsolved" };

/**
 * How long a challenge stays valid. Long enough to write a message and be
 * interrupted halfway; short enough that a harvested token is dead by lunch.
 */
export const CHALLENGE_MAX_AGE_MS = 2 * 60 * 60 * 1000;

/** A token dated further ahead than this was not issued by a clock we share. */
const MAX_CLOCK_SKEW_MS = 60_000;

const VERSION = 1;
const ALGORITHM = { name: "HMAC", hash: "SHA-256" } as const;
/** Roughly three times a genuine token. Anything longer is refused before any crypto runs. */
const MAX_TOKEN_LENGTH = 512;

type Claims = {
  v: number;
  /** Issued at, epoch milliseconds. */
  iat: number;
  /** Nonce: what makes the token single-use. */
  n: string;
  /** Proof-of-work difficulty this token was issued at, signed so it cannot be lowered. */
  d: number;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

let processSecret: string | undefined;

/**
 * The key challenges are signed with.
 *
 * `INQUIRY_CHALLENGE_SECRET` wins when it is set. Otherwise it is derived from
 * the mail API key, which every deploy that can send an enquiry already has,
 * so a production site gets a stable key with nothing extra to configure.
 * Failing both, a random key is drawn once per process: right on a laptop and
 * on a single server. On a serverless host with several instances and no mail
 * key, a token issued by one instance would be refused by another — the guest
 * is asked to try again and the retry gets a fresh token — which is what the
 * explicit variable is for.
 */
function challengeSecret(): string {
  if (env.INQUIRY_CHALLENGE_SECRET) return env.INQUIRY_CHALLENGE_SECRET;
  if (env.RESEND_API_KEY) return `derived-from-mail-key:${env.RESEND_API_KEY}`;
  processSecret ??= toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
  return processSecret;
}

/** Imported keys are cached per secret; importKey on every request is pure overhead. */
const keyCache = new Map<string, Promise<CryptoKey>>();

function signingKey(secret: string): Promise<CryptoKey> {
  let key = keyCache.get(secret);
  if (!key) {
    key = crypto.subtle.importKey("raw", encoder.encode(secret), ALGORITHM, false, ["sign", "verify"]);
    keyCache.set(secret, key);
  }
  return key;
}

/**
 * Mints a challenge. `now` and `bits` are injectable so the tests can issue a
 * token that is already old enough to submit and cheap enough to solve in
 * microseconds; application code never passes either.
 */
export async function issueChallenge(options: { now?: number; bits?: number } = {}): Promise<Challenge> {
  const { now = Date.now(), bits = PROOF_BITS } = options;
  const claims: Claims = { v: VERSION, iat: now, n: toBase64Url(crypto.getRandomValues(new Uint8Array(16))), d: bits };

  const payload = toBase64Url(encoder.encode(JSON.stringify(claims)));
  const signature = await crypto.subtle.sign(ALGORITHM, await signingKey(challengeSecret()), encoder.encode(payload));
  return { token: `${payload}.${toBase64Url(new Uint8Array(signature))}`, bits };
}

/** The claims of a token this server signed, or `null` for anything else. */
async function readClaims(token: string): Promise<Claims | null> {
  if (token.length > MAX_TOKEN_LENGTH) return null;

  const separator = token.indexOf(".");
  if (separator <= 0 || separator === token.length - 1) return null;
  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);

  let valid: boolean;
  try {
    valid = await crypto.subtle.verify(
      ALGORITHM,
      await signingKey(challengeSecret()),
      fromBase64Url(signature),
      encoder.encode(payload),
    );
  } catch {
    // Malformed base64 in the signature: indistinguishable from a bad one.
    return null;
  }
  if (!valid) return null;

  let claims: unknown;
  try {
    claims = JSON.parse(decoder.decode(fromBase64Url(payload)));
  } catch {
    return null;
  }
  if (typeof claims !== "object" || claims === null) return null;

  const { v, iat, n, d } = claims as Record<string, unknown>;
  if (v !== VERSION) return null;
  if (typeof iat !== "number" || !Number.isFinite(iat)) return null;
  if (typeof n !== "string" || n.length === 0 || n.length > 64) return null;
  if (typeof d !== "number" || !Number.isInteger(d) || d < 1 || d > 32) return null;
  return { v, iat, n, d };
}

/**
 * Checks a token and its proof without spending the token. `consumeChallenge`
 * is the step that spends it, and is called only when a message is actually
 * about to be sent, so a guest whose enquiry failed validation can correct it
 * and send again on the same token.
 */
export async function verifyChallenge(
  token: string | undefined,
  solution: string | undefined,
  now = Date.now(),
): Promise<ChallengeVerdict> {
  if (!token) return { ok: false, reason: "missing" };

  const claims = await readClaims(token);
  if (!claims) return { ok: false, reason: "invalid" };
  if (claims.iat > now + MAX_CLOCK_SKEW_MS) return { ok: false, reason: "invalid" };
  if (claims.iat + CHALLENGE_MAX_AGE_MS <= now) return { ok: false, reason: "expired" };
  if (now - claims.iat < CHALLENGE_MIN_AGE_MS) return { ok: false, reason: "too-fast" };
  if (isSpent(claims.n, now)) return { ok: false, reason: "replayed" };
  if (!solution || !(await verifyProof(token, solution, claims.d))) return { ok: false, reason: "unsolved" };

  return { ok: true, nonce: claims.n };
}

// --- The ledger of spent nonces ---------------------------------------------

const spent = new Map<string, number>();

/**
 * A ceiling on the ledger, for the same reason the rate limiter has one: a
 * flood of genuine submissions must not be able to grow memory without bound.
 * Entries expire with their token, so the ledger is small in normal use. The
 * ceiling holds at every insert; when the ledger is full the oldest entry goes
 * (Maps iterate in insertion order, so that is one delete).
 */
const MAX_SPENT = 50_000;
const SWEEP_INTERVAL_MS = 60_000;
let nextSweep = 0;

function sweep(now: number) {
  if (now < nextSweep) return;
  nextSweep = now + SWEEP_INTERVAL_MS;

  for (const [nonce, expiresAt] of spent) {
    if (expiresAt <= now) spent.delete(nonce);
  }
}

function isSpent(nonce: string, now: number): boolean {
  sweep(now);
  const expiresAt = spent.get(nonce);
  return expiresAt !== undefined && expiresAt > now;
}

/**
 * Spends a nonce. Returns `false` if it was already spent — two submissions
 * racing on the same token, of which only the first may send.
 */
export function consumeChallenge(nonce: string, now = Date.now()): boolean {
  if (isSpent(nonce, now)) return false;
  if (!spent.has(nonce) && spent.size >= MAX_SPENT) {
    const oldest = spent.keys().next();
    if (!oldest.done) spent.delete(oldest.value);
  }
  spent.set(nonce, now + CHALLENGE_MAX_AGE_MS);
  return true;
}

/** Test seam: forgets every spent nonce. Not used by application code. */
export function resetChallenges() {
  spent.clear();
  nextSweep = 0;
}

/** Test seam: how many spent nonces are held. Not used by application code. */
export function spentCount(): number {
  return spent.size;
}
