import "server-only";
import { randomBytes } from "node:crypto";
import { copyFile, link, mkdir, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";
import { TRASH_DAYS, resolveRoot } from "./fs-store";

/**
 * Daily copies of the dashboard's data, for a server that keeps it in files.
 *
 * The file store already protects each save from a crash, keeps the last
 * versions of every document and puts deleted photographs in a trash. What it
 * cannot survive is the data folder itself going: deleted by a deploy, by a
 * mistyped command, or corrupted along with the disk. This keeps a full copy
 * of the folder for each of the last `DATA_BACKUP_KEEP` days (30 by default)
 * in a second folder, and `npm run data:restore` puts any of them back.
 *
 * Photographs are never changed once written — a new upload is a new file
 * under a new name — so a backup hard-links them instead of copying: thirty
 * days of backups of 11MB of photos cost 11MB, not 330MB. A link is a second
 * name for the same bytes on disk, so deleting the original leaves the backup
 * intact. Where the backup folder is on another disk, linking is impossible
 * and the photos are copied instead. Everything else is copied, because the
 * visitor log is appended to in place.
 *
 * A backup is built in a hidden `.partial` folder and renamed into place only
 * when complete, so a backup interrupted halfway is never mistaken for one
 * that can be restored.
 *
 * This is still one disk. A copy on another machine — the hosting provider's
 * snapshots, or this folder copied off the server — is what survives the disk
 * failing, and the startup log says so.
 */

export type BackupInfo = {
  /** `2026-10-01` for the daily backup, or `manual-…` / `before-restore-…`. */
  name: string;
  path: string;
  createdAt: number;
  files: number;
  bytes: number;
};

const MANIFEST = "backup.json";
const DAILY = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Folders whose files never change after they are written, so a hard link is as good as a copy. */
const LINKABLE = new Set(["uploads", "trash"]);

export function dataRoot(): string {
  return resolveRoot();
}

/** `DATA_BACKUP_DIR`, or a folder beside the data folder named `<data folder>-backups`. */
export function backupRoot(root = dataRoot()): string {
  const configured = process.env.DATA_BACKUP_DIR?.trim();
  return configured ? resolve(/* turbopackIgnore: true */ process.cwd(), configured) : `${root}-backups`;
}

/** How many daily backups to keep. */
export function keepCount(): number {
  const parsed = Number.parseInt(process.env.DATA_BACKUP_KEEP ?? "", 10);
  return Number.isFinite(parsed) && parsed >= 1 ? Math.min(parsed, 3650) : 30;
}

function isInside(child: string, parent: string): boolean {
  const rel = relative(parent, child);
  return rel === "" || (!rel.startsWith("..") && !rel.startsWith(sep) && !/^[a-zA-Z]:/.test(rel));
}

function utcDay(now: number): string {
  return new Date(now).toISOString().slice(0, 10);
}

function stampFor(now: number): string {
  return new Date(now).toISOString().replace(/[:.]/g, "-");
}

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

/** Copies a folder tree, linking where `linkable` says it is safe. Returns what it wrote. */
async function copyTree(from: string, to: string, linkable: boolean): Promise<{ files: number; bytes: number }> {
  await mkdir(to, { recursive: true });
  const totals = { files: 0, bytes: 0 };
  for (const entry of await readdir(from, { withFileTypes: true })) {
    // Half-written temporaries from an interrupted save are not data.
    if (entry.name.endsWith(".tmp")) continue;
    const source = join(from, entry.name);
    const target = join(to, entry.name);
    if (entry.isDirectory()) {
      const sub = await copyTree(source, target, linkable);
      totals.files += sub.files;
      totals.bytes += sub.bytes;
    } else if (entry.isFile()) {
      let linked = false;
      if (linkable) {
        try {
          await link(source, target);
          linked = true;
        } catch {
          // Another disk, or a filesystem without links: copy instead.
        }
      }
      if (!linked) await copyFile(source, target);
      totals.files += 1;
      totals.bytes += (await stat(source)).size;
    }
  }
  return totals;
}

/** Copies the top-level folders of `from` into `to`, linking the ones that never change. */
async function copyData(from: string, to: string): Promise<{ files: number; bytes: number }> {
  await mkdir(to, { recursive: true });
  const totals = { files: 0, bytes: 0 };
  for (const entry of await readdir(from, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
    const sub = await copyTree(join(from, entry.name), join(to, entry.name), LINKABLE.has(entry.name));
    totals.files += sub.files;
    totals.bytes += sub.bytes;
  }
  return totals;
}

export async function readBackup(path: string, name: string): Promise<BackupInfo | null> {
  try {
    const manifest = JSON.parse(await readFile(join(path, MANIFEST), "utf8")) as Partial<BackupInfo>;
    if (typeof manifest.createdAt !== "number") return null;
    return { name, path, createdAt: manifest.createdAt, files: manifest.files ?? 0, bytes: manifest.bytes ?? 0 };
  } catch {
    return null;
  }
}

/** Every complete backup, newest first. */
export async function listBackups(dir = backupRoot()): Promise<BackupInfo[]> {
  let names: string[];
  try {
    names = await readdir(dir);
  } catch {
    return [];
  }
  const found = await Promise.all(
    names.filter((name) => !name.startsWith(".")).map((name) => readBackup(join(dir, name), name)),
  );
  return found.filter((b): b is BackupInfo => b !== null).sort((a, b) => b.createdAt - a.createdAt);
}

export async function latestBackup(dir = backupRoot()): Promise<BackupInfo | null> {
  return (await listBackups(dir))[0] ?? null;
}

/**
 * Copies the whole data folder into `<backup folder>/<name>`. Refuses a
 * backup folder inside the data folder, which would copy itself for ever.
 */
export async function createBackup({
  name,
  root = dataRoot(),
  dir = backupRoot(root),
  now = Date.now(),
}: {
  name: string;
  root?: string;
  dir?: string;
  now?: number;
}): Promise<BackupInfo> {
  if (isInside(dir, root)) {
    throw new Error(`The backup folder (${dir}) is inside the data folder (${root}). Set DATA_BACKUP_DIR somewhere else.`);
  }
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,100}$/.test(name)) throw new Error(`Unsafe backup name: ${JSON.stringify(name)}`);

  const final = join(dir, name);
  const existing = await readBackup(final, name);
  if (existing) return existing;

  await mkdir(dir, { recursive: true });
  const partial = join(dir, `.${name}.partial-${randomBytes(4).toString("hex")}`);
  try {
    const totals = (await exists(root)) ? await copyData(root, partial) : (await mkdir(partial, { recursive: true }), { files: 0, bytes: 0 });
    await writeFile(join(partial, MANIFEST), JSON.stringify({ v: 1, createdAt: now, source: root, ...totals }, null, 2));
    // A folder of the same name with no manifest is a leftover from an older
    // failed attempt; it cannot be restored, so it is replaced.
    await rm(final, { recursive: true, force: true });
    await rename(partial, final);
    return { name, path: final, createdAt: now, ...totals };
  } catch (error) {
    await rm(partial, { recursive: true, force: true }).catch(() => {});
    throw error;
  }
}

