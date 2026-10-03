import { strict as assert } from "node:assert";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, beforeEach, describe, it } from "node:test";

/**
 * The guarantees that keep the dashboard's data from being lost on a server
 * that stores it in files: the previous version of every save is kept, a
 * deleted photograph goes to the trash, a daily backup is a complete and
 * independent copy, and a restore puts it back without losing what it
 * replaced. Each runs against real files in a temporary folder.
 */
const base = mkdtempSync(join(tmpdir(), "data-safety-"));
after(() => rmSync(base, { recursive: true, force: true }));

let root = "";
let backups = "";
let n = 0;
beforeEach(() => {
  n += 1;
  root = join(base, `data-${n}`);
  backups = join(base, `backups-${n}`);
  process.env.DATA_DIR = root;
});
process.env.DATA_DIR = join(base, "data-0");

const { createFsStore, HISTORY_KEEP } = await import("@/lib/store/fs-store");
const { createBackup, ensureDailyBackup, listBackups, pruneBackups, restoreBackup } = await import("@/lib/store/backup");

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.parse("2026-10-01T12:00:00Z");
const photo = new Uint8Array([0xff, 0xd8, 0xff, 1, 2, 3, 4, 5]);

function files(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => join(e.parentPath, e.name).slice(dir.length + 1).replace(/\\/g, "/"))
    .sort();
}

/** A data folder with one of everything the dashboard stores. */
async function seeded() {
  const store = createFsStore();
  await store.writeDoc("dishes", { version: 1, patches: { a: { name: "Chole Bhatura" } } });
  await store.appendEvent("2026-09-30", '{"t":1,"p":"/"}');
  await store.putBlob({ key: "chef-portrait.jpg", bytes: photo, contentType: "image/jpeg" });
  return store;
}

describe("every save keeps the version it replaced", () => {
  it("keeps the previous version of a document, never the current one twice", async () => {
    const store = createFsStore();
    await store.writeDoc("menus", { v: 1 });
    assert.deepEqual(files(join(root, "history")), [], "a first save has nothing to keep");
    await store.writeDoc("menus", { v: 2 });
    await store.updateDoc<{ v: number }>("menus", (current) => ({ v: (current?.v ?? 0) + 1 }));
    const kept = files(join(root, "history", "menus")).map((f) => JSON.parse(readFileSync(join(root, "history", "menus", f), "utf8")).v);
    assert.deepEqual(kept, [1, 2]);
    assert.equal((await store.readDoc<{ v: number }>("menus"))?.v, 3);
  });

  it("does not record a save that changed nothing", async () => {
    const store = createFsStore();
    await store.writeDoc("gallery", { items: [] });
    await store.writeDoc("gallery", { items: [] });
    assert.deepEqual(files(join(root, "history")), []);
  });

  it("keeps a deleted document's last version", async () => {
    const store = createFsStore();
    await store.writeDoc("venue", { hours: "Dinner only" });
    await store.deleteDoc("venue");
    assert.equal(await store.readDoc("venue"), null);
    const [only] = files(join(root, "history", "venue"));
    assert.equal(JSON.parse(readFileSync(join(root, "history", "venue", only), "utf8")).hours, "Dinner only");
  });

  it(`keeps the last ${HISTORY_KEEP} versions and no more`, async () => {
    const store = createFsStore();
    for (let i = 0; i <= HISTORY_KEEP + 5; i++) await store.writeDoc("dishes", { i });
    const kept = files(join(root, "history", "dishes")).map((f) => JSON.parse(readFileSync(join(root, "history", "dishes", f), "utf8")).i);
    assert.equal(kept.length, HISTORY_KEEP);
    assert.equal(kept.at(-1), HISTORY_KEEP + 4, "the newest kept is the one just replaced");
  });

  it("keeps no history of the password or the analytics salt", async () => {
    const store = createFsStore();
    for (const name of ["admin-credential", "analytics-salt"]) {
      await store.writeDoc(name, { x: 1 });
      await store.writeDoc(name, { x: 2 });
    }
    assert.deepEqual(files(join(root, "history")), []);
  });

  it("leaves no temporary files behind after a save", async () => {
    const store = createFsStore();
    await store.writeDoc("menus", { v: 1 });
    await store.writeDoc("menus", { v: 2 });
    assert.ok(!files(root).some((f) => f.endsWith(".tmp")));
  });
});

describe("a deleted photograph goes to the trash", () => {
  it("is gone from the site but its bytes are kept", async () => {
    const store = await seeded();
    await store.deleteBlob("chef-portrait.jpg");
    assert.equal(await store.readBlob("chef-portrait.jpg"), null);
    assert.deepEqual(await store.listBlobs(), []);
    const trashed = files(join(root, "trash", "uploads"));
    assert.equal(trashed.length, 2, "the photo and its type");
    const bytes = readFileSync(join(root, "trash", "uploads", trashed.find((f) => !f.endsWith(".meta.json"))!));
    assert.deepEqual(new Uint8Array(bytes), photo);
  });

  it("is emptied after the trash period, not before", async () => {
    const store = await seeded();
    await store.deleteBlob("chef-portrait.jpg");
    await pruneBackups({ root, dir: backups, now: Date.now() + 29 * DAY });
    assert.equal(files(join(root, "trash")).length, 2);
    await pruneBackups({ root, dir: backups, now: Date.now() + 31 * DAY });
    assert.equal(files(join(root, "trash")).length, 0);
  });
});

