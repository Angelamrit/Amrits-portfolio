import "server-only";

/**
 * Per-client fixed-window rate limiter.
 *
 * The chat endpoint is public and unauthenticated, and the Gemini free tier is
 * capped per day, so one scripted loop could take the assistant offline for
 * every visitor.
 *
 * How much protection this actually gives — stated plainly, because it is easy
 * to overestimate:
 *
 * - The window map lives in process memory. Each serverless instance keeps its
 *   own copy, so on Vercel the effective limit is (instances x the limit below)
 *   and a caller spread across cold starts sees far more than MAX_REQUESTS_PER
 *   _WINDOW. Real protection against a determined caller needs a shared store.
 * - Client identity comes from HTTP headers, and a header is only as
 *   trustworthy as the proxy that sets it. Behind Vercel the platform headers
 *   below are set at the edge and cannot be forged by the caller. If the app is
 *   ever exposed directly, every one of them is caller-controlled and this
 *   becomes best-effort only.
 *
 * Treat this as a guard against accidental loops and casual abuse, not as a
 * security control.
 */

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 12;
/** Stop the map growing without bound on a long-lived process. */
const MAX_TRACKED_CLIENTS = 5000;

type Window = { count: number; resetAt: number };

const windows = new Map<string, Window>();

/**
 * Headers written by the platform edge rather than by the caller. On Vercel
 * (this project's deployment target) these are set after any caller-supplied
 * value is discarded, so they are the safest identity available here.
 */
const PLATFORM_IP_HEADERS = ["x-vercel-forwarded-for", "cf-connecting-ip"] as const;

/**
 * Best-effort caller identity.
 *
 * Deliberately does NOT take the leftmost `x-forwarded-for` entry. Vercel does
 * overwrite that header at the edge specifically to prevent IP spoofing, so on
 * Vercel alone the leftmost value is sound — but anywhere the header is merely
 * forwarded, the leftmost entry is caller-supplied and rotating it defeated the
 * limiter completely. The rightmost entry is the one appended by the nearest
 * proxy, so it is the safer choice and is identical on Vercel, where the header
 * carries a single address.
 *
 * `x-vercel-forwarded-for` is preferred over it because Vercel's own docs note
 * that `x-forwarded-for` can still be overwritten by a proxy layered on top.
 *
 * Callers that cannot be identified share a single bucket, which is the
 * conservative outcome — unidentified traffic is throttled together rather than
 * each request being treated as a fresh client.
 */
export function clientKey(request: Request): string {
  for (const header of PLATFORM_IP_HEADERS) {
    const value = request.headers.get(header)?.split(",")[0]?.trim();
    if (value) return value;
  }

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const hops = forwarded
      .split(",")
      .map((hop) => hop.trim())
      .filter(Boolean);
    if (hops.length > 0) return hops[hops.length - 1];
  }

  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSeconds: number };

export function checkRateLimit(key: string, now = Date.now()): RateLimitResult {
  const existing = windows.get(key);

  if (!existing || now >= existing.resetAt) {
    if (windows.size >= MAX_TRACKED_CLIENTS) {
      for (const [k, w] of windows) if (now >= w.resetAt) windows.delete(k);
      if (windows.size >= MAX_TRACKED_CLIENTS) windows.clear();
    }
    windows.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true };
  }

  if (existing.count >= MAX_REQUESTS_PER_WINDOW) {
    return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)) };
  }

  existing.count += 1;
  return { ok: true };
}

/** Test seam — resets the in-memory windows. */
export function resetRateLimits(): void {
  windows.clear();
}
