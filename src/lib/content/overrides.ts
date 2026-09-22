import "server-only";
import { store } from "@/lib/store";

/**
 * How the chef's edits sit on top of the content that ships with the code.
 *
 * The site's content lives in `src/data/*.ts` and that stays true: those files
 * are the baseline, version-controlled, reviewable, and the thing a fresh
 * deploy renders. What the dashboard writes is a *patch* — only the fields
 * somebody actually changed, keyed by the item's id.
 *
 * Storing patches rather than whole copies is the decision that matters here.
 * With whole copies, the moment the chef edits one line of one menu, that
 * menu's entire content is frozen at the version he edited: a later code
 * change that adds a dietary tag, fixes a typo or adds a course never reaches
 * the site, and nobody can tell why. With patches, code changes keep flowing
 * through every field the chef has not personally overridden, and "reset this
 * back to the original" is deleting a key rather than reconstructing a value.
 *
 * The cost is that a patch can go stale — it can name a menu that no longer
 * exists in the code. Those are ignored on read rather than deleted, because
 * a slug may come back, and because silently discarding somebody's writing is
 * worse than carrying a few unused bytes.
 */

export type PatchDoc<T> = {
  version: 1;
  updatedAt: number;
  patches: Record<string, T>;
};

export function emptyDoc<T>(): PatchDoc<T> {
  return { version: 1, updatedAt: 0, patches: {} };
}

export async function readPatchDoc<T>(name: string): Promise<PatchDoc<T>> {
  const doc = await store.readDoc<PatchDoc<T>>(name);
  if (!doc || doc.version !== 1 || typeof doc.patches !== "object" || doc.patches === null) return emptyDoc<T>();
  return doc;
}

/** Writes one item's patch. An `undefined` patch removes it, which restores the original. */
export async function writePatch<T>(name: string, id: string, patch: T | undefined): Promise<void> {
  const doc = await readPatchDoc<T>(name);
  const patches = { ...doc.patches };

  if (patch === undefined) delete patches[id];
  else patches[id] = patch;

  await store.writeDoc<PatchDoc<T>>(name, { version: 1, updatedAt: Date.now(), patches });
}

/**
 * Applies a patch over a base object, taking only the keys the patch actually
 * carries. `undefined` in a patch means "not overridden", never "set to
 * nothing" — clearing a field is done by storing an empty value of its own
 * type (`""`, `[]`), which is what the editor sends.
 */
export function applyPatch<T extends object>(base: T, patch: Partial<T> | undefined): T {
  if (!patch) return base;
  const merged = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    if (value !== undefined) (merged as Record<string, unknown>)[key] = value;
  }
  return merged;
}
