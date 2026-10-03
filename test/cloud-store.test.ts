import { strict as assert } from "node:assert";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, describe, it } from "node:test";

/**
 * The store the live site uses on Vercel (Upstash Redis + Vercel Blob), run
 * against in-memory stand-ins for both services, and the one-off import that
 * copies a laptop's `.data` folder into it.
 *
 * The stand-ins implement the same small interfaces the real clients are
 * wrapped in (`KeyValue`, `ObjectStore` in cloud-store.ts), including the
 * compare-and-set that keeps two Vercel instances from overwriting each
 * other's saves.
 */
const dataDir = mkdtempSync(join(tmpdir(), "cloud-store-test-"));
process.env.DATA_DIR = dataDir;
after(() => rmSync(dataDir, { recursive: true, force: true }));

const { createCloudStore } = await import("@/lib/store/cloud-store");
const { createFsStore } = await import("@/lib/store/fs-store");
const { migrateToCloud, mergeEvents, patchDimensions } = await import("@/lib/store/migrate");
type KeyValue = import("@/lib/store/cloud-store").KeyValue;
type ObjectStore = import("@/lib/store/cloud-store").ObjectStore;

/** Redis, as far as this store uses it. Each method yields first, the way a network call would. */
function fakeRedis() {
  const strings = new Map<string, string>();
  const lists = new Map<string, string[]>();
  const sets = new Map<string, Set<string>>();
  const hashes = new Map<string, Map<string, string>>();
  const tick = () => new Promise((resolve) => setImmediate(resolve));
  let commands = 0;
  /** Runs once, just before the next compare-and-set: stands in for another instance saving first. */
  let beforeNextCas: (() => void) | undefined;

  const kv: KeyValue = {
    async get(key) { commands++; await tick(); return strings.get(key) ?? null; },
    async set(key, value) { commands++; await tick(); strings.set(key, value); },
    async compareAndSet(key, expected, next) {
      commands++;
      await tick();
      const hook = beforeNextCas;
      beforeNextCas = undefined;
      hook?.();
      if ((strings.get(key) ?? null) !== expected) return false;
      strings.set(key, next);
      return true;
    },
    async del(keys) { commands++; await tick(); for (const k of keys) { strings.delete(k); lists.delete(k); sets.delete(k); hashes.delete(k); } },
    async rpush(key, values) { commands++; await tick(); lists.set(key, [...(lists.get(key) ?? []), ...values]); },
    async lrange(key, start, stop) { commands++; await tick(); return (lists.get(key) ?? []).slice(start, stop + 1); },
    async sadd(key, member) { commands++; await tick(); sets.set(key, (sets.get(key) ?? new Set()).add(member)); },
    async smembers(key) { commands++; await tick(); return [...(sets.get(key) ?? [])]; },
    async srem(key, members) { commands++; await tick(); for (const m of members) sets.get(key)?.delete(m); },
    async hget(key, field) { commands++; await tick(); return hashes.get(key)?.get(field) ?? null; },
    async hset(key, field, value) { commands++; await tick(); hashes.set(key, (hashes.get(key) ?? new Map()).set(field, value)); },
    async hgetall(key) { commands++; await tick(); return Object.fromEntries(hashes.get(key) ?? []); },
    async hdel(key, field) { commands++; await tick(); hashes.get(key)?.delete(field); },
  };
  return {
    kv,
    strings,
    lists,
    commands: () => commands,
    interfereOnce(write: () => void) { beforeNextCas = write; },
  };
}

function fakeBlob() {
  const objects = new Map<string, { bytes: Uint8Array; contentType: string }>();
  const store: ObjectStore = {
    async put(pathname, bytes, contentType) {
      const url = `https://store.example/${pathname}`;
      objects.set(url, { bytes: new Uint8Array(bytes), contentType });
      return { url, access: "private" };
    },
    async get(url) { return objects.get(url)?.bytes ?? null; },
    async del(url) { objects.delete(url); },
  };
  return { store, objects };
}

function cloud() {
  const redis = fakeRedis();
  const blob = fakeBlob();
  return { redis, blob, store: createCloudStore({ kv: redis.kv, objects: blob.store, location: "example.upstash.io" }) };
}

