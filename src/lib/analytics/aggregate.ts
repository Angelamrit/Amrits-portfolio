import "server-only";
import { store } from "@/lib/store";
import { storedEventSchema, type Device, type StoredEvent } from "./schema";
import { utcDay } from "./record";

/**
 * Turns the append-only visit log into the numbers the dashboard shows.
 *
 * Everything is computed from the raw events on demand rather than kept as
 * running totals. That is the right trade at this size — a year of a
 * restaurant's traffic is a few megabytes of text — and it means a metric can
 * be added or a definition corrected without a migration, because the source
 * of truth is the events themselves and nothing is derived twice.
 */

/** The window of inactivity that ends a visit. Thirty minutes is the long-standing web-analytics convention. */
const SESSION_GAP_MS = 30 * 60 * 1000;

/** How recent a visit has to be to count as somebody on the site right now. */
const LIVE_WINDOW_MS = 5 * 60 * 1000;

const DAY_MS = 24 * 60 * 60 * 1000;

export const RANGES = [
  { key: "24h", label: "24 hours", days: 1 },
  { key: "7d", label: "7 days", days: 7 },
  { key: "30d", label: "30 days", days: 30 },
  { key: "90d", label: "90 days", days: 90 },
  { key: "12m", label: "12 months", days: 365 },
] as const;

export type RangeKey = (typeof RANGES)[number]["key"];

export function rangeFromKey(key: string | undefined): (typeof RANGES)[number] {
  return RANGES.find((range) => range.key === key) ?? RANGES[2];
}

export type Totals = {
  views: number;
  visitors: number;
  sessions: number;
  /** Pages looked at per visit. The single most telling number about whether the site holds attention. */
  viewsPerSession: number;
  /** Share of visits that were a single page and nothing more, 0–1. */
  bounceRate: number;
  /** Mean seconds between the first and last page of a visit. */
  avgSessionSeconds: number;
};

export type Point = { label: string; at: number; views: number; visitors: number };

export type Breakdown = { label: string; views: number; visitors: number };

export type Overview = {
  range: (typeof RANGES)[number];
  from: number;
  to: number;
  totals: Totals;
  /** The same totals over the period immediately before, for the change indicators. */
  previous: Totals | null;
  series: Point[];
  topPages: Breakdown[];
  referrers: Breakdown[];
  devices: { device: Device; views: number; share: number }[];
  countries: Breakdown[];
  /** Views by hour of the day, UTC, summed across the range. */
  hourly: number[];
  liveVisitors: number;
  recent: { at: number; path: string; referrer: string; device: Device; country?: string }[];
  /** The first day any visit was recorded, so the dashboard can say how much history it has. */
  trackingSince: string | null;
};

function parseLine(line: string): StoredEvent | null {
  try {
    const parsed = storedEventSchema.safeParse(JSON.parse(line));
    return parsed.success ? (parsed.data as StoredEvent) : null;
  } catch {
    return null;
  }
}

async function eventsBetween(fromMs: number, toMs: number): Promise<StoredEvent[]> {
  const available = await store.listEventDays();
  const wanted = available.filter((day) => day >= utcDay(fromMs) && day <= utcDay(toMs));

  const perDay = await Promise.all(wanted.map((day) => store.readEvents(day)));
  const events: StoredEvent[] = [];
  for (const lines of perDay) {
    for (const line of lines) {
      const event = parseLine(line);
      // The day files are whole UTC days, so the edges still have to be trimmed
      // to the exact window the dashboard asked for.
      if (event && event.t >= fromMs && event.t <= toMs) events.push(event);
    }
  }
  return events.sort((a, b) => a.t - b.t);
}

/** Splits one visitor's events into visits, breaking wherever they went quiet for longer than the gap. */
function sessionsOf(events: StoredEvent[]): StoredEvent[][] {
  const byVisitor = new Map<string, StoredEvent[]>();
  for (const event of events) {
    const list = byVisitor.get(event.v);
    if (list) list.push(event);
    else byVisitor.set(event.v, [event]);
  }

  const sessions: StoredEvent[][] = [];
  for (const visits of byVisitor.values()) {
    let current: StoredEvent[] = [];
    for (const event of visits) {
      const previous = current[current.length - 1];
      if (previous && event.t - previous.t > SESSION_GAP_MS) {
        sessions.push(current);
        current = [];
      }
      current.push(event);
    }
    if (current.length > 0) sessions.push(current);
  }
  return sessions;
}

function totalsOf(events: StoredEvent[]): Totals {
  const sessions = sessionsOf(events);
  const visitors = new Set(events.map((event) => event.v)).size;
  const bounced = sessions.filter((session) => session.length === 1).length;

  const totalSeconds = sessions.reduce((sum, session) => {
    const first = session[0];
    const last = session[session.length - 1];
    return sum + (last.t - first.t) / 1000;
  }, 0);

  return {
    views: events.length,
    visitors,
    sessions: sessions.length,
    viewsPerSession: sessions.length === 0 ? 0 : events.length / sessions.length,
    bounceRate: sessions.length === 0 ? 0 : bounced / sessions.length,
    avgSessionSeconds: sessions.length === 0 ? 0 : totalSeconds / sessions.length,
  };
}

