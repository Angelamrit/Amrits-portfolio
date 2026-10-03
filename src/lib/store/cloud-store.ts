import "server-only";
import { safeDay, safeName, serialise } from "./shared";
import type { BlobInfo, StoredBlob, Store } from "./types";

/**
 * The store for Vercel: documents and visitor events in Upstash Redis, uploaded
 * photography in Vercel Blob.
 *
 * Vercel's filesystem is read-only, and the site runs as many short-lived
 * instances at once, so nothing can be kept on disk or in one process's memory.
 * Redis takes what is small and changes often; Blob takes the photographs,
 * which would be too large for Redis. Redis also keeps an index of the
 * photographs (where each one lives, its type and size), so listing them or
 * finding one costs one Redis read instead of a Blob listing.
 *
 * This file holds the storage logic and talks to two small interfaces rather
 * than to the vendors' SDKs directly. `cloud-clients.ts` plugs the real
 * clients in; the tests plug in in-memory ones.
 */

/** The commands this store needs from Redis. Values are always strings: JSON is encoded here, not by the client. */
export interface KeyValue {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  /**
   * Writes `next` only if the key still holds `expected` (`null`: still absent),
   * as one atomic step on the server. Returns whether it wrote.
   */
  compareAndSet(key: string, expected: string | null, next: string): Promise<boolean>;
  del(keys: string[]): Promise<void>;
  rpush(key: string, values: string[]): Promise<void>;
  lrange(key: string, start: number, stop: number): Promise<string[]>;
  sadd(key: string, member: string): Promise<void>;
  smembers(key: string): Promise<string[]>;
  srem(key: string, members: string[]): Promise<void>;
  hget(key: string, field: string): Promise<string | null>;
  hset(key: string, field: string, value: string): Promise<void>;
  hgetall(key: string): Promise<Record<string, string>>;
  hdel(key: string, field: string): Promise<void>;
}

export type BlobAccess = "public" | "private";

/** The commands this store needs from the object store holding the photographs. */
export interface ObjectStore {
  put(pathname: string, bytes: Uint8Array, contentType: string): Promise<{ url: string; access: BlobAccess }>;
  /** `null` when the object is gone. */
  get(url: string, access: BlobAccess): Promise<Uint8Array | null>;
  del(url: string): Promise<void>;
}

/**
 * Everything lives under one prefix, so the site can share a Redis database
 * with something else without either stepping on the other's keys.
 */
const PREFIX = "chef:";
const docKey = (name: string) => `${PREFIX}doc:${safeName(name)}`;
const eventsKey = (day: string) => `${PREFIX}events:${safeDay(day)}`;
const EVENT_DAYS = `${PREFIX}events:days`;
const BLOBS = `${PREFIX}blobs`;
const blobPath = (key: string) => `uploads/${safeName(key)}`;

/** Read a day's events in pages, so a busy day never becomes one oversized response. */
const EVENT_PAGE = 2_000;

/**
 * How many times a save is retried when another instance changed the same
 * document between this one reading and writing it. Each retry re-reads and
 * re-applies the change, so nothing is lost; eight collisions in a row on a
 * restaurant's dashboard would mean something is badly wrong.
 */
const MAX_UPDATE_ATTEMPTS = 8;

type BlobMeta = { url: string; access: BlobAccess; contentType: string; size: number; uploadedAt: number };

function parseMeta(raw: string | null): BlobMeta | null {
  if (!raw) return null;
  try {
    const meta = JSON.parse(raw) as Partial<BlobMeta>;
    if (typeof meta.url !== "string" || (meta.access !== "public" && meta.access !== "private")) return null;
    return {
      url: meta.url,
      access: meta.access,
      contentType: typeof meta.contentType === "string" ? meta.contentType : "application/octet-stream",
      size: typeof meta.size === "number" ? meta.size : 0,
      uploadedAt: typeof meta.uploadedAt === "number" ? meta.uploadedAt : 0,
    };
  } catch {
    return null;
  }
}

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Replaces one day of events wholesale. Used by the one-off import of a local
 * `.data` folder, which has whole days to send rather than single visits.
 */
export async function replaceEventDay(kv: KeyValue, day: string, lines: string[]): Promise<void> {
  const key = eventsKey(day);
  await kv.del([key]);
  for (let start = 0; start < lines.length; start += 500) {
    await kv.rpush(key, lines.slice(start, start + 500));
  }
  if (lines.length > 0) await kv.sadd(EVENT_DAYS, day);
  else await kv.srem(EVENT_DAYS, [day]);
}