describe("cloud store: documents", () => {
  it("reads null for a document never written, and round-trips one that was", async () => {
    const { store } = cloud();
    assert.equal(await store.readDoc("menus"), null);
    await store.writeDoc("menus", { version: 1, order: ["a", "b"] });
    assert.deepEqual(await store.readDoc("menus"), { version: 1, order: ["a", "b"] });
  });

  it("ignores a corrupt document on read, so the public site falls back instead of failing", async () => {
    const { store, redis } = cloud();
    redis.strings.set("chef:doc:menus", "{not json");
    assert.equal(await store.readDoc("menus"), null);
  });

  it("refuses to save over a corrupt document rather than losing it", async () => {
    const { store, redis } = cloud();
    redis.strings.set("chef:doc:menus", "{not json");
    await assert.rejects(store.updateDoc("menus", () => ({ fresh: true })), /refusing to overwrite/);
    assert.equal(redis.strings.get("chef:doc:menus"), "{not json");
  });

  it("does not lose a save that another instance made at the same moment", async () => {
    const { store, redis } = cloud();
    await store.writeDoc("dishes", { names: ["Samosa"] });
    // Another Vercel instance saves between this one reading and writing.
    redis.interfereOnce(() => redis.strings.set("chef:doc:dishes", JSON.stringify({ names: ["Samosa", "Chole Bhatura"] })));
    const result = await store.updateDoc<{ names: string[] }>("dishes", (current) => ({ names: [...(current?.names ?? []), "Paneer Tikka"] }));
    assert.deepEqual(result.names, ["Samosa", "Chole Bhatura", "Paneer Tikka"]);
    assert.deepEqual(await store.readDoc("dishes"), { names: ["Samosa", "Chole Bhatura", "Paneer Tikka"] });
  });

  it("applies many simultaneous updates without dropping any", async () => {
    const { store } = cloud();
    await Promise.all(
      Array.from({ length: 25 }, (_, i) => store.updateDoc<{ n: number[] }>("gallery", (current) => ({ n: [...(current?.n ?? []), i] }))),
    );
    const final = await store.readDoc<{ n: number[] }>("gallery");
    assert.deepEqual([...final!.n].sort((a, b) => a - b), Array.from({ length: 25 }, (_, i) => i));
  });

  it("rejects keys that could escape their namespace", async () => {
    const { store } = cloud();
    for (const bad of ["../x", "a/b", "", "a b", ".hidden"]) {
      await assert.rejects(store.readDoc(bad), /Unsafe store key/);
    }
  });
});

describe("cloud store: visitor events", () => {
  it("keeps each day's visits in order and lists the days", async () => {
    const { store } = cloud();
    await store.appendEvent("2026-10-02", "b1");
    await store.appendEvent("2026-10-01", "a1");
    await store.appendEvent("2026-10-02", "b2");
    assert.deepEqual(await store.listEventDays(), ["2026-10-01", "2026-10-02"]);
    assert.deepEqual(await store.readEvents("2026-10-02"), ["b1", "b2"]);
    assert.deepEqual(await store.readEvents("2026-09-30"), []);
  });

  it("reads a busy day in full, across pages", async () => {
    const { store } = cloud();
    const lines = Array.from({ length: 4_501 }, (_, i) => `v${i}`);
    for (const line of lines) await store.appendEvent("2026-10-01", line);
    assert.deepEqual(await store.readEvents("2026-10-01"), lines);
  });

  it("indexes a day once per instance, not once per visit", async () => {
    const { store, redis } = cloud();
    await store.appendEvent("2026-10-01", "first");
    const after = redis.commands();
    await store.appendEvent("2026-10-01", "second");
    assert.equal(redis.commands() - after, 1);
  });

  it("prunes whole days older than the cutoff", async () => {
    const { store } = cloud();
    for (const day of ["2026-08-01", "2026-09-15", "2026-10-01"]) await store.appendEvent(day, "x");
    assert.equal(await store.pruneEventsBefore("2026-09-01"), 1);
    assert.deepEqual(await store.listEventDays(), ["2026-09-15", "2026-10-01"]);
    assert.deepEqual(await store.readEvents("2026-08-01"), []);
  });

  it("rejects anything but a date as a day", async () => {
    const { store } = cloud();
    await assert.rejects(store.appendEvent("../2026", "x"), /Unsafe event day/);
  });
});

describe("cloud store: photographs", () => {
  it("stores, lists, serves and deletes an upload", async () => {
    const { store, blob } = cloud();
    const bytes = new Uint8Array([0xff, 0xd8, 0xff, 1, 2, 3]);
    await store.putBlob({ key: "up-0123456789abcdef.jpg", bytes, contentType: "image/jpeg" });

    const listed = await store.listBlobs();
    assert.equal(listed.length, 1);
    assert.equal(listed[0].key, "up-0123456789abcdef.jpg");
    assert.equal(listed[0].size, 6);

    const read = await store.readBlob("up-0123456789abcdef.jpg");
    assert.deepEqual(read?.bytes, bytes);
    assert.equal(read?.contentType, "image/jpeg");

    await store.deleteBlob("up-0123456789abcdef.jpg");
    assert.equal(await store.readBlob("up-0123456789abcdef.jpg"), null);
    assert.equal((await store.listBlobs()).length, 0);
    assert.equal(blob.objects.size, 0);
  });

  it("answers null for a photo it does not know, and refuses unsafe keys", async () => {
    const { store } = cloud();
    assert.equal(await store.readBlob("up-ffffffffffffffff.jpg"), null);
    await assert.rejects(store.readBlob("../../etc/passwd"), /Unsafe store key/);
  });

  it("reports itself as durable, with the Redis host and no credential", () => {
    const { store } = cloud();
    assert.equal(store.durable, true);
    assert.equal(store.location, "example.upstash.io");
    assert.equal(store.warning, undefined);
  });
});

