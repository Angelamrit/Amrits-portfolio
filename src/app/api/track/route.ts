import { after } from "next/server";
import { headers } from "next/headers";
import { beaconSchema } from "@/lib/analytics/schema";
import { recordPageView } from "@/lib/analytics/record";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { sameOrigin } from "@/lib/same-origin";

/**
 * Where the site's own visit counter posts.
 *
 * First-party and deliberately tiny: no third-party script, no cookie, nothing
 * that needs a consent banner, and one request per page a guest opens. The
 * response is always 204 with no body — there is nothing a caller should be
 * able to learn from it, including whether the visit was counted, since a
 * different answer for "you look like a bot" would just be a filter to tune
 * against.
 */

/** Longer than any honest beacon; short enough that a padded body is rejected before it is parsed. */
const MAX_BODY_BYTES = 2_048;

/**
 * Generous, because a real guest opening eight pages in a minute is normal
 * browsing. It is here to cap what one machine can write into the log, not to
 * police the pace of reading.
 */
const PER_IP = { limit: 120, windowMs: 60_000 };

const noStore = { "Cache-Control": "no-store", "Content-Length": "0" } as const;

export async function POST(request: Request) {
  const requestHeaders = await headers();

  if (!sameOrigin(requestHeaders)) {
    return new Response(null, { status: 403, headers: noStore });
  }

  const declaredLength = Number(requestHeaders.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return new Response(null, { status: 413, headers: noStore });
  }

  const verdict = rateLimit([{ key: `track:${clientIp(requestHeaders)}`, rule: PER_IP }]);
  if (!verdict.allowed) {
    return new Response(null, {
      status: 429,
      headers: { ...noStore, "Retry-After": String(verdict.retryAfterSeconds) },
    });
  }

  let payload: unknown;
  try {
    const body = await request.text();
    // `Content-Length` is a claim; this is the check that actually holds.
    if (body.length > MAX_BODY_BYTES) return new Response(null, { status: 413, headers: noStore });
    payload = JSON.parse(body);
  } catch {
    return new Response(null, { status: 400, headers: noStore });
  }

  const parsed = beaconSchema.safeParse(payload);
  if (!parsed.success) {
    return new Response(null, { status: 400, headers: noStore });
  }

  // The write happens after the response has gone out. A guest's page should
  // never wait on the site's own bookkeeping, and a slow or failing store
  // should not turn into a pending request in their browser.
  after(async () => {
    await recordPageView(parsed.data, requestHeaders);
  });

  return new Response(null, { status: 204, headers: noStore });
}