export function createCloudStore({
  kv,
  objects,
  location,
}: {
  kv: KeyValue;
  objects: ObjectStore;
  /** Shown on the dashboard: the Redis host, never a credential. */
  location?: string;
}): Store {
  /**
   * Days this instance has already put in the index. The index write is
   * idempotent, so this only saves a Redis command per visit; a fresh instance
   * simply repeats it once.
   */
  const indexedDays = new Set<string>();

  async function listEventDays(): Promise<string[]> {
    const days = await kv.smembers(EVENT_DAYS);
    return days.filter((day) => /^\d{4}-\d{2}-\d{2}$/.test(day)).sort();
  }

  return {
    kind: "Upstash Redis + Vercel Blob",
    location,
    durable: true,

    async readDoc<T>(name: string): Promise<T | null> {
      const raw = await kv.get(docKey(name));
      if (raw === null) return null;
      try {
        return JSON.parse(raw) as T;
      } catch {
        // A corrupt document must not take the public site down: the caller
        // falls back to the code-defined content it was overriding.
        console.error(`[store] ${name} is not valid JSON — ignoring the override.`);
        return null;
      }
    },

    async writeDoc<T>(name: string, value: T): Promise<void> {
      const key = docKey(name);
      // One SET is atomic in Redis: a reader sees the old value or the new one.
      await serialise(key, () => kv.set(key, JSON.stringify(value)));
    },

    async updateDoc<T>(name: string, change: (current: T | null) => T): Promise<T> {
      const key = docKey(name);
      // The queue orders saves within this instance; the compare-and-set below
      // covers saves from other instances, which share nothing but Redis.
      // Because a collision re-reads and re-applies, `change` may run more
      // than once and must only compute from what it is given.
      return serialise(key, async () => {
        for (let attempt = 1; attempt <= MAX_UPDATE_ATTEMPTS; attempt++) {
          const raw = await kv.get(key);
          let current: T | null = null;
          if (raw !== null) {
            try {
              current = JSON.parse(raw) as T;
            } catch {
              // Refuse rather than start from empty: writing over a corrupt
              // document would destroy whatever could still be recovered.
              throw new Error(`[store] ${name} is not valid JSON; refusing to overwrite it.`);
            }
          }
          const next = change(current);
          if (await kv.compareAndSet(key, raw, JSON.stringify(next))) return next;
          // Someone else saved first. Back off a little, with jitter so two
          // instances that collided do not collide again in lockstep.
          await pause(20 * attempt + Math.random() * 30);
        }
        throw new Error(`[store] ${name} kept changing while it was being saved; please try again.`);
      });
    },

    async deleteDoc(name: string): Promise<void> {
      await kv.del([docKey(name)]);
    },

    async appendEvent(day: string, line: string): Promise<void> {
      // RPUSH is atomic, so visits arriving at once on different instances
      // all land, in arrival order. No queue is needed.
      await kv.rpush(eventsKey(day), [line]);
      if (!indexedDays.has(day)) {
        await kv.sadd(EVENT_DAYS, day);
        indexedDays.add(day);
      }
    },

    async readEvents(day: string): Promise<string[]> {
      const key = eventsKey(day);
      const lines: string[] = [];
      for (let start = 0; ; start += EVENT_PAGE) {
        const page = await kv.lrange(key, start, start + EVENT_PAGE - 1);
        lines.push(...page);
        if (page.length < EVENT_PAGE) return lines;
      }
    },

    listEventDays,

    async pruneEventsBefore(day: string): Promise<number> {
      const stale = (await listEventDays()).filter((d) => d < day);
      if (stale.length === 0) return 0;
      await kv.del(stale.map(eventsKey));
      await kv.srem(EVENT_DAYS, stale);
      for (const d of stale) indexedDays.delete(d);
      return stale.length;
    },

    async putBlob({ key, bytes, contentType }: StoredBlob): Promise<void> {
      const safe = safeName(key);
      const { url, access } = await objects.put(blobPath(safe), bytes, contentType);
      // The index entry is written after the bytes, so it never points at a
      // photograph that is not there yet.
      const meta: BlobMeta = { url, access, contentType, size: bytes.byteLength, uploadedAt: Date.now() };
      await kv.hset(BLOBS, safe, JSON.stringify(meta));
    },

    async readBlob(key: string): Promise<StoredBlob | null> {
      const safe = safeName(key);
      const meta = parseMeta(await kv.hget(BLOBS, safe));
      if (!meta) return null;
      const bytes = await objects.get(meta.url, meta.access);
      if (!bytes) return null;
      return { key: safe, bytes, contentType: meta.contentType };
    },

    async listBlobs(): Promise<BlobInfo[]> {
      const all = await kv.hgetall(BLOBS);
      const infos: BlobInfo[] = [];
      for (const [key, raw] of Object.entries(all)) {
        const meta = parseMeta(raw);
        if (meta) infos.push({ key, size: meta.size, contentType: meta.contentType, uploadedAt: meta.uploadedAt });
      }
      return infos.sort((a, b) => b.uploadedAt - a.uploadedAt);
    },

    async deleteBlob(key: string): Promise<void> {
      const safe = safeName(key);
      const meta = parseMeta(await kv.hget(BLOBS, safe));
      // Bytes first, index second: if the delete fails part-way, the index
      // still knows where the photograph is and the delete can be retried.
      if (meta) await objects.del(meta.url);
      await kv.hdel(BLOBS, safe);
    },
  };
}
