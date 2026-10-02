/**
 * Puts a backup of the dashboard's data back.
 *
 *   npm run data:restore                 list the backups
 *   npm run data:restore -- 2026-10-01   restore that one
 *
 * Stop the site first, and rebuild before starting it again: the public pages
 * are rendered from the data when the site is built, so a rebuild is what
 * makes them show the restored content. The current data is backed up before
 * anything is replaced, so a restore can itself be undone.
 */
import { backupRoot, dataRoot, listBackups, restoreBackup } from "@/lib/store/backup";

const root = dataRoot();
const dir = backupRoot(root);
const name = process.argv.slice(2).find((arg) => !arg.startsWith("-"));

const backups = await listBackups(dir);
if (!name) {
  if (backups.length === 0) {
    console.log(`\n  No backups yet in ${dir}.\n`);
  } else {
    console.log(`\n  Backups in ${dir}, newest first:\n`);
    for (const b of backups) {
      console.log(`    ${b.name.padEnd(42)} ${new Date(b.createdAt).toISOString().replace("T", " ").slice(0, 16)} UTC  ${b.files} files`);
    }
    console.log("\n  To restore one, stop the site, then:  npm run data:restore -- <name>\n");
  }
  process.exit(0);
}

const { restored, safety } = await restoreBackup({ name, root, dir });
console.log(`
  Restored ${restored.name} (${restored.files} files) into ${root}.
  The data as it was a moment ago is kept as backup "${safety.name}",
  so this can be undone with:  npm run data:restore -- ${safety.name}

  Now rebuild and start the site so the public pages show the restored content:
    npm run build
    then start it again (e.g. pm2 restart <app name>)
`);
