import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  SESSION_REFRESH_AFTER_SECONDS,
  SESSION_TTL_SECONDS,
  adminConfigured,
} from "./config";
import { issueSession, readSession, type SessionClaims } from "./session";

/**
 * The access layer every admin page and every admin action goes through.
 *
 * `proxy.ts` already turns unauthenticated requests away before a route
 * renders, and that check is worth having — it stops a prefetch from ever
 * reaching the dashboard. It is not, however, the security boundary. Proxy
 * configuration is one `matcher` typo away from not running, and Server
 * Actions are POST endpoints that exist whether or not a page linked to them.
 * So every action calls `requireAdmin` again, right next to the data it is
 * about to change. Two checks, and only the inner one is load-bearing.
 */

/**
 * Deduplicated per request: an admin page, its layout and its actions can all
 * ask without repeating the HMAC verification.
 */
export const currentSession = cache(async (): Promise<SessionClaims | null> => {
  if (!adminConfigured()) return null;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return readSession(token);
});

/** For pages and layouts: sends a signed-out visitor to the login screen. */
export async function requireAdmin(returnTo?: string): Promise<SessionClaims> {
  const session = await currentSession();
  if (session) return session;

  const target = returnTo && returnTo.startsWith("/admin") ? `?next=${encodeURIComponent(returnTo)}` : "";
  redirect(`/admin/login${target}`);
}

/**
 * For Server Actions, which should answer with a message the form can show
 * rather than a redirect that loses what the user had typed.
 */
export async function isSignedIn(): Promise<boolean> {
  return (await currentSession()) !== null;
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    // Off in development so the dashboard works over plain http on localhost;
    // on everywhere else, so the cookie is never sent in the clear.
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

/** Only callable from a Server Action or Route Handler — cookies cannot be set while a page streams. */
export async function startSession(): Promise<boolean> {
  const token = await issueSession();
  if (!token) return false;
  (await cookies()).set(SESSION_COOKIE, token, cookieOptions(SESSION_TTL_SECONDS));
  return true;
}

export async function endSession(): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, "", cookieOptions(0));
}

/**
 * Slides the expiry forward while the dashboard is in use.
 *
 * Called from the admin actions rather than from the layout, because setting a
 * cookie during a page render is not allowed. The effect is that someone
 * working in the dashboard stays signed in, while a tab left open overnight
 * with no activity expires on schedule.
 */
export async function refreshSessionIfStale(): Promise<void> {
  const session = await currentSession();
  if (!session) return;

  const secondsLeft = session.exp - Math.floor(Date.now() / 1000);
  if (secondsLeft > SESSION_REFRESH_AFTER_SECONDS) return;

  await startSession();
}
