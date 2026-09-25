import "server-only";
import { env } from "@/lib/env";

/**
 * Fixed-window request counters held in the server's own memory.
 *
 * Deliberately dependency-free. The abuse that actually matters on this site is
 * someone hammering the enquiry action — to burn the Resend quota, to flood the
 * chef's inbox, or to have the guest auto-reply mail-bomb a third party whose
 * address they typed into the form. An in-process counter stops all three.
 *
 * The one limitation to know about: counters are per-instance. If the site is
 * ever scaled to several instances, or to a serverless platform that spins up
 * fresh workers, each one keeps its own counts and the effective limit is
 * multiplied by the number of live instances. When that day comes, swap the
 * body of `rateLimit` for a shared store (Upstash Redis, Vercel KV) — the
 * signature is all that callers depend on.
 */

export type Rule = {
  /** How many requests are allowed inside the window. */
  readonly limit: number;
  readonly windowMs: number;
};

export type Check = { readonly key: string; readonly rule: Rule };

export type Verdict = { allowed: true } | { allowed: false; retryAfterSeconds: number };

type Window = { count: number; resetAt: number };

const windows = new Map<string, Window>();

/**
 * A ceiling on the number of tracked keys. Without it, a flood of requests with
 * spoofed `X-Forwarded-For` values would be a memory-exhaustion vector: each
 * distinct value would add an entry that lives until its window expires.
 *
 * The ceiling holds at every insert, not only at the periodic sweep: a flood
 * fast enough to add a million keys inside one sweep interval would otherwise
 * get to keep them all for a minute. When the map is full the oldest entry
 * goes. Maps iterate in insertion order, so that is one delete, not a sort.
 */
const MAX_KEYS = 20_000;
const SWEEP_INTERVAL_MS = 60_000;
let nextSweep = 0;

/** Keys are addresses, and no address is longer than this; a forged header is not allowed to be. */
const MAX_KEY_LENGTH = 64;

function sweep(now: number) {
  if (now < nextSweep) return;
  nextSweep = now + SWEEP_INTERVAL_MS;

  for (const [key, window] of windows) {
    if (window.resetAt <= now) windows.delete(key);
  }
}

function evictIfFull() {
  if (windows.size < MAX_KEYS) return;
  const oldest = windows.keys().next();
  if (!oldest.done) windows.delete(oldest.value);
}

function peek(key: string, rule: Rule, now: number): Verdict {
  const window = windows.get(key);
  if (!window || window.resetAt <= now) return { allowed: true };
  if (window.count < rule.limit) return { allowed: true };
  return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((window.resetAt - now) / 1000)) };
}

function bump(key: string, rule: Rule, now: number) {
  const window = windows.get(key);
  if (!window || window.resetAt <= now) {
    if (!window) evictIfFull();
    windows.set(key, { count: 1, resetAt: now + rule.windowMs });
  } else {
    window.count += 1;
  }
}

/**
 * All-or-nothing across every rule: they are all read before any counter moves,
 * so a request turned away by the last rule does not spend budget against the
 * first. When several rules block, the longest wait is the one reported.
 *
 * `now` is injectable so a window can be tested without waiting for it to pass.
 */
export function rateLimit(checks: readonly Check[], now = Date.now()): Verdict {
  sweep(now);

  let worst: Verdict = { allowed: true };
  for (const { key, rule } of checks) {
    const verdict = peek(key, rule, now);
    if (!verdict.allowed && (worst.allowed || verdict.retryAfterSeconds > worst.retryAfterSeconds)) {
      worst = verdict;
    }
  }
  if (!worst.allowed) return worst;

  for (const { key, rule } of checks) bump(key, rule, now);
  return { allowed: true };
}

/** Test seam: drops every counter. Not used by application code. */
export function resetRateLimits() {
  windows.clear();
  nextSweep = 0;
}

/** Test seam: how many keys are being tracked. Not used by application code. */
export function trackedKeyCount(): number {
  return windows.size;
}

/**
 * Best-effort client address.
 *
 * These headers are only as trustworthy as the proxy in front of the app: a
 * client talking to the origin directly can put anything in `X-Forwarded-For`.
 * Behind Vercel, which overwrites both headers below at its edge, they are
 * reliable, and that is the deployment this defaults to.
 *
 * Other proxies append rather than overwrite, and then the first address in
 * `X-Forwarded-For` is whatever the client chose to send. For those,
 * `TRUSTED_IP_HEADER` names the one header the proxy is known to set itself
 * (Cloudflare: `cf-connecting-ip`; nginx with real_ip: `x-real-ip`), and
 * nothing else is consulted, so a client cannot rotate a forged header to
 * escape its own bucket. Whatever the source, the value is cut to the length
 * of an address, so a forged header cannot inflate a key either. The
 * `MAX_KEYS` ceiling above is what keeps a spoofed flood from costing memory.
 */
export function clientIp(headers: Headers): string {
  const trusted = env.TRUSTED_IP_HEADER;
  const address = trusted
    ? firstAddress(headers.get(trusted))
    : firstAddress(headers.get("x-forwarded-for")) ||
      firstAddress(headers.get("x-real-ip")) ||
      firstAddress(headers.get("cf-connecting-ip"));
  return address ?? "unknown";
}

function firstAddress(value: string | null): string | undefined {
  const first = value?.split(",")[0]?.trim().slice(0, MAX_KEY_LENGTH);
  return first || undefined;
}
