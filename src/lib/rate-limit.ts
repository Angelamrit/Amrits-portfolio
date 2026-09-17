import "server-only";

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
 */
const MAX_KEYS = 20_000;
const SWEEP_INTERVAL_MS = 60_000;
let nextSweep = 0;

function sweep(now: number) {
  if (now < nextSweep) return;
  nextSweep = now + SWEEP_INTERVAL_MS;

  for (const [key, window] of windows) {
    if (window.resetAt <= now) windows.delete(key);
  }

  if (windows.size > MAX_KEYS) {
    const byExpiry = [...windows.entries()].sort((a, b) => a[1].resetAt - b[1].resetAt);
    for (const [key] of byExpiry.slice(0, windows.size - MAX_KEYS)) windows.delete(key);
  }
}

function peek(key: string, rule: Rule, now: number): Verdict {
  const window = windows.get(key);
  if (!window || window.resetAt <= now) return { allowed: true };
  if (window.count < rule.limit) return { allowed: true };
  return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((window.resetAt - now) / 1000)) };
}

function bump(key: string, rule: Rule, now: number) {
  const window = windows.get(key);
  if (!window || window.resetAt <= now) windows.set(key, { count: 1, resetAt: now + rule.windowMs });
  else window.count += 1;
}

/**
 * All-or-nothing across every rule: they are all read before any counter moves,
 * so a request turned away by the last rule does not spend budget against the
 * first. When several rules block, the longest wait is the one reported.
 */
export function rateLimit(checks: readonly Check[]): Verdict {
  const now = Date.now();
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

/**
 * Best-effort client address.
 *
 * These headers are only as trustworthy as the proxy in front of the app: a
 * client talking to the origin directly can put anything in `X-Forwarded-For`.
 * Behind Vercel, Cloudflare or any reverse proxy that overwrites them they are
 * reliable, and that is how this site is meant to be deployed. The `MAX_KEYS`
 * ceiling above is what keeps a spoofed flood from costing anything.
 */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() || headers.get("cf-connecting-ip")?.trim() || "unknown";
}
