/**
 * Admin configuration, read straight from the environment.
 *
 * Deliberately not part of `src/lib/env.ts`, which is marked `server-only`:
 * `proxy.ts` has to check a session before a route renders and so imports the
 * session module, which imports this. Nothing here is validated with a schema
 * that throws either — an invalid admin password must never take down the
 * public site. Instead the dashboard refuses to open and says exactly which
 * variable is missing.
 *
 * One variable is enough to turn the dashboard on:
 *
 *   ADMIN_PASSWORD_HASH   preferred — a scrypt hash from `npm run admin:password`
 *   ADMIN_PASSWORD        accepted — the password in plain text
 *
 * The hash is preferred because anything that can read the environment (a
 * leaked deploy log, a misconfigured error page, a colleague with dashboard
 * access at the host) then learns nothing it can sign in with. Both are
 * supported because a chef who is handed this site should not need a terminal
 * to change his own password.
 */

export const SESSION_COOKIE = "chef_admin_session";

/** Twelve hours: long enough for a working session, short enough that a forgotten login expires. */
export const SESSION_TTL_SECONDS = 12 * 60 * 60;

/** Refresh the cookie once less than half the window is left, so active work never logs out mid-edit. */
export const SESSION_REFRESH_AFTER_SECONDS = SESSION_TTL_SECONDS / 2;

function readTrimmed(name: string): string | undefined {
  const value = process.env[name];
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed.length > 0 ? trimmed : undefined;
}

export function passwordHash(): string | undefined {
  return readTrimmed("ADMIN_PASSWORD_HASH");
}

export function plainPassword(): string | undefined {
  return readTrimmed("ADMIN_PASSWORD");
}

/** Whether a credential of either kind is configured. Without one, `/admin` stays shut. */
export function adminConfigured(): boolean {
  return Boolean(passwordHash() ?? plainPassword());
}

/**
 * The key session cookies are signed with.
 *
 * `ADMIN_SESSION_SECRET` wins when it is set. Otherwise it is derived from the
 * configured credential, which keeps single-variable setup working and has a
 * useful property of its own: changing the password changes the signing key,
 * so every existing session is invalidated by the password change rather than
 * outliving it. Returns `undefined` when nothing is configured, and every
 * caller treats that as "no session can be valid".
 */
export function sessionSecret(): string | undefined {
  const explicit = readTrimmed("ADMIN_SESSION_SECRET");
  if (explicit) return explicit;

  const credential = passwordHash() ?? plainPassword();
  return credential ? `derived-from-credential:${credential}` : undefined;
}

/** Reported on the dashboard's system panel so a weaker setup is visible, not silent. */
export function credentialKind(): "hash" | "plain" | "none" {
  if (passwordHash()) return "hash";
  if (plainPassword()) return "plain";
  return "none";
}