/**
 * Removes daily backups beyond the newest `keep`, any other backup older than
 * `keep` days, abandoned partial backups, and photographs that have been in
 * the trash longer than TRASH_DAYS. Returns the names it removed.
 */
export async function pruneBackups({
  root = dataRoot(),
  dir = backupRoot(root),
  keep = keepCount(),
  now = Date.now(),
}: {
  root?: string;
  dir?: string;
  keep?: number;
  now?: number;
} = {}): Promise<string[]> {
  const removed: string[] = [];
  const backups = await listBackups(dir);

  const daily = backups.filter((b) => DAILY.test(b.name)).sort((a, b) => b.name.localeCompare(a.name));
  const other = backups.filter((b) => !DAILY.test(b.name));
  const doomed = [...daily.slice(keep), ...other.filter((b) => now - b.createdAt > keep * DAY_MS)];
  for (const backup of doomed) {
    await rm(backup.path, { recursive: true, force: true });
    removed.push(backup.name);
  }

  try {
    for (const name of await readdir(dir)) {
      if (!name.startsWith(".") || !name.includes(".partial-")) continue;
      const path = join(dir, name);
      if (now - (await stat(path)).mtimeMs > 60 * 60 * 1000) await rm(path, { recursive: true, force: true });
    }
  } catch {
    // No backup folder yet.
  }

  const trash = join(root, "trash", "uploads");
  try {
    for (const name of await readdir(trash)) {
      const path = join(trash, name);
      if (now - (await stat(path)).mtimeMs > TRASH_DAYS * DAY_MS) await rm(path, { force: true });
    }
  } catch {
    // Nothing has been deleted yet.
  }

  return removed;
}

/** Makes today's backup if there is none yet, then prunes. Safe to call as often as you like. */
export async function ensureDailyBackup(options: { root?: string; dir?: string; keep?: number; now?: number } = {}) {
  const now = options.now ?? Date.now();
  const root = options.root ?? dataRoot();
  const dir = options.dir ?? backupRoot(root);
  const name = utcDay(now);
  const already = await readBackup(join(dir, name), name);
  const backup = already ?? (await createBackup({ name, root, dir, now }));
  const removed = await pruneBackups({ root, dir, keep: options.keep, now });
  return { backup, created: !already, removed };
}

/**
 * Puts a backup back in place of the current data.
 *
 * The current data is backed up first, as `before-restore-<time>`, so a
 * restore can itself be undone. Each folder is copied in beside the one it
 * replaces and then swapped in with a rename, so the data folder is never
 * left half old and half new. Meant to run with the site stopped; see
 * `scripts/data-restore.ts`.
 */
