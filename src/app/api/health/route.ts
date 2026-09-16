import { emailConfigured } from "@/lib/env";

/**
 * A cheap, unauthenticated liveness check for load balancers and uptime
 * monitors: something to hit that isn't a full page render. Reachability
 * alone proves the server is up; `mailer` is included because a server that
 * responds but cannot deliver an enquiry is a failure a monitor should also
 * be able to catch, not just a guest.
 *
 * Deliberately never cached, and deliberately reveals nothing beyond these
 * two booleans-worth of state — no version, no environment values.
 */
export async function GET() {
  return Response.json(
    { status: "ok", mailer: emailConfigured },
    { headers: { "Cache-Control": "no-store" } },
  );
}
