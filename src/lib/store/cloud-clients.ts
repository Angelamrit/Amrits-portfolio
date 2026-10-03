import "server-only";
import { Redis } from "@upstash/redis";
import {
  BlobContentTypeNotAllowedError,
  BlobFileTooLargeError,
  BlobStoreNotFoundError,
  BlobStoreSuspendedError,
  del,
  get,
  put,
} from "@vercel/blob";
import { createCloudStore, type BlobAccess, type KeyValue, type ObjectStore } from "./cloud-store";
import type { Store } from "./types";

/**
 * Connects `cloud-store.ts` to the real Upstash Redis and Vercel Blob clients.
 *
 * The credentials are the ones Vercel adds to the project when the two stores
 * are connected from its Storage tab. Upstash's integration names them either
 * KV_REST_API_URL / KV_REST_API_TOKEN or UPSTASH_REDIS_REST_URL /
 * UPSTASH_REDIS_REST_TOKEN depending on how it was set up, so both are read.
 */

export type CloudConfig = { redisUrl: string; redisToken: string; blobToken: string };

const env = (name: string) => process.env[name]?.trim() || undefined;

/** The cloud credentials, or which of them are missing. */
export function readCloudConfig(): { config: CloudConfig; missing: [] } | { config: null; missing: string[] } {
  const redisUrl = env("UPSTASH_REDIS_REST_URL") ?? env("KV_REST_API_URL");
  const redisToken = env("UPSTASH_REDIS_REST_TOKEN") ?? env("KV_REST_API_TOKEN");
  const blobToken = env("BLOB_READ_WRITE_TOKEN");
  if (redisUrl && redisToken && blobToken) return { config: { redisUrl, redisToken, blobToken }, missing: [] };
  return {
    config: null,
    missing: [
      !redisUrl && "KV_REST_API_URL (or UPSTASH_REDIS_REST_URL)",
      !redisToken && "KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_TOKEN)",
      !blobToken && "BLOB_READ_WRITE_TOKEN",
    ].filter((name): name is string => Boolean(name)),
  };
}

/**
 * Compare-and-set, run inside Redis so no other write can land between the
 * check and the set. ARGV[1] says whether a value is expected at all; ARGV[2]
 * is that value; ARGV[3] is what to write.
 */
const COMPARE_AND_SET = `
local current = redis.call('GET', KEYS[1])
if ARGV[1] == '0' then
  if current then return 0 end
elseif current ~= ARGV[2] then
  return 0
end
redis.call('SET', KEYS[1], ARGV[3])
return 1
`;

function redisKeyValue(redis: Redis): KeyValue {
  return {
    async get(key) {
      return (await redis.get<string>(key)) ?? null;
    },
    async set(key, value) {
      await redis.set(key, value);
    },
    async compareAndSet(key, expected, next) {
      const wrote = await redis.eval<string[], number | string>(
        COMPARE_AND_SET,
        [key],
        expected === null ? ["0", "", next] : ["1", expected, next],
      );
      return Number(wrote) === 1;
    },
    async del(keys) {
      if (keys.length > 0) await redis.del(...keys);
    },
    async rpush(key, values) {
      if (values.length > 0) await redis.rpush(key, ...values);
    },
    async lrange(key, start, stop) {
      return (await redis.lrange<string>(key, start, stop)) ?? [];
    },
    async sadd(key, member) {
      await redis.sadd(key, member);
    },
    async smembers(key) {
      return ((await redis.smembers<string[]>(key)) ?? []).map(String);
    },
    async srem(key, members) {
      if (members.length > 0) await redis.srem(key, ...members);
    },
    async hget(key, field) {
      return (await redis.hget<string>(key, field)) ?? null;
    },
    async hset(key, field, value) {
      await redis.hset(key, { [field]: value });
    },
    async hgetall(key) {
      // With automatic deserialisation off, Upstash returns HGETALL as the raw
      // Redis reply — a flat [field, value, field, value] list — not an object.
      const reply = (await redis.hgetall(key)) as unknown;
      if (!reply) return {};
      if (!Array.isArray(reply)) return reply as Record<string, string>;
      const out: Record<string, string> = {};
      for (let i = 0; i + 1 < reply.length; i += 2) out[String(reply[i])] = String(reply[i + 1]);
      return out;
    },
    async hdel(key, field) {
      await redis.hdel(key, field);
    },
  };
}

/**
 * A Blob store is created either public or private in Vercel, and a write must
 * name the matching access. Private is preferred (the photographs are only
 * ever served through this site's own /api/media route), but rather than make
 * the chef's setup depend on which one was ticked, a write the store refuses
 * is retried once with the other access, and whichever works is remembered.
 */
let workingAccess: BlobAccess | undefined;

/** Failures that have nothing to do with public versus private, so retrying with the other access cannot help. */
const notAboutAccess = [BlobStoreNotFoundError, BlobStoreSuspendedError, BlobFileTooLargeError, BlobContentTypeNotAllowedError];

function blobObjects(token: string): ObjectStore {
  async function putAs(access: BlobAccess, pathname: string, bytes: Uint8Array, contentType: string) {
    const result = await put(pathname, Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength), {
      access,
      contentType,
      token,
      addRandomSuffix: false,
      // Keys are random per upload, so this only matters when an import is run twice.
      allowOverwrite: true,
    });
    return { url: result.url, access };
  }

  return {
    async put(pathname, bytes, contentType) {
      const first: BlobAccess = workingAccess ?? (process.env.BLOB_ACCESS === "public" ? "public" : "private");
      try {
        const stored = await putAs(first, pathname, bytes, contentType);
        workingAccess = first;
        return stored;
      } catch (error) {
        if (workingAccess || notAboutAccess.some((type) => error instanceof type)) throw error;
        const other: BlobAccess = first === "private" ? "public" : "private";
        try {
          const stored = await putAs(other, pathname, bytes, contentType);
          workingAccess = other;
          return stored;
        } catch {
          throw error;
        }
      }
    },

    async get(url, access) {
      const result = await get(url, { access, token });
      if (!result || result.statusCode !== 200) return null;
      return new Uint8Array(await new Response(result.stream).arrayBuffer());
    },

    async del(url) {
      await del(url, { token });
    },
  };
}

export function createCloudStoreFromConfig(config: CloudConfig): Store {
  return connectCloud(config).store;
}

/** The store, plus the raw Redis commands for the one-off import script (`scripts/migrate-data.ts`). */
export function connectCloud(config: CloudConfig): { store: Store; kv: KeyValue } {
  const redis = new Redis({
    url: config.redisUrl,
    token: config.redisToken,
    // Values are JSON this site encodes and decodes itself (see cloud-store.ts),
    // so the client must hand back exactly the strings it was given.
    automaticDeserialization: false,
    enableTelemetry: false,
  });

  let host: string | undefined;
  try {
    host = new URL(config.redisUrl).host;
  } catch {
    host = undefined;
  }

  const kv = redisKeyValue(redis);
  return { store: createCloudStore({ kv, objects: blobObjects(config.blobToken), location: host }), kv };
}
