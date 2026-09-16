import type { Instrumentation } from "next";

/**
 * Runs once, in each new server instance, before any request is served.
 *
 * The only job here is to check, at the top of the logs, that this server can
 * actually deliver an enquiry. Without it the misconfiguration is invisible:
 * the form would keep thanking guests while their enquiries went to a log file
 * nobody reads. It reports rather than throws, because taking the whole site
 * down over the mailer would be a worse failure than the one it prevents.
 *
 * The import is dynamic and behind the runtime guard because the environment
 * module is Node-only; `register` is also invoked for the edge runtime, where
 * it should do nothing.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { reportRuntimeEnv } = await import("@/lib/env");
  reportRuntimeEnv();
}

/**
 * Every uncaught error from a Server Component, Route Handler or Server
 * Action passes through here before Next.js turns it into the generic 500 a
 * visitor sees. Without this export, that error exists only as whatever the
 * platform's raw stdout capture happens to keep — on a host with no log
 * retention, a crash produces no trace at all once the response has gone out.
 *
 * This does not stop a crash from happening; nothing here can. What it buys
 * is knowing one happened: one structured line per failure, with the route
 * and the request that triggered it, so a spike in errors is visible in logs
 * rather than showing up first as a guest complaint. `digest` is what
 * connects this line back to the opaque error id shown on the visitor's page.
 */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  const digest =
    typeof error === "object" && error !== null && "digest" in error ? String(error.digest) : undefined;
  const message = error instanceof Error ? error.message : String(error);

  console.error("[server-error]", {
    digest,
    message,
    path: request.path,
    method: request.method,
    routeType: context.routeType,
    routePath: context.routePath,
  });
};
