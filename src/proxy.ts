import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, adminConfigured } from "@/lib/admin/config";
import { readSession } from "@/lib/admin/session";

/**
 * The gate in front of the dashboard.
 *
 * (In Next 16 this file is `proxy.ts`; it is the convention that used to be
 * called `middleware.ts`, renamed — same behaviour, new export name.)
 *
 * This is the optimistic check the Next.js authentication guide describes: it
 * reads and verifies the signed cookie, which is a few microseconds of HMAC
 * and no storage access, and turns anonymous requests around before a
 * dashboard route renders at all. Every action and page behind it checks again
 * through `requireAdmin`, because this layer is a convenience and a prefetch
 * guard, not the security boundary.
 *
 * The matcher covers only `/admin`, so nothing on the public site pays for it
 * — no page on this site becomes dynamic because of this file.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isLogin = pathname === "/admin/login";

  // With no credential configured there is nothing to sign in to, so every
  // dashboard URL collapses onto the login screen, which explains which
  // environment variable to set. There is no data to protect in this state —
  // the only thing that matters is that it cannot be walked past.
  if (!adminConfigured()) {
    return isLogin ? NextResponse.next() : NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const session = await readSession(request.cookies.get(SESSION_COOKIE)?.value);

  // A save posted from a dashboard page after the session ran out. Redirecting
  // it here would break the request and throw away the form; the action checks
  // the session itself and answers with a message the form can show. This
  // opens nothing: an action id can be posted to any path on the site, most of
  // which this proxy never sees, so it was never the check that protected them.
  if (!session && request.method === "POST" && request.headers.has("next-action")) {
    return NextResponse.next();
  }

  if (!session && !isLogin) {
    const login = new URL("/admin/login", request.url);
    // Round-trip where they were heading, so signing in lands on the page they
    // asked for. Only ever a path within /admin — see `requireAdmin`.
    login.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(login);
  }

  if (session && isLogin) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
