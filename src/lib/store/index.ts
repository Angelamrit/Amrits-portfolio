import "server-only";
import { createCloudStoreFromConfig, readCloudConfig } from "./cloud-clients";
import { createFsStore } from "./fs-store";
import type { Store } from "./types";

export type { Store, StoredBlob, BlobInfo } from "./types";

/**
 * Decides where the dashboard's data lives.
 *
 *   On Vercel     Upstash Redis + Vercel Blob (`cloud-store.ts`). Vercel's
 *                 filesystem is read-only, so files cannot work there. If the
 *                 cloud keys are missing, the file store is used instead and
 *                 the dashboard says saving is off (see its `warning`), rather
 *                 than every save failing with a confusing error.
 *   Anywhere else Plain files under `.data`, or `DATA_DIR` (`fs-store.ts`).
 *
 * `DASHBOARD_STORE=cloud` or `=files` overrides the choice. The default is
 * files off Vercel *even when the cloud keys are present*: copying them into
 * `.env.local` to run the import script must not quietly turn a laptop's dev
 * server into an editor of the live site's menus.
 *
 * The instance is held on `globalThis` so that the dev server's hot reload
 * does not build a second one with its own write queues — two queues over the
 * same files is exactly the interleaving the queues exist to prevent.
 */
function chooseStore(): Store {
  const wanted = process.env.DASHBOARD_STORE?.trim().toLowerCase();
  const useCloud = wanted === "cloud" || (wanted !== "files" && Boolean(process.env.VERCEL));
  if (!useCloud) return createFsStore();

  const { config, missing } = readCloudConfig();
  if (config) return createCloudStoreFromConfig(config);

  console.error(
    `[store] Cloud storage is not configured (missing: ${missing.join(", ")}). ` +
      "The dashboard can be viewed but not saved to. Connect Upstash Redis and Vercel Blob to the project and redeploy.",
  );
  return createFsStore();
}

const globalForStore = globalThis as typeof globalThis & { __chefStore?: { version: number; store: Store } };

/**
 * Bumped whenever the `Store` interface gains a method. The cached instance
 * above outlives hot reloads, so without this a dev server running across such
 * a change keeps serving the old object — and the new method is simply not
 * there. Production starts a fresh process on every deploy and never sees it.
 */
const STORE_API_VERSION = 3;

if (globalForStore.__chefStore?.version !== STORE_API_VERSION) {
  globalForStore.__chefStore = { version: STORE_API_VERSION, store: chooseStore() };
}

export const store: Store = globalForStore.__chefStore.store;
