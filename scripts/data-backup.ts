/**
 * Makes a backup of the dashboard's data right now, and lists every backup.
 *
 *   npm run data:backup
 *
 * The live server already makes one a day by itself (see
 * `src/lib/store/backup.ts`); this is for the moment before something risky,
 * such as moving the site to a new server. Reads DATA_DIR and DATA_BACKUP_DIR
 * from the same .env files the site uses.
 */
import { backupRoot, createBackup, dataRoot, listBackups } from "@/lib/store/backup";

const root = dataRoot();
const dir = backupRoot(root);
const now = Date.now();
const name = `manual-${new Date(now).toISOString().replace(/[:.]/g, "-")}`;

const backup = await createBackup({ name, root, dir, now });
console.log(`\n  Backed up ${backup.files} files (${(backup.bytes / 1048576).toFixed(1)} MB)`);
console.log(`  from ${root}`);
console.log(`  to   ${backup.path}\n`);

console.log("  All backups, newest first:");
for (const b of await listBackups(dir)) {
  console.log(`    ${b.name.padEnd(42)} ${new Date(b.createdAt).toISOString().replace("T", " ").slice(0, 16)} UTC  ${b.files} files`);
}
console.log("\n  To put one back:  npm run data:restore -- <name>\n");
