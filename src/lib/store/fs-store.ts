import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { mkdir, open, readFile, readdir, rename, rm, stat, appendFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { safeDay, safeName, serialise } from "./shared";
import type { BlobInfo, StoredBlob, Store } from "./types";

/**
 * The default store: plain files under a directory the server owns.
 *
 * Chosen over a database because this site has no database and the owner asked
 * for nothing that needs a new account or a new dependency. At this site's
 * scale it is not a compromise — a year of analytics for a restaurant's
 * portfolio is a few megabytes of text, and the content overrides are four
 * small JSON documents. What it does need is a filesystem that survives a
 * restart, which is why `durable` is reported honestly and the dashboard says
 * so out loud when the directory looks temporary.
 *
 * Layout under DATA_DIR:
 *
 *   content/<name>.json      one document per editable area of the site
 *   analytics/<YYYY-MM-DD>.jsonl   one pageview per line
 *   uploads/<key>            uploaded photography, with a .meta.json sidecar
 *   history/<name>/<time>.json   the previous versions of each document,
 *                            the last HISTORY_KEEP of them (see `keepHistory`)
 *   trash/uploads/<time>__<key>  deleted photographs, kept TRASH_DAYS days
 *
 * Nothing here is ever lost to a crash or a slip of the finger: every write
 * reaches the disk before it counts, every content save keeps the version it
 * replaced, and a deleted photograph goes to the trash rather than away.
 * Losing the disk itself is what `backup.ts` is for.
 */

const DEFAULT_DIR = ".data";

/** How many earlier versions of each content document are kept. */
export const HISTORY_KEEP = 30;

/** How long a deleted photograph stays in the trash before `backup.ts` empties it. */
export const TRASH_DAYS = 30;

/**
 * Documents with no history. The analytics salt is replaced every day by
 * design and its old values are worthless; the dashboard password's old
 * hashes are worth nothing to keep and something to leak.
 */
const NO_HISTORY = new Set(["analytics-salt", "admin-credential"]);

export function resolveRoot(): string {
  const configured = process.env.DATA_DIR?.trim();
  // The bundler sees a path it cannot predict and, by default, responds by
  // tracing the entire project into the server output — every source file and
  // the whole public folder, photography included. The path is genuinely a
  // runtime value (it is an environment variable naming a directory that does
  // not exist at build time), so tracing it could never find anything useful.
  return resolve(/* turbopackIgnore: true */ process.cwd(), configured && configured.length > 0 ? configured : DEFAULT_DIR);
}

/**
 * Writes that must not be observed half-finished: the bytes go to a uniquely
 * named neighbour first and are then renamed over the target, which is atomic
 * on every filesystem this will run on. Without it a crash mid-write leaves a
 * truncated JSON document, and the public menus page would fail to render.
 */
async function writeAtomic(path: string, contents: string | Uint8Array) {
  await mkdir(dirname(path), { recursive: true });
  const temp = `${path}.${randomBytes(6).toString("hex")}.tmp`;
  try {
    // Flushed to the disk before the rename, not just handed to the operating
    // system. Without the sync a power cut can land between the two and leave
    // the renamed file empty — a rename is atomic, but only over bytes that
    // have actually been written.
    const handle = await open(temp, "w");
    try {
      await handle.writeFile(contents);
      await handle.sync();
    } finally {
      await handle.close();
    }
    await rename(temp, path);
  } catch (error) {
    await rm(temp, { force: true }).catch(() => {});
    throw error;
  }
  await syncDirectory(dirname(path));
}

/**
 * Makes a rename itself durable: on Linux the new name lives in the directory,
 * and the directory has to be flushed too. Windows cannot open a directory
 * this way and does not need to, so a failure here is ignored.
 */
async function syncDirectory(dir: string) {
  try {
    const handle = await open(dir, "r");
    try {
      await handle.sync();
    } finally {
      await handle.close();
    }
  } catch {
    // Not supported on this platform.
  }
}

/** A sortable, filename-safe moment, unique even for two saves in one millisecond. */
function stamp(now = Date.now()): string {
  return `${new Date(now).toISOString().replace(/[:.]/g, "-")}_${randomBytes(3).toString("hex")}`;
}

async function readIfPresent(path: string): Promise<string | null> {
  try {
    return await readFile(path, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export function createFsStore(): Store {
  const root = resolveRoot();
  const contentDir = join(root, "content");
  const analyticsDir = join(root, "analytics");
  const uploadsDir = join(root, "uploads");
  const historyDir = join(root, "history");
  const trashDir = join(root, "trash", "uploads");

  /**
   * Keeps the version a save is about to replace. Best effort on purpose: a
   * history that cannot be written is logged, and the save still goes ahead,
   * because refusing the chef's edit would lose more than it protects.
   */
  async function keepHistory(name: string, previous: string | null, next?: string) {
    if (previous === null || NO_HISTORY.has(name) || previous === next) return;
    try {
      const dir = join(historyDir, safeName(name));
      await writeAtomic(join(dir, `${stamp()}.json`), previous);
      const versions = (await readdir(dir)).filter((f) => f.endsWith(".json")).sort();
      await Promise.all(versions.slice(0, -HISTORY_KEEP).map((f) => rm(join(dir, f), { force: true })));
    } catch (error) {
      console.error(`[store] could not keep the previous version of ${name}:`, error);
    }
  }

  // A data directory inside the OS temp folder, or the serverless `/tmp`, is
  // wiped without warning. Worth knowing about on the dashboard rather than
  // discovering when a month of numbers disappears.
  const looksEphemeral = /(^|[\\/])(tmp|temp)([\\/]|$)/i.test(root);
  // On Vercel the project directory is read-only: every write fails outright.
  // This adapter only runs there when the cloud storage keys are missing.
  const onVercel = Boolean(process.env.VERCEL);

  async function listEventDays(): Promise<string[]> {
    try {
      const files = await readdir(analyticsDir);
      return files
        .filter((f) => /^\d{4}-\d{2}-\d{2}\.jsonl$/.test(f))
        .map((f) => f.slice(0, 10))
        .sort();
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw error;
    }
  }

  return {
    kind: "Plain files",
    location: root,
    durable: !looksEphemeral && !onVercel,
    warning: onVercel
      ? "Saving is switched off: this site is on Vercel, where the dashboard keeps its data in Upstash Redis and Vercel Blob, and they are not connected yet. Connect both to the project (see .env.example) and redeploy."
      : looksEphemeral
        ? "This server is writing to a temporary folder, so edits and visitor numbers will be lost when it restarts. Set DATA_DIR to a directory that persists."
        : undefined,

    async readDoc<T>(name: string): Promise<T | null> {
      const raw = await readIfPresent(join(contentDir, `${safeName(name)}.json`));
      if (raw === null) return null;
      try {
        return JSON.parse(raw) as T;
      } catch {
        // A corrupt document must not take the public site down: the caller
        // falls back to the code-defined content it was overriding.
        console.error(`[store] ${name}.json is not valid JSON — ignoring the override.`);
        return null;
      }
    },

    async writeDoc<T>(name: string, value: T): Promise<void> {
      const path = join(contentDir, `${safeName(name)}.json`);
      const next = `${JSON.stringify(value, null, 2)}\n`;
      await serialise(path, async () => {
        await keepHistory(name, await readIfPresent(path), next);
        await writeAtomic(path, next);
      });
    },

    async updateDoc<T>(name: string, change: (current: T | null) => T): Promise<T> {
      const path = join(contentDir, `${safeName(name)}.json`);
      return serialise(path, async () => {
        const raw = await readIfPresent(path);
        let current: T | null = null;
        if (raw !== null) {
          try {
            current = JSON.parse(raw) as T;
          } catch {
            // Refuse rather than start from empty: treating a corrupt file as
            // "nothing here yet" and writing over it would destroy whatever
            // could still be recovered from it by hand.
            throw new Error(`[store] ${name}.json is not valid JSON; refusing to overwrite it.`);
          }
        }
        const next = change(current);
        const serialised = `${JSON.stringify(next, null, 2)}\n`;
        await keepHistory(name, raw, serialised);
        await writeAtomic(path, serialised);
        return next;
      });
    },

    async deleteDoc(name: string): Promise<void> {
      const path = join(contentDir, `${safeName(name)}.json`);
      await serialise(path, async () => {
        await keepHistory(name, await readIfPresent(path));
        await rm(path, { force: true });
      });
    },

    async appendEvent(day: string, line: string): Promise<void> {
      const path = join(analyticsDir, `${safeDay(day)}.jsonl`);
      await serialise(path, async () => {
        await mkdir(analyticsDir, { recursive: true });
        await appendFile(path, `${line}\n`);
      });
    },

    async readEvents(day: string): Promise<string[]> {
      const raw = await readIfPresent(join(analyticsDir, `${safeDay(day)}.jsonl`));
      if (raw === null) return [];
      return raw.split("\n").filter((line) => line.length > 0);
    },

    listEventDays,

    async pruneEventsBefore(day: string): Promise<number> {
      const days = await listEventDays();
      const stale = days.filter((d) => d < day);
      await Promise.all(stale.map((d) => rm(join(analyticsDir, `${d}.jsonl`), { force: true })));
      return stale.length;
    },

    async putBlob({ key, bytes, contentType }: StoredBlob): Promise<void> {
      const safe = safeName(key);
      await writeAtomic(join(uploadsDir, safe), bytes);
      await writeAtomic(
        join(uploadsDir, `${safe}.meta.json`),
        JSON.stringify({ contentType, uploadedAt: Date.now() }),
      );
    },

    async readBlob(key: string): Promise<StoredBlob | null> {
      const safe = safeName(key);
      try {
        const bytes = await readFile(join(uploadsDir, safe));
        const meta = await readIfPresent(join(uploadsDir, `${safe}.meta.json`));
        const contentType = meta ? (JSON.parse(meta).contentType as string) : "application/octet-stream";
        return { key: safe, bytes: new Uint8Array(bytes), contentType };
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
        throw error;
      }
    },

    async listBlobs(): Promise<BlobInfo[]> {
      let files: string[];
      try {
        files = await readdir(uploadsDir);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
        throw error;
      }

      const infos = await Promise.all(
        files
          .filter((f) => !f.endsWith(".meta.json"))
          .map(async (f): Promise<BlobInfo | null> => {
            try {
              const [info, meta] = await Promise.all([
                stat(join(uploadsDir, f)),
                readIfPresent(join(uploadsDir, `${f}.meta.json`)),
              ]);
              const parsed = meta ? (JSON.parse(meta) as { contentType?: string; uploadedAt?: number }) : {};
              return {
                key: f,
                size: info.size,
                contentType: parsed.contentType ?? "application/octet-stream",
                uploadedAt: parsed.uploadedAt ?? info.mtimeMs,
              };
            } catch {
              return null;
            }
          }),
      );

      return infos.filter((i): i is BlobInfo => i !== null).sort((a, b) => b.uploadedAt - a.uploadedAt);
    },

    /**
     * Moves the photograph to the trash rather than deleting it, so a photo
     * removed by mistake can be put back for TRASH_DAYS days — including one
     * uploaded and deleted on the same day, which no nightly backup has seen.
     */
    async deleteBlob(key: string): Promise<void> {
      const safe = safeName(key);
      const prefix = `${stamp()}__`;
      await mkdir(trashDir, { recursive: true });
      for (const file of [safe, `${safe}.meta.json`]) {
        try {
          await rename(join(uploadsDir, file), join(trashDir, `${prefix}${file}`));
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
        }
      }
      await syncDirectory(trashDir);
    },
  };
}

/**
 * A stable fingerprint of where this store is writing, used only so the
 * dashboard can show which directory is in use without printing an absolute
 * path that may contain the operator's name.
 */
export function dataDirFingerprint(): string {
  return createHash("sha256").update(resolveRoot()).digest("hex").slice(0, 8);
}
