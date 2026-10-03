import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { store, type Store } from "@/lib/store";
import { passwordHash, plainPassword } from "./config";
import { hashPassword, verifyEnvPassword, verifyHash } from "./password";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "./password-rules";
import type { SessionClaims } from "./session";

/**
 * Which password opens the dashboard.
 *
 * There are two candidates. The environment's credential — `ADMIN_PASSWORD_HASH`
 * or `ADMIN_PASSWORD` — is the one the site is deployed with, and the switch
 * that turns the dashboard on at all. The dashboard's own "Change password"
 * screen writes a second one into the store, and from then on that one is the
 * password and the environment's is not. It has to be that way round:
 * otherwise the old password would stay valid for ever, and anyone who had it
 * (an old deploy log, a colleague who has moved on) could still sign in after
 * the chef thought he had changed it.
 *
 * Recovery. A stored credential records a fingerprint of the environment
 * credential it replaced. Set a *new* `ADMIN_PASSWORD_HASH` on the server and
 * redeploy, and the fingerprint no longer matches, so the stored credential is
 * set aside and the new environment password wins. That is the way back in
 * after a forgotten dashboard password, and it needs nothing but the hosting
 * provider's settings page — no database console, no deleted keys.
 *
 * Sessions. Every session cookie names the credential it was issued under
 * (`cred` in its claims). `auth.ts` compares that with the credential in force
 * on every request, so changing the password signs out every other phone and
 * computer at once — the browser that made the change is handed a fresh cookie
 * — while the proxy in front of the dashboard, which must not touch storage,
 * carries on checking signatures alone. See the note in `session.ts`.
 */

/** The store document the dashboard-set password lives in. Never copied between sites: see `store/migrate.ts`. */
export const CREDENTIAL_DOC = "admin-credential";

/** The `cred` claim of a session issued under the environment's password. */
export const ENV_CREDENTIAL_ID = "env";

export type StoredCredential = {
  v: 1;
  /** Random, new on every change; sessions carry it so a change can tell old cookies from new. */
  id: string;
  /** The same `scrypt:…` format as ADMIN_PASSWORD_HASH. */
  hash: string;
  /** Epoch milliseconds. */
  changedAt: number;
  /** Fingerprint of the environment credential this replaced. A different one on the server means this has been reset. */
  replaces: string;
};

export type ActiveCredential = {
  source: "environment" | "dashboard";
  /** What sessions issued under this credential carry in their `cred` claim. */
  id: string;
  /** When the dashboard's password was last changed; absent for the environment's. */
  changedAt?: number;
  verify(password: string): Promise<boolean>;
};

export type ChangeOutcome =
  | { ok: true; id: string }
  | { ok: false; reason: "not-configured" | "wrong-current" | "unchanged" | "too-short" | "too-long" };

/** The two store calls this needs, so the tests can hand in a Map. */
export type CredentialDocs = Pick<Store, "readDoc" | "writeDoc">;

/**
 * A stable, non-reversible mark of the environment credential as it is now.
 * For a hash it fingerprints the hash, which is already safe to expose; for a
 * plain-text password it is no weaker than the session signatures that are
 * already derived from it (see `sessionSecret` in config.ts).
 */
function envFingerprint(): string | undefined {
  const credential = passwordHash() ?? plainPassword();
  if (!credential) return undefined;
  return createHash("sha256").update(`admin-credential:${credential}`).digest("base64url").slice(0, 32);
}

function isStoredCredential(value: unknown): value is StoredCredential {
  if (!value || typeof value !== "object") return false;
  const c = value as Record<string, unknown>;
  return (
    c.v === 1 &&
    typeof c.id === "string" &&
    c.id.length > 0 &&
    c.id !== ENV_CREDENTIAL_ID &&
    typeof c.hash === "string" &&
    typeof c.changedAt === "number" &&
    typeof c.replaces === "string"
  );
}

export function createCredentialManager(docs: CredentialDocs) {
  /**
   * The dashboard-set credential, or `null` when there is none, it is not
   * something this server understands, or it predates the environment
   * credential now on the server (which is how a reset is expressed).
   */
  async function stored(fingerprint: string): Promise<StoredCredential | null> {
    const raw = await docs.readDoc<unknown>(CREDENTIAL_DOC);
    if (raw === null) return null;
    if (!isStoredCredential(raw)) {
      console.error(`[admin] ${CREDENTIAL_DOC} is not a credential this server understands; using the server's password.`);
      return null;
    }
    return raw.replaces === fingerprint ? raw : null;
  }

  /**
   * The credential in force, or `null` when nothing can sign in: the
   * dashboard is not configured, or storage could not be read. The second
   * case fails closed on purpose — a password check whose answer is unknown
   * is not a pass — and says so in the log.
   */
  async function active(): Promise<ActiveCredential | null> {
    const fingerprint = envFingerprint();
    if (!fingerprint) return null;

    let current: StoredCredential | null;
    try {
      current = await stored(fingerprint);
    } catch (error) {
      console.error("[admin] could not read the stored password, so no sign-in can be accepted until storage is back:", error);
      return null;
    }

    if (current) {
      const { id, hash, changedAt } = current;
      return { source: "dashboard", id, changedAt, verify: (password) => verifyHash(password, hash) };
    }
    return { source: "environment", id: ENV_CREDENTIAL_ID, verify: verifyEnvPassword };
  }

  /**
   * Replaces the password, having checked the current one. Throws only if the
   * store refuses the write, which the caller reports as "nothing changed".
   */
  async function change({
    current,
    next,
    now = Date.now(),
  }: {
    current: string;
    next: string;
    now?: number;
  }): Promise<ChangeOutcome> {
    if (next.length < MIN_PASSWORD_LENGTH) return { ok: false, reason: "too-short" };
    if (next.length > MAX_PASSWORD_LENGTH) return { ok: false, reason: "too-long" };

    const fingerprint = envFingerprint();
    const inForce = await active();
    if (!fingerprint || !inForce) return { ok: false, reason: "not-configured" };
    if (!(await inForce.verify(current))) return { ok: false, reason: "wrong-current" };
    // The same characters typed on a different keyboard are the same password.
    if (next.normalize("NFKC") === current.normalize("NFKC")) return { ok: false, reason: "unchanged" };

    const credential: StoredCredential = {
      v: 1,
      id: randomBytes(12).toString("base64url"),
      hash: await hashPassword(next),
      changedAt: now,
      replaces: fingerprint,
    };
    await docs.writeDoc(CREDENTIAL_DOC, credential);
    return { ok: true, id: credential.id };
  }

  return { active, change };
}

/**
 * Whether a session whose signature has already been checked was issued under
 * the credential now in force. A session from before a password change is
 * genuinely signed and not yet expired, and is still refused.
 */
export function sessionIsCurrent(claims: SessionClaims, active: ActiveCredential | null): boolean {
  return active !== null && claims.cred === active.id;
}

export const credentials = createCredentialManager(store);
