import "server-only";
import { createFsStore } from "./fs-store";
import type { Store } from "./types";

export type { Store, StoredBlob, BlobInfo } from "./types";

/**
 * The single line that decides where the dashboard's data lives.
 *
 * Hosting is undecided, so this defaults to the filesystem adapter, which
 * needs no account, no dependency and no configuration: it writes to `.data`
 * beside the project, or to `DATA_DIR` if that is set. That is correct on a
 * laptop and on any Node host with a disk — a VPS, Docker with a volume,
 * Render or Railway with persistent storage.
 *
 * If this site is ever deployed to Vercel, Netlify or any other serverless
 * platform, the filesystem there is read-only apart from `/tmp`, and `/tmp` is
 * discarded between invocations. The dashboard would appear to work and then
 * lose every visit and every menu edit. The fix at that point is to add one
 * file next to `fs-store.ts` implementing the same `Store` interface against
 * whatever database the platform offers, and change the call below. Nothing
 * else in the application reads or writes storage directly.
 *
 * The instance is held on `globalThis` so that the dev server's hot reload
 * does not build a second one with its own write queues — two queues over the
 * same files is exactly the interleaving the queues exist to prevent.
 */
const globalForStore = globalThis as typeof globalThis & { __chefStore?: { version: number; store: Store } };

/**
 * Bumped whenever the `Store` interface gains a method. The cached instance
 * above outlives hot reloads, so without this a dev server running across such
 * a change keeps serving the old object — and the new method is simply not
 * there. Production starts a fresh process on every deploy and never sees it.
 */
const STORE_API_VERSION = 2;

if (globalForStore.__chefStore?.version !== STORE_API_VERSION) {
  globalForStore.__chefStore = { version: STORE_API_VERSION, store: createFsStore() };
}

export const store: Store = globalForStore.__chefStore.store;
