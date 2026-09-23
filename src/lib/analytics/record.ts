import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { store } from "@/lib/store";
import { clientIp } from "@/lib/rate-limit";
import type { BeaconPayload, Device, StoredEvent } from "./schema";

/** Days of history kept. Beyond this the roll-ups are not interesting and the files are just weight. */
const RETENTION_DAYS = 400;

/** The ISO day an instant belongs to, in UTC, which is what partitions the log files. */
export function utcDay(at: number | Date = Date.now()): string {
  return new Date(at).toISOString().slice(0, 10);
}

/**
 * The salt behind the visitor hash.
 *
 * It is random, it is stored rather than derived from anything guessable, and
 * it is mixed with the date so that it effectively rotates every day. That
 * rotation is the whole privacy story: without it, a hash of IP + user agent
 * would be a stable pseudonym that follows a person across months, which is
 * the thing this is deliberately not.
 */
let cachedSalt: Promise<string> | undefined;

function analyticsSalt(): Promise<string> {
  cachedSalt ??= (async () => {
    const existing = await store.readDoc<{ salt: string }>("analytics-salt");
    if (existing?.salt) return existing.salt;

    const salt = randomBytes(32).toString("base64");
    await store.writeDoc("analytics-salt", { salt, createdAt: Date.now() });
    return salt;
  })().catch((error) => {
    // A store that cannot be read must not stop the site from serving. A
    // process-lifetime salt still anonymises; it just means restarts split
    // visitor counts, which is a far better failure than a 500 on a beacon.
    console.error("[analytics] could not load the visitor salt, using a temporary one:", error);
    return randomBytes(32).toString("base64");
  });
  return cachedSalt;
}

async function visitorHash(ip: string, userAgent: string, day: string): Promise<string> {
  const salt = await analyticsSalt();
  return createHash("sha256").update(`${salt}|${day}|${ip}|${userAgent}`).digest("hex").slice(0, 16);
}

/**
 * Obvious automated traffic, dropped before it reaches the log.
 *
 * This is not a security control and does not try to be exhaustive — anything
 * determined to look human will. It exists so the chef's numbers mean what he
 * thinks they mean rather than counting uptime monitors and link previews.
 * The beacon itself does most of the work, since it needs JavaScript to fire.
 */
const BOT_PATTERN =
  /bot|crawler|spider|crawl|slurp|facebookexternalhit|headless|lighthouse|pingdom|uptime|monitor|preview|curl|wget|python-requests|axios|postman|scrapy|semrush|ahrefs|screaming frog|gptbot|claudebot|perplexity/i;

export function looksAutomated(userAgent: string): boolean {
  return userAgent.length === 0 || BOT_PATTERN.test(userAgent);
}

function deviceFrom(width: number | undefined, userAgent: string): Device {
  if (typeof width === "number" && width > 0) {
    if (width < 768) return "mobile";
    if (width < 1180) return "tablet";
    return "desktop";
  }
  if (/iPad|Tablet/i.test(userAgent)) return "tablet";
  if (/Mobi|Android|iPhone/i.test(userAgent)) return "mobile";
  return "desktop";
}

/** Trailing slashes and query strings collapsed away, so `/menus` and `/menus/?x=1` are one page. */
function normalisePath(path: string): string {
  const withoutQuery = path.split(/[?#]/)[0] ?? "/";
  const trimmed = withoutQuery.replace(/\/+$/, "");
  const normalised = trimmed.length === 0 ? "/" : trimmed;
  return normalised.slice(0, 128);
}

/**
 * Where the visit came from, reduced to a host.
 *
 * Full referrer URLs are not kept: they are the one field in a request that
 * routinely carries somebody else's private path, and the host alone answers
 * the question the dashboard asks.
 */
function referrerSource(referrer: string, selfHost: string | null): string {
  if (!referrer) return "direct";
  try {
    const host = new URL(referrer).host.replace(/^www\./, "");
    if (!host) return "direct";
    if (selfHost && host === selfHost.replace(/^www\./, "")) return "internal";
    return host.slice(0, 96);
  } catch {
    return "direct";
  }
}

function countryFrom(headers: Headers): string | undefined {
  const raw =
    headers.get("x-vercel-ip-country") ??
    headers.get("cf-ipcountry") ??
    headers.get("x-geo-country") ??
    headers.get("fly-client-ip-country");
  if (!raw) return undefined;
  const code = raw.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : undefined;
}

/** Runs at most once a day per process: cheap enough to check inline, no scheduler needed. */
let lastPruneDay = "";

async function pruneOccasionally(today: string) {
  if (lastPruneDay === today) return;
  lastPruneDay = today;

  const cutoff = utcDay(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
  try {
    const removed = await store.pruneEventsBefore(cutoff);
    if (removed > 0) console.info(`[analytics] pruned ${removed} day(s) of events older than ${cutoff}.`);
  } catch (error) {
    console.error("[analytics] prune failed:", error);
  }
}

/**
 * Records one visit. Never throws: a failure here is a missing row on a chart,
 * and must not become an error on the page the guest is reading.
 */
export async function recordPageView(payload: BeaconPayload, headers: Headers): Promise<boolean> {
  const userAgent = headers.get("user-agent") ?? "";
  if (looksAutomated(userAgent)) return false;

  const now = Date.now();
  const day = utcDay(now);

  try {
    const event: StoredEvent = {
      t: now,
      p: normalisePath(payload.path),
      r: referrerSource(payload.referrer ?? "", headers.get("host")),
      v: await visitorHash(clientIp(headers), userAgent, day),
      d: deviceFrom(payload.width, userAgent),
      ...(countryFrom(headers) ? { c: countryFrom(headers) } : {}),
    };

    await store.appendEvent(day, JSON.stringify(event));
    void pruneOccasionally(day);
    return true;
  } catch (error) {
    console.error("[analytics] could not record a page view:", error);
    return false;
  }
}