function rank(events: StoredEvent[], keyOf: (event: StoredEvent) => string | undefined, limit: number): Breakdown[] {
  const buckets = new Map<string, { views: number; visitors: Set<string> }>();
  for (const event of events) {
    const key = keyOf(event);
    if (!key) continue;
    const bucket = buckets.get(key) ?? { views: 0, visitors: new Set<string>() };
    bucket.views += 1;
    bucket.visitors.add(event.v);
    buckets.set(key, bucket);
  }

  return [...buckets.entries()]
    .map(([label, bucket]) => ({ label, views: bucket.views, visitors: bucket.visitors.size }))
    .sort((a, b) => b.views - a.views || a.label.localeCompare(b.label))
    .slice(0, limit);
}

/**
 * A day range is plotted by day; the 24-hour range is plotted by hour, because
 * a single bar is not a chart. The bucket edges are built from the range
 * rather than from the data, so quiet periods show as gaps at zero instead of
 * being skipped and making the line lie about the shape of the traffic.
 */
function buildSeries(events: StoredEvent[], fromMs: number, toMs: number, days: number): Point[] {
  const hourly = days <= 1;
  const step = hourly ? 60 * 60 * 1000 : DAY_MS;
  const start = hourly ? Math.floor(fromMs / step) * step : Date.parse(`${utcDay(fromMs)}T00:00:00.000Z`);

  const buckets: Point[] = [];
  const index = new Map<number, Point>();
  for (let at = start; at <= toMs; at += step) {
    const date = new Date(at);
    const point: Point = {
      at,
      label: hourly
        ? `${String(date.getUTCHours()).padStart(2, "0")}:00`
        : date.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }),
      views: 0,
      visitors: 0,
    };
    buckets.push(point);
    index.set(at, point);
  }

  const seen = new Map<number, Set<string>>();
  for (const event of events) {
    const bucketAt = Math.floor((event.t - start) / step) * step + start;
    const point = index.get(bucketAt);
    if (!point) continue;
    point.views += 1;
    const visitors = seen.get(bucketAt) ?? new Set<string>();
    visitors.add(event.v);
    seen.set(bucketAt, visitors);
  }

  for (const [at, visitors] of seen) {
    const point = index.get(at);
    if (point) point.visitors = visitors.size;
  }

  return buckets;
}

/**
 * A short-lived memo.
 *
 * The dashboard's panels, its range switcher and its live counter all ask for
 * the same roll-up within a second or two of each other. Fifteen seconds is
 * long enough that a page load reads the log once, and short enough that the
 * live counter still deserves the name.
 */
const MEMO_TTL_MS = 15_000;
const memo = new Map<string, { at: number; value: Promise<Overview> }>();

export function getOverview(rangeKey: string | undefined, now = Date.now()): Promise<Overview> {
  const range = rangeFromKey(rangeKey);
  const cacheKey = `${range.key}:${Math.floor(now / MEMO_TTL_MS)}`;

  const cached = memo.get(cacheKey);
  if (cached) return cached.value;

  const value = computeOverview(range, now);
  memo.set(cacheKey, { at: now, value });
  for (const [key, entry] of memo) {
    if (now - entry.at > MEMO_TTL_MS * 4) memo.delete(key);
  }
  return value;
}

async function computeOverview(range: (typeof RANGES)[number], now: number): Promise<Overview> {
  const span = range.days * DAY_MS;
  const from = now - span;
  const previousFrom = from - span;

  const [current, previous, days] = await Promise.all([
    eventsBetween(from, now),
    // A year-long comparison would double the files read for a number nobody
    // reads on a site this age, so the longest range simply has no comparison.
    range.days > 90 ? Promise.resolve(null) : eventsBetween(previousFrom, from - 1),
    store.listEventDays(),
  ]);

  const liveFrom = now - LIVE_WINDOW_MS;
  const devices = rank(current, (event) => event.d, 3);
  const deviceViews = devices.reduce((sum, entry) => sum + entry.views, 0);

  return {
    range,
    from,
    to: now,
    totals: totalsOf(current),
    previous: previous ? totalsOf(previous) : null,
    series: buildSeries(current, from, now, range.days),
    topPages: rank(current, (event) => event.p, 8),
    referrers: rank(
      current,
      (event) => (event.r === "internal" ? undefined : event.r),
      6,
    ),
    devices: devices.map((entry) => ({
      device: entry.label as Device,
      views: entry.views,
      share: deviceViews === 0 ? 0 : entry.views / deviceViews,
    })),
    countries: rank(current, (event) => event.c, 6),
    hourly: current.reduce<number[]>(
      (hours, event) => {
        hours[new Date(event.t).getUTCHours()] += 1;
        return hours;
      },
      Array.from({ length: 24 }, () => 0),
    ),
    liveVisitors: new Set(current.filter((event) => event.t >= liveFrom).map((event) => event.v)).size,
    recent: current
      .slice(-10)
      .reverse()
      .map((event) => ({ at: event.t, path: event.p, referrer: event.r, device: event.d, country: event.c })),
    trackingSince: days[0] ?? null,
  };
}
