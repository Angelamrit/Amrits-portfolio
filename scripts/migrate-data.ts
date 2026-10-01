/**
 * Copies the dashboard's data from this computer to the live site's storage.
 *
 *   npm run data:migrate               copy
 *   npm run data:migrate -- --dry-run  show what would be copied, write nothing
 *   npm run data:migrate -- --force    also replace content the live site has
 *                                      changed since (menu edits made there)
 *
 * Reads `.data` (or DATA_DIR) and writes to the Upstash Redis database and
 * Vercel Blob store named by KV_REST_API_URL, KV_REST_API_TOKEN and
 * BLOB_READ_WRITE_TOKEN in `.env.local` — the values from the Vercel project's
 * Storage tab. What it copies, and why it is safe to run twice, is described in
 * `src/lib/store/migrate.ts`.
 */
import { readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { MAX_EDGE } from "@/lib/content/prepare-upload";
import { connectCloud, readCloudConfig } from "@/lib/store/cloud-clients";
import { createFsStore } from "@/lib/store/fs-store";
import { migrateToCloud, type Resize } from "@/lib/store/migrate";

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const force = args.has("--force");

/** Matches what the dashboard's uploader now does in the browser (see prepare-upload.ts). */
const KEEP_UNDER_BYTES = 2.5 * 1024 * 1024;

const resize: Resize = async (bytes, contentType) => {
  // Installed with Next.js, which uses it for its own image optimizer.
  let sharp: typeof import("sharp").default;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    return null;
  }
  const meta = await sharp(bytes).metadata();
  const longest = Math.max(meta.width ?? 0, meta.height ?? 0);
  if (longest <= MAX_EDGE && bytes.byteLength <= KEEP_UNDER_BYTES) return null;

  // `rotate()` with no angle applies the camera's rotation flag, which the
  // re-encode would otherwise drop, turning portrait photos on their side.
  const pipeline = sharp(bytes).rotate().resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true });
  const encoded =
    contentType === "image/png"
      ? pipeline.png({ compressionLevel: 9 })
      : contentType === "image/webp"
        ? pipeline.webp({ quality: 86 })
        : pipeline.jpeg({ quality: 86, mozjpeg: true });
  const { data, info } = await encoded.toBuffer({ resolveWithObject: true });
  return { bytes: new Uint8Array(data), width: info.width, height: info.height };
};

async function main() {
  const { config, missing } = readCloudConfig();
  if (!config) {
    console.error(`Missing from .env.local: ${missing.join(", ")}.`);
    console.error("Copy them from the Vercel project: Storage -> each store -> .env.local tab.");
    process.exit(1);
  }

  const dataDir = resolve(process.cwd(), process.env.DATA_DIR?.trim() || ".data");
  let docNames: string[] = [];
  try {
    docNames = (await readdir(join(dataDir, "content"))).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5));
  } catch {
    // No content edits yet; photos and visits may still be worth copying.
  }

  const { store: cloud, kv } = connectCloud(config);
  console.log(`${dryRun ? "Dry run: nothing will be written.\n" : ""}From ${dataDir}\nTo   ${cloud.kind} (${cloud.location ?? "?"})\n`);

  const report = await migrateToCloud({ from: createFsStore(), to: cloud, kv, docNames, resize, dryRun, force });

  console.log(`\n${dryRun ? "Would copy" : "Copied"}:`);
  console.log(`  ${report.photos} photo(s)${report.resized.length ? `, ${report.resized.length} shrunk to fit Vercel` : ""}`);
  console.log(`  ${report.docs.length} content document(s): ${report.docs.join(", ") || "none"}`);
  console.log(`  ${report.visits} visit(s) across ${report.days} day(s)`);
  if (report.skippedDocs.length) console.log(`  Left alone: ${report.skippedDocs.join(", ")}`);
  if (report.tooLarge.length) {
    console.warn(`\nStill over Vercel's 4.5MB limit, so these will not display on the live site: ${report.tooLarge.join(", ")}`);
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(`\n${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