describe("importing a laptop's data into the cloud store", () => {
  it("merges visits by time, once each", () => {
    const at = (t: number, v: string) => JSON.stringify({ t, v });
    assert.deepEqual(mergeEvents([at(1, "a"), at(3, "c")], [at(2, "b"), at(3, "c")]), [at(1, "a"), at(2, "b"), at(3, "c")]);
  });

  it("updates the recorded size of a photo that was shrunk, wherever it appears", () => {
    const doc = { added: [{ key: "up-1.jpg", width: 4000, height: 3000 }, { key: "up-2.jpg", width: 800, height: 600 }] };
    const patched = patchDimensions(doc, new Map([["up-1.jpg", { width: 2400, height: 1800 }]]));
    assert.deepEqual(patched.added, [{ key: "up-1.jpg", width: 2400, height: 1800 }, { key: "up-2.jpg", width: 800, height: 600 }]);
  });

  it("copies content, photos and visits; leaves bookings behind; and is safe to run twice", async () => {
    const local = createFsStore();
    await local.writeDoc("gallery", { added: [{ key: "up-aaaaaaaaaaaaaaaa.jpg", width: 4000, height: 3000 }] });
    await local.writeDoc("bookings", { bookings: [{ name: "A guest" }] });
    await local.putBlob({ key: "up-aaaaaaaaaaaaaaaa.jpg", bytes: new Uint8Array([1, 2, 3, 4]), contentType: "image/jpeg" });
    await local.appendEvent("2026-10-01", JSON.stringify({ t: 1, p: "/" }));
    await local.appendEvent("2026-10-01", JSON.stringify({ t: 2, p: "/menus" }));

    const { store: live, redis } = cloud();
    // The live site has already counted a visit of its own that day.
    await live.appendEvent("2026-10-01", JSON.stringify({ t: 3, p: "/angel" }));

    const resize = async () => ({ bytes: new Uint8Array([9, 9]), width: 2400, height: 1800 });
    const options = { from: local, to: live, kv: redis.kv, docNames: ["gallery", "bookings"], resize, log: () => {} };
    const report = await migrateToCloud(options);

    assert.deepEqual(report.docs, ["gallery"]);
    assert.deepEqual(report.skippedDocs, ["bookings"]);
    assert.equal(await live.readDoc("bookings"), null);
    assert.deepEqual(await live.readDoc("gallery"), { added: [{ key: "up-aaaaaaaaaaaaaaaa.jpg", width: 2400, height: 1800 }] });
    assert.deepEqual((await live.readBlob("up-aaaaaaaaaaaaaaaa.jpg"))?.bytes, new Uint8Array([9, 9]));
    assert.deepEqual((await live.readEvents("2026-10-01")).map((l) => JSON.parse(l).t), [1, 2, 3]);

    // Again: same result, no duplicated visits.
    await migrateToCloud(options);
    assert.deepEqual((await live.readEvents("2026-10-01")).map((l) => JSON.parse(l).t), [1, 2, 3]);
  });

  it("stops before writing anything when the live site has edited the same content", async () => {
    const local = createFsStore();
    await local.writeDoc("menus", { from: "laptop" });
    await local.putBlob({ key: "up-bbbbbbbbbbbbbbbb.jpg", bytes: new Uint8Array([1]), contentType: "image/jpeg" });

    const { store: live, redis } = cloud();
    await live.writeDoc("menus", { from: "live dashboard" });

    const options = { from: local, to: live, kv: redis.kv, docNames: ["menus"], log: () => {} };
    await assert.rejects(migrateToCloud(options), /different version of: menus/);
    assert.deepEqual(await live.readDoc("menus"), { from: "live dashboard" });
    assert.equal(await live.readBlob("up-bbbbbbbbbbbbbbbb.jpg"), null);

    await migrateToCloud({ ...options, force: true });
    assert.deepEqual(await live.readDoc("menus"), { from: "laptop" });
  });
});
