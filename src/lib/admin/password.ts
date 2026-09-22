import "server-only";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { passwordHash, plainPassword } from "./config";

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

/**
 * scrypt parameters.
 *
 * N = 2^15 costs roughly 100ms and 32MB per attempt on a normal server, which
 * is the point: a stolen hash is not worth grinding, and one login a day does
 * not notice. `maxmem` has to be raised explicitly — scrypt needs 128·N·r
 * bytes, which is 33.5MB here, just over Node's 32MB default, and without this
 * the call fails with a memory error rather than a wrong-password error.
 */
const N = 2 ** 15;
const R = 8;
const P = 1;
const KEYLEN = 32;
const MAXMEM = 64 * 1024 * 1024;

const PREFIX = "scrypt";

/**
 * `scrypt:N:r:p:salt:hash`, the two byte strings in base64url.
 *
 * The obvious encoding for this is the modular crypt format everything else
 * uses — `$scrypt$...$...` — and it was the first thing here. It does not
 * survive a `.env` file. Next.js expands `$NAME` references in environment
 * files, so a hash containing `$jOkqGPeEs…` has that run of characters
 * substituted with an empty string on the way in, and the server then rejects
 * the correct password with no clue as to why.
 *
 * Colons and base64url (no `+`, `/`, `=` or `$`) are inert in a `.env` file, in
 * a shell, in YAML and in a hosting provider's environment editor. The string
 * still carries its own cost parameters, so raising them later does not
 * invalidate a hash generated today.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scryptAsync(password.normalize("NFKC"), salt, KEYLEN, {
    N,
    r: R,
    p: P,
    maxmem: MAXMEM,
  });
  return [PREFIX, N, R, P, salt.toString("base64url"), derived.toString("base64url")].join(":");
}

async function matchesHash(password: string, encoded: string): Promise<boolean> {
  const parts = encoded.split(":");
  if (parts.length !== 6 || parts[0] !== PREFIX) return false;

  const [, n, r, p, saltB64, hashB64] = parts;
  const cost = { N: Number(n), r: Number(r), p: Number(p) };
  if (!Number.isInteger(cost.N) || !Number.isInteger(cost.r) || !Number.isInteger(cost.p)) return false;
  // A hash claiming an absurd cost would be a denial-of-service on every login.
  if (cost.N > 2 ** 20 || cost.r > 32 || cost.p > 16) return false;

  const expected = Buffer.from(hashB64, "base64url");
  const derived = await scryptAsync(password.normalize("NFKC"), Buffer.from(saltB64, "base64url"), expected.length, {
    ...cost,
    maxmem: MAXMEM,
  });
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}

/**
 * Compares a submitted password against whatever credential is configured.
 *
 * The plain-text branch still goes through `timingSafeEqual` rather than `===`.
 * A plain comparison returns as soon as two bytes differ, which leaks the
 * length of the correct prefix to anyone timing the responses precisely enough
 * — a slow way to guess a password one character at a time, but a real one.
 */
export async function verifyPassword(submitted: string): Promise<boolean> {
  const encoded = passwordHash();
  if (encoded) return matchesHash(submitted, encoded);

  const plain = plainPassword();
  if (!plain) return false;

  const a = Buffer.from(submitted.normalize("NFKC"), "utf8");
  const b = Buffer.from(plain.normalize("NFKC"), "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}
