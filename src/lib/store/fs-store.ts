import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, readdir, rename, rm, stat, writeFile, appendFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
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
 */

const DEFAULT_DIR = ".data";

function resolveRoot(): string {
  const configured = process.env.DATA_DIR?.trim();
  // The bundler sees a path it cannot predict and, by default, responds by
  // tracing the entire project into the server output — every source file and
  // the whole public folder, photography included. The path is genuinely a
  // runtime value (it is an environment variable naming a directory that does
  // not exist at build time), so tracing it could never find anything useful.
  return resolve(/* turbopackIgnore: true */ process.cwd(), configured && configured.length > 0 ? configured : DEFAULT_DIR);
}

/**
 * Names arrive from route params and form fields, so they are never trusted to
 * stay inside the data directory. Only this alphabet is allowed, which rules
 * out `..`, absolute paths, NUL bytes and Windows drive letters in one check
 * rather than trying to spot each of them.
 */
function safeName(name: string): string {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/.test(name) || name.includes("..")) {
    throw new Error(`Unsafe store key: ${JSON.stringify(name)}`);
  }
  return name;
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
    await writeFile(temp, contents);
    await rename(temp, path);
  } catch (error) {
    await rm(temp, { force: true }).catch(() => {});
    throw error;
  }
}

/**
 * Serialises work per key.
 *
 * Two admin tabs saving the same menu at the same moment, or two visits landing
 * in the same millisecond, would otherwise interleave a read-modify-write and
 * lose one of them. Chaining onto the previous promise for that key is enough
 * here because a single Node process serves the writes; if this ever runs on
 * several instances the file adapter is already the wrong answer and the
 * interface in `types.ts` is the seam to replace.
 */
const queues = new Map<string, Promise<unknown>>();

function serialise<T>(key: string, work: () => Promise<T>): Promise<T> {
  const previous = queues.get(key) ?? Promise.resolve();
  // `work` runs whether the previous write resolved or rejected: one failure
  // must not poison every later write to the same key. The swallowed copy is
  // what the next caller waits on, so the chain never carries a rejection.
  const next = previous.then(work, work);
  queues.set(
    key,
    next.catch(() => {}),
  );
  return next;
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

  // A data directory inside the OS temp folder, or the serverless `/tmp`, is
  // wiped without warning. Worth knowing about on the dashboard rather than
  // discovering when a month of numbers disappears.
  const looksEphemeral = /(^|[\\/])(tmp|temp)([\\/]|$)/i.test(root);

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
    durable: !looksEphemeral,

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
      await serialise(path, () => writeAtomic(path, `${JSON.stringify(value, null, 2)}\n`));
    },

    async deleteDoc(name: string): Promise<void> {
      await rm(join(contentDir, `${safeName(name)}.json`), { force: true });
    },

    async appendEvent(day: string, line: string): Promise<void> {
      const path = join(analyticsDir, `${safeName(day)}.jsonl`);
      await serialise(path, async () => {
        await mkdir(analyticsDir, { recursive: true });
        await appendFile(path, `${line}\n`);
      });
    },

    async readEvents(day: string): Promise<string[]> {
      const raw = await readIfPresent(join(analyticsDir, `${safeName(day)}.jsonl`));
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

    async deleteBlob(key: string): Promise<void> {
      const safe = safeName(key);
      await rm(join(uploadsDir, safe), { force: true });
      await rm(join(uploadsDir, `${safe}.meta.json`), { force: true });
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
