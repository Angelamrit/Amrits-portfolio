import "server-only";
import { replaceEventDay, type KeyValue } from "./cloud-store";
import type { Store } from "./types";

/**
 * Copies the dashboard's data from one store to another — in practice, from
 * the `.data` folder on the computer the site was built on to the cloud store
 * the live site uses on Vercel. Run through `npm run data:migrate`.
 *
 * Safe to run more than once, and safe to run after the live site has started
 * collecting data of its own:
 *
 *   photos   copied every time (keys are unique per upload, so this only ever
 *            rewrites the same photo). Any too large for Vercel are shrunk on
 *            the way, and the width and height recorded for them follow.
 *   content  copied, unless the live site already holds a *different* version
 *            of a document — the chef may have edited the menu there — in
 *            which case nothing at all is written until `force` is given.
 *   visits   merged per day with whatever the live site has recorded, so
 *            running this never erases a visit.
 */

/** Obsolete since the bookings screens were removed, and full of guests' details: it stays on this computer. */
const SKIP_DOCS = new Set(["bookings"]);

/** The live site's own salt wins: replacing it mid-day would count every visitor twice. */
const KEEP_LIVE_DOCS = new Set(["analytics-salt"]);

/** Vercel refuses response bodies over 4.5MB, which is what serving a photo is. */
export const VERCEL_BODY_LIMIT = 4.5 * 1024 * 1024;

export type Resize = (
  bytes: Uint8Array,
  contentType: string,
) => Promise<{ bytes: Uint8Array; width: number; height: number } | null>;

export type MigrationReport = {
  photos: number;
  resized: string[];
  tooLarge: string[];
  docs: string[];
  skippedDocs: string[];
  days: number;
  visits: number;
};

/** Visits in the order they happened, each once, whichever side recorded it. */
export function mergeEvents(local: string[], remote: string[]): string[] {
  const seen = new Set<string>();
  const merged: { line: string; t: number; index: number }[] = [];
  for (const line of [...remote, ...local]) {
    if (seen.has(line)) continue;
    seen.add(line);
    let t = Number.POSITIVE_INFINITY;
    try {
      const parsed = JSON.parse(line) as { t?: unknown };
      if (typeof parsed.t === "number") t = parsed.t;
    } catch {
      // Kept, at the end: a line this script cannot read is still not its to delete.
    }
    merged.push({ line, t, index: merged.length });
  }
  return merged.sort((a, b) => a.t - b.t || a.index - b.index).map((entry) => entry.line);
}

/** Updates the recorded size of every photo that was shrunk, wherever a document mentions it. */
export function patchDimensions<T>(value: T, resized: Map<string, { width: number; height: number }>): T {
  if (resized.size === 0) return value;
  const walk = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map(walk);
    if (!node || typeof node !== "object") return node;
    const entries = Object.entries(node as Record<string, unknown>).map(([k, v]) => [k, walk(v)] as const);
    const out = Object.fromEntries(entries) as Record<string, unknown>;
    const size = typeof out.key === "string" ? resized.get(out.key) : undefined;
    if (size && typeof out.width === "number" && typeof out.height === "number") {
      out.width = size.width;
      out.height = size.height;
    }
    return out;
  };
  return walk(value) as T;
}

export async function migrateToCloud({
  from,
  to,
  kv,
  docNames,
  resize,
  dryRun = false,
  force = false,
  log = console.log,
}: {
  from: Store;
  to: Store;
  /** The destination's Redis, for writing whole days of visits at once. */
  kv: KeyValue;
  docNames: string[];
  resize?: Resize;
  dryRun?: boolean;
  force?: boolean;
  log?: (line: string) => void;
}): Promise<MigrationReport> {
  const report: MigrationReport = { photos: 0, resized: [], tooLarge: [], docs: [], skippedDocs: [], days: 0, visits: 0 };

  // Photos are prepared first, in memory, because shrinking one changes the
  // width and height the content records for it — and the content has to be
  // compared with the live site in the form it would actually be written.
  const photos: { key: string; bytes: Uint8Array; contentType: string }[] = [];
  const resized = new Map<string, { width: number; height: number }>();
  for (const info of await from.listBlobs()) {
    const blob = await from.readBlob(info.key);
    if (!blob) continue;
    let bytes = blob.bytes;
    const smaller = resize ? await resize(bytes, blob.contentType) : null;
    if (smaller) {
      log(`  photo ${info.key}: ${(bytes.byteLength / 1048576).toFixed(1)}MB -> ${(smaller.bytes.byteLength / 1048576).toFixed(1)}MB (${smaller.width}x${smaller.height})`);
      bytes = smaller.bytes;
      resized.set(info.key, { width: smaller.width, height: smaller.height });
      report.resized.push(info.key);
    }
    if (bytes.byteLength > VERCEL_BODY_LIMIT) report.tooLarge.push(info.key);
    photos.push({ key: info.key, bytes, contentType: blob.contentType });
  }

  // Then the content, as a check only, so a conflict stops everything before
  // a single byte is written anywhere.
  const docs: { name: string; value: unknown }[] = [];
  const conflicts: string[] = [];
  for (const name of [...docNames].sort()) {
    if (SKIP_DOCS.has(name)) {
      report.skippedDocs.push(name);
      continue;
    }
    const stored = await from.readDoc<unknown>(name);
    if (stored === null) continue;
    const local = patchDimensions(stored, resized);
    const live = await to.readDoc<unknown>(name);
    if (live !== null && KEEP_LIVE_DOCS.has(name)) {
      report.skippedDocs.push(name);
      continue;
    }
    if (live !== null && JSON.stringify(live) !== JSON.stringify(local)) conflicts.push(name);
    docs.push({ name, value: local });
  }
  if (conflicts.length > 0 && !force) {
    throw new Error(
      `The live site already has its own, different version of: ${conflicts.join(", ")}. ` +
        "Someone may have edited it on the live dashboard. Nothing was copied. " +
        "To replace the live version with this computer's, run again with --force.",
    );
  }

  // Photos before the content that points at them, so the live site never
  // shows a gallery entry whose photo has not arrived yet.
  for (const photo of photos) {
    if (!dryRun) await to.putBlob(photo);
    report.photos += 1;
  }

  for (const { name, value } of docs) {
    if (!dryRun) await to.writeDoc(name, value);
    report.docs.push(name);
  }

  for (const day of await from.listEventDays()) {
    const merged = mergeEvents(await from.readEvents(day), await to.readEvents(day));
    if (!dryRun) await replaceEventDay(kv, day, merged);
    report.days += 1;
    report.visits += merged.length;
  }

  return report;
}
