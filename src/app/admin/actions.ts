"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { adminConfigured } from "@/lib/admin/config";
import { endSession, startSession } from "@/lib/admin/auth";
import { verifyPassword } from "@/lib/admin/password";
import { clientIp, rateLimit } from "@/lib/rate-limit";

/**
 * Signing in and out.
 *
 * A Server Action is a public POST endpoint whether or not a page links to it,
 * so this file assumes it is being called by someone hostile and checks
 * everything itself: the shape of the input, how often this address has tried,
 * and where it is being asked to redirect to afterwards.
 */

export type LoginState = { error?: string };

const credentials = z.object({
  password: z.string().min(1, "Enter the password.").max(256),
  next: z.string().optional(),
});

/**
 * Two limits, because they stop different attacks.
 *
 * Per address stops the obvious one: a script working through a word list from
 * a single machine. The global limit is the backstop for the same guessing
 * spread across many addresses, which the per-address rule cannot see. It is
 * set well above what one person signing in ever needs, so a real owner is
 * never locked out by it — but a distributed run at the password is.
 */
const PER_IP = { limit: 8, windowMs: 15 * 60_000 };
const GLOBAL = { limit: 60, windowMs: 15 * 60_000 };

/**
 * One message for every kind of failure.
 *
 * "No password is configured", "wrong password" and "too many attempts" are
 * three different facts, and telling them apart is free reconnaissance. The
 * server logs the real reason; the screen says the same sentence each time.
 */
const REFUSED = "That password was not recognised.";

export async function signIn(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = credentials.safeParse({
    password: formData.get("password"),
    next: formData.get("next"),
  });

  if (!parsed.success) return { error: REFUSED };

  const ip = clientIp(await headers());
  const verdict = rateLimit([
    { key: `admin-login:${ip}`, rule: PER_IP },
    { key: "admin-login:global", rule: GLOBAL },
  ]);

  if (!verdict.allowed) {
    console.warn(`[admin] login rate-limited for ${ip}`);
    return { error: `Too many attempts. Try again in ${Math.ceil(verdict.retryAfterSeconds / 60)} minutes.` };
  }

  if (!adminConfigured()) {
    console.error("[admin] a sign-in was attempted but no ADMIN_PASSWORD_HASH or ADMIN_PASSWORD is set.");
    return { error: REFUSED };
  }

  if (!(await verifyPassword(parsed.data.password))) {
    console.warn(`[admin] failed sign-in from ${ip}`);
    return { error: REFUSED };
  }

  if (!(await startSession())) return { error: REFUSED };

  console.info(`[admin] signed in from ${ip}`);

  // Only ever back into the dashboard. Without this check the `next` parameter
  // is an open redirect: a link to this site's own login could bounce someone
  // to an attacker's page, wearing this site's domain in the address bar.
  const requested = parsed.data.next ?? "";
  const safe = /^\/admin(\/|$|\?)/.test(requested) && !requested.includes("..") && !requested.includes("\\");
  const destination = safe ? requested : "/admin";
  redirect(destination);
}

export async function signOut(): Promise<void> {
  await endSession();
  redirect("/admin/login");
}