describe("daily backups", () => {
  it("copy everything, and stay intact when the original changes or is deleted", async () => {
    const store = await seeded();
    const { backup, created } = await ensureDailyBackup({ root, dir: backups, now: NOW });
    assert.equal(created, true);
    assert.equal(backup.name, "2026-10-01");
    assert.deepEqual(
      files(backup.path).filter((f) => f !== "backup.json"),
      files(root),
      "every file in the data folder is in the backup",
    );

    await store.writeDoc("dishes", { version: 1, patches: {} });
    await store.deleteBlob("chef-portrait.jpg");
    rmSync(root, { recursive: true, force: true });

    assert.equal(JSON.parse(readFileSync(join(backup.path, "content", "dishes.json"), "utf8")).patches.a.name, "Chole Bhatura");
    assert.deepEqual(new Uint8Array(readFileSync(join(backup.path, "uploads", "chef-portrait.jpg"))), photo);
  });

  it("make one a day, however often they are asked for", async () => {
    await seeded();
    await ensureDailyBackup({ root, dir: backups, now: NOW });
    const again = await ensureDailyBackup({ root, dir: backups, now: NOW + 3 * 60 * 60 * 1000 });
    assert.equal(again.created, false);
    assert.equal((await listBackups(backups)).length, 1);
  });

  it("keep the newest days and drop the rest", async () => {
    await seeded();
    for (let d = 0; d < 6; d++) await ensureDailyBackup({ root, dir: backups, keep: 3, now: NOW + d * DAY });
    assert.deepEqual(
      (await listBackups(backups)).map((b) => b.name),
      ["2026-10-06", "2026-10-05", "2026-10-04"],
    );
  });

  it("never count a half-finished backup as one", async () => {
    await seeded();
    mkdirSync(join(backups, "2026-10-01"), { recursive: true });
    writeFileSync(join(backups, "2026-10-01", "half.json"), "{}");
    mkdirSync(join(backups, ".2026-09-30.partial-abcd"), { recursive: true });
    assert.deepEqual(await listBackups(backups), [], "no manifest, no backup");

    const { created } = await ensureDailyBackup({ root, dir: backups, now: NOW });
    assert.equal(created, true, "today's unfinished folder is replaced by a complete one");
    assert.ok(existsSync(join(backups, "2026-10-01", "backup.json")));

    const old = join(backups, ".2026-09-30.partial-abcd");
    utimesSync(old, new Date(NOW - 2 * DAY), new Date(NOW - 2 * DAY));
    await pruneBackups({ root, dir: backups, now: NOW });
    assert.ok(!existsSync(old), "an abandoned partial backup is cleaned up");
  });

  it("refuse a backup folder inside the data folder", async () => {
    await seeded();
    await assert.rejects(createBackup({ name: "x", root, dir: join(root, "backups") }), /inside the data folder/);
  });

  it("work before there is any data at all", async () => {
    const { backup } = await ensureDailyBackup({ root, dir: backups, now: NOW });
    assert.equal(backup.files, 0);
  });
});

describe("restoring a backup", () => {
  it("brings back exactly what was backed up, and backs up what it replaces first", async () => {
    const store = await seeded();
    await ensureDailyBackup({ root, dir: backups, now: NOW });

    // A bad day: the menu is wiped, the photo deleted, something new added.
    await store.writeDoc("dishes", { version: 1, patches: {} });
    await store.deleteBlob("chef-portrait.jpg");
    await store.writeDoc("venue", { hours: "Closed" });

    const { safety } = await restoreBackup({ name: "2026-10-01", root, dir: backups, now: NOW + DAY });

    const restored = createFsStore();
    assert.equal((await restored.readDoc<{ patches: Record<string, { name: string }> }>("dishes"))?.patches.a.name, "Chole Bhatura");
    assert.deepEqual((await restored.readBlob("chef-portrait.jpg"))?.bytes, photo);
    assert.equal(await restored.readDoc("venue"), null, "what did not exist then does not exist now");
    assert.deepEqual(await restored.readEvents("2026-09-30"), ['{"t":1,"p":"/"}']);

    // …and the bad day itself is still recoverable.
    assert.ok(safety.name.startsWith("before-restore-"));
    assert.equal(JSON.parse(readFileSync(join(safety.path, "content", "venue.json"), "utf8")).hours, "Closed");
    assert.ok(!readdirSync(root).some((name) => name.startsWith(".")), "no staging folders left behind");
  });

  it("refuses a backup that does not exist, and touches nothing", async () => {
    await seeded();
    const before = files(root);
    await assert.rejects(restoreBackup({ name: "2020-01-01", root, dir: backups }), /no complete backup/);
    assert.deepEqual(files(root), before);
  });

  it("restoring a photo backed up by link gives an independent file", async () => {
    await seeded();
    const { backup } = await ensureDailyBackup({ root, dir: backups, now: NOW });
    await restoreBackup({ name: backup.name, root, dir: backups, now: NOW + 1 });
    rmSync(join(backups), { recursive: true, force: true });
    assert.ok(statSync(join(root, "uploads", "chef-portrait.jpg")).size === photo.length, "deleting the backups leaves the restored photo");
  });
});