export async function restoreBackup({
  name,
  root = dataRoot(),
  dir = backupRoot(root),
  now = Date.now(),
}: {
  name: string;
  root?: string;
  dir?: string;
  now?: number;
}): Promise<{ restored: BackupInfo; safety: BackupInfo }> {
  const restored = await readBackup(join(dir, name), name);
  if (!restored) throw new Error(`There is no complete backup called ${JSON.stringify(name)} in ${dir}.`);

  const safety = await createBackup({ name: `before-restore-${stampFor(now)}`, root, dir, now });
  await mkdir(root, { recursive: true });

  const wanted = (await readdir(restored.path, { withFileTypes: true })).filter((e) => e.isDirectory()).map((e) => e.name);
  const present = (await readdir(root, { withFileTypes: true }))
    .filter((e) => e.isDirectory() && !e.name.startsWith("."))
    .map((e) => e.name);

  const suffix = randomBytes(4).toString("hex");
  for (const folder of new Set([...wanted, ...present])) {
    const live = join(root, folder);
    const aside = join(root, `.${folder}.replaced-${suffix}`);
    if (wanted.includes(folder)) {
      const staging = join(root, `.${folder}.restoring-${suffix}`);
      await copyTree(join(restored.path, folder), staging, LINKABLE.has(folder));
      if (await exists(live)) await rename(live, aside);
      await rename(staging, live);
    } else if (await exists(live)) {
      // In the current data but not in the backup: it did not exist yet then.
      await rename(live, aside);
    }
    await rm(aside, { recursive: true, force: true });
  }

  return { restored, safety };
}

/**
 * Whether this server should back itself up: a file store, in production,
 * unless switched off. `DATA_BACKUPS=on` turns it on for a development server
 * too, `DATA_BACKUPS=off` turns it off everywhere.
 */
export function backupsEnabled(): boolean {
  const setting = process.env.DATA_BACKUPS?.trim().toLowerCase();
  if (setting === "off") return false;
  if (setting === "on") return true;
  return process.env.NODE_ENV === "production";
}

const HOUR = 60 * 60 * 1000;

/**
 * Started once, at server start, from `instrumentation.ts`. Checks once a
 * minute after starting and then every hour, so the day's backup is made
 * within an hour of midnight UTC however long the server has been running.
 */
export function startBackupSchedule(): void {
  const flag = globalThis as typeof globalThis & { __chefBackups?: true };
  if (flag.__chefBackups) return;
  flag.__chefBackups = true;

  const run = async () => {
    try {
      const { backup, created, removed } = await ensureDailyBackup();
      if (created) console.info(`[backup] saved ${backup.name}: ${backup.files} files to ${backup.path}`);
      if (removed.length > 0) console.info(`[backup] removed old backups: ${removed.join(", ")}`);
    } catch (error) {
      console.error("[backup] the daily backup FAILED — the site's data is not being backed up:", error);
    }
  };

  setTimeout(run, 60 * 1000).unref();
  setInterval(run, HOUR).unref();
}

/**
 * Called at server start. Says loudly, at the top of the log, anything about
 * where the data lives that could lose it, then starts the daily backups.
 */
export async function reportDataSafety(): Promise<void> {
  const root = dataRoot();
  const problems: string[] = [];

  if (process.env.NODE_ENV === "production") {
    if (!process.env.DATA_DIR?.trim()) {
      problems.push(
        `DATA_DIR is not set, so the dashboard's data is inside the app folder (${root}).`,
        "A deploy that replaces or re-clones that folder deletes every edit, photo and the",
        "dashboard password. Set DATA_DIR to a folder outside the app, e.g. /var/lib/chef-site/data.",
      );
    } else if (isInside(root, process.cwd())) {
      problems.push(
        `DATA_DIR (${root}) is inside the app folder (${process.cwd()}).`,
        "A deploy that replaces that folder deletes the data. Move it outside the app.",
      );
    }
  }

  if (!backupsEnabled()) {
    if (process.env.NODE_ENV === "production") problems.push("DATA_BACKUPS=off: no daily backups are being made.");
  } else {
    const dir = backupRoot(root);
    if (isInside(dir, root)) {
      problems.push(`DATA_BACKUP_DIR (${dir}) is inside DATA_DIR. Backups are OFF until it is moved elsewhere.`);
    } else {
      startBackupSchedule();
      console.info(`[backup] daily backups of ${root} to ${dir}, keeping ${keepCount()} days.`);
      try {
        await mkdir(root, { recursive: true });
        await mkdir(dir, { recursive: true });
        if ((await stat(dir)).dev === (await stat(root)).dev) {
          console.info(
            "[backup] the backups are on the same disk as the data. Also keep a copy off this server " +
              "(your provider's snapshots, or copy the backup folder elsewhere) so a failed disk loses nothing.",
          );
        }
      } catch {
        // Reported by the first backup run if it matters.
      }
    }
  }

  if (problems.length > 0) {
    console.error(
      [
        "",
        "  ****************************************************************",
        "  * THE DASHBOARD'S DATA IS AT RISK                              *",
        "  ****************************************************************",
        ...problems.map((line) => `  ${line}`),
        "  See README.md, \"Keeping the data safe\".",
        "",
      ].join("\n"),
    );
  }
}
