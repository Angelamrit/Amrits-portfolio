import { SESSION_TTL_SECONDS, sessionSecret } from "./config";

/**
 * Signed, stateless admin sessions.
 *
 * The cookie carries its own claims and an HMAC over them, so there is no
 * session table to keep and nothing to look up on a request. That matters more
 * than usual here: `proxy.ts` checks the session before every `/admin` route
 * renders, and a storage read on that path would put a file hit in front of
 * every navigation and prefetch.
 *
 * Built on Web Crypto rather than `node:crypto` on purpose. Next 16 runs Proxy
 * on the Node runtime, but Web Crypto is the API both runtimes share, so this
 * module stays valid if any of it is ever moved to the edge.
 *
 * What a cookie can and cannot do, stated plainly: the signature proves the
 * claims were issued by this server and have not been edited, and the `exp`
 * claim bounds how long that holds. It cannot be revoked before it expires.
 * The lever for "log everyone out now" is changing the password, because the
 * signing key is derived from the credential (see `config.ts`).
 */

const ALGORITHM = { name: "HMAC", hash: "SHA-256" } as const;
const VERSION = 1;

export type SessionClaims = {
  v: number;
  /** Only ever "admin" today; present so a second role can be added without a new cookie format. */
  sub: string;
  /** Issued at, epoch seconds. */
  iat: number;
  /** Expires at, epoch seconds. */
  exp: number;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/** Imported keys are cached per secret, since importKey on every request is pure overhead. */
const keyCache = new Map<string, Promise<CryptoKey>>();

function signingKey(secret: string): Promise<CryptoKey> {
  let key = keyCache.get(secret);
  if (!key) {
    key = crypto.subtle.importKey("raw", encoder.encode(secret), ALGORITHM, false, ["sign", "verify"]);
    keyCache.set(secret, key);
  }
  return key;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Returns `undefined` when no credential is configured, which is how the dashboard stays shut by default. */
export async function issueSession(now = Date.now()): Promise<string | undefined> {
  const secret = sessionSecret();
  if (!secret) return undefined;

  const issuedAt = Math.floor(now / 1000);
  const claims: SessionClaims = { v: VERSION, sub: "admin", iat: issuedAt, exp: issuedAt + SESSION_TTL_SECONDS };

  const payload = toBase64Url(encoder.encode(JSON.stringify(claims)));
  const signature = await crypto.subtle.sign(ALGORITHM, await signingKey(secret), encoder.encode(payload));
  return `${payload}.${toBase64Url(new Uint8Array(signature))}`;
}

/**
 * Verifies a token and returns its claims, or `null` for anything wrong with
 * it — missing, malformed, wrongly signed, expired, or signed under a secret
 * that no longer exists. Callers only ever need "valid or not", and collapsing
 * every failure into `null` keeps a caller from accidentally treating, say, an
 * expired-but-authentic token as partially trustworthy.
 */
export async function readSession(token: string | undefined | null, now = Date.now()): Promise<SessionClaims | null> {
  if (!token) return null;

  const secret = sessionSecret();
  if (!secret) return null;

  const separator = token.indexOf(".");
  if (separator <= 0 || separator === token.length - 1) return null;

  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);

  let valid: boolean;
  try {
    valid = await crypto.subtle.verify(
      ALGORITHM,
      await signingKey(secret),
      fromBase64Url(signature),
      encoder.encode(payload),
    );
  } catch {
    // Malformed base64 in the signature: indistinguishable from a bad one.
    return null;
  }
  if (!valid) return null;

  let claims: SessionClaims;
  try {
    claims = JSON.parse(decoder.decode(fromBase64Url(payload))) as SessionClaims;
  } catch {
    return null;
  }

  if (claims.v !== VERSION || claims.sub !== "admin") return null;
  if (typeof claims.exp !== "number" || claims.exp * 1000 <= now) return null;

  return claims;
}
