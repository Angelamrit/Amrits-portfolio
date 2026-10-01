import "server-only";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { dishes as baseDishes } from "@/data/dishes";
import { images } from "@/data/images";
import { store } from "@/lib/store";
import type { DietaryTag, Dish, ImageAsset } from "@/types/content";
import { applyPatch } from "./overrides";
import { imageFromKey, keyOfImage, uploadsFor } from "./pictures";

/**
 * The dishes: the ones written in `src/data/dishes.ts`, with the chef's edits
 * laid over them, plus the dishes he has added himself in the dashboard.
 *
 * Two kinds, stored differently, because they live in different places.
 *
 *   shipped  exist in the code. The dashboard stores only a *patch* of the
 *            fields he changed, so a later code change still reaches every
 *            field he has not touched, and "reset" is deleting the patch.
 *            They cannot be deleted — a deleted code dish would come back on
 *            the next deploy and look like a bug — so they are hidden instead.
 *   added    exist only here, as whole records. They can be deleted for real.
 *
 * Either kind can be hidden from the website without losing it, and the
 * running order is a plain number per dish, set by the arrows on the list.
 *
 * A dish's photograph is chosen by key rather than typed as a path: a key
 * from `src/data/images.ts`, or the id of a photograph uploaded through the
 * dashboard. So a dish can never point at a file that does not exist, and the
 * alt text and dimensions come along with the choice.
 */

const DOC = "dishes";

const dietaryTag = z.enum(["vegetarian", "vegan", "gluten-free", "contains-nuts", "halal", "dairy"]);

export const dishPatchSchema = z.object({
  name: z.string().trim().min(1, "A dish needs a name.").max(90).optional(),
  tagline: z.string().trim().max(120).optional(),
  description: z.string().trim().max(600).optional(),
  tags: z.array(dietaryTag).max(6).optional(),
  signature: z.boolean().optional(),
  order: z.number().int().min(1).max(999).optional(),
  /** A key from `images` or an upload id, not a path — see the note above. */
  imageKey: z.string().trim().max(60).optional(),
});

export type DishPatch = z.infer<typeof dishPatchSchema>;

/** What the editor sends: the dish's own fields, and whether it is on the website. */
export const dishFormSchema = z.object({
  name: z.string().trim().min(1, "A dish needs a name.").max(90),
  tagline: z.string().trim().max(120),
  description: z.string().trim().max(600),
  tags: z.array(dietaryTag).max(6),
  signature: z.boolean(),
  visible: z.boolean(),
  imageKey: z.string().trim().min(1, "Add a photograph of the dish.").max(60),
});

export type DishForm = z.infer<typeof dishFormSchema>;

type AddedDish = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  tags: DietaryTag[];
  signature: boolean;
  order: number;
  imageKey: string;
  createdAt: number;
};

type DishesDoc = {
  version: 1;
  updatedAt: number;
  patches: Record<string, DishPatch>;
  added: AddedDish[];
  hidden: string[];
};

/** A dish as the dashboard sees it: the public shape plus where it came from. */
export type AdminDish = Dish & {
  /** Hidden from every page of the website, but kept. */
  hidden: boolean;
  /** Created in the dashboard (so it can be deleted), rather than in the code. */
  added: boolean;
  /** A code dish with stored edits (so it can be reset). */
  edited: boolean;
  /** The key of its photograph, for the editor's picker. */
  imageKey: string;
};

const ADDED_ID = /^d-[a-f0-9]{10}$/;

/** Shown if a dish's photograph has gone — an upload deleted since it was chosen. */
const FALLBACK_IMAGE: ImageAsset = images.platedDish;

const emptyDoc: DishesDoc = { version: 1, updatedAt: 0, patches: {}, added: [], hidden: [] };

function normalise(doc: Partial<DishesDoc> | null): DishesDoc {
  if (!doc || doc.version !== 1) return emptyDoc;
  return {
    version: 1,
    updatedAt: doc.updatedAt ?? 0,
    patches: doc.patches && typeof doc.patches === "object" ? doc.patches : {},
    added: Array.isArray(doc.added) ? doc.added : [],
    hidden: Array.isArray(doc.hidden) ? doc.hidden : [],
  };
}

async function readDoc(): Promise<DishesDoc> {
  return normalise(await store.readDoc<DishesDoc>(DOC));
}

/** Every write is one read-modify-write inside the store's queue, so two quick changes cannot erase each other. */
async function changeDoc(change: (doc: DishesDoc) => DishesDoc): Promise<void> {
  await store.updateDoc<DishesDoc>(DOC, (current) => ({ ...change(normalise(current)), version: 1, updatedAt: Date.now() }));
}

/* ------------------------------------------------------------------ photos */

export { getImageChoices, isKnownImageKey } from "./pictures";

/** Kept for callers that have a public dish in hand. */
export function imageKeyFor(dish: Dish): string | undefined {
  return keyOfImage(dish.image) || undefined;
}

/* ------------------------------------------------------------------ reading */

async function resolveAll(): Promise<AdminDish[]> {
  const doc = await readDoc();
  const hidden = new Set(doc.hidden);

  // The gallery document is only read when some dish actually uses an upload.
  const uploads = await uploadsFor([
    ...Object.values(doc.patches).map((patch) => patch.imageKey),
    ...doc.added.map((dish) => dish.imageKey),
  ]);
  const imageFor = (key: string | undefined) => imageFromKey(key, uploads);

  const shipped = baseDishes.map((dish): AdminDish => {
    const patch = doc.patches[dish.id];
    const { imageKey, ...rest } = patch ?? {};
    const merged = applyPatch(dish, rest as Partial<Dish>);
    // An upload deleted since it was chosen falls back to the dish's own photograph.
    const image = imageFor(imageKey) ?? dish.image;
    return { ...merged, image, hidden: hidden.has(dish.id), added: false, edited: Boolean(patch), imageKey: keyOfImage(image) };
  });

  const added = doc.added.map((record): AdminDish => {
    const image = imageFor(record.imageKey) ?? FALLBACK_IMAGE;
    return {
      id: record.id,
      name: record.name,
      tagline: record.tagline,
      description: record.description,
      tags: record.tags,
      signature: record.signature,
      order: record.order,
      image,
      hidden: hidden.has(record.id),
      added: true,
      edited: false,
      imageKey: imageFor(record.imageKey) ? record.imageKey : keyOfImage(image),
    };
  });

  return [...shipped, ...added].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

/** Everything, hidden dishes included, for the dashboard. */
export async function getDishesForAdmin(): Promise<AdminDish[]> {
  return resolveAll();
}

export async function getDishForAdmin(id: string): Promise<AdminDish | undefined> {
  return (await resolveAll()).find((dish) => dish.id === id);
}

function toPublic(dish: AdminDish): Dish {
  return {
    id: dish.id,
    name: dish.name,
    tagline: dish.tagline,
    description: dish.description,
    image: dish.image,
    tags: dish.tags,
    signature: dish.signature,
    order: dish.order,
  };
}

/** What the website shows: hidden dishes are left out everywhere. */
export async function getDishes(): Promise<Dish[]> {
  return (await resolveAll()).filter((dish) => !dish.hidden).map(toPublic);
}

export async function getDishById(id: string): Promise<Dish | undefined> {
  return (await getDishes()).find((dish) => dish.id === id);
}

export async function getSignatureDishes(): Promise<Dish[]> {
  return (await getDishes()).filter((dish) => dish.signature);
}

/** Whether an id names a dish that exists — shipped or added. */
export async function dishExists(id: string): Promise<boolean> {
  if (baseDishes.some((dish) => dish.id === id)) return true;
  if (!ADDED_ID.test(id)) return false;
  return (await readDoc()).added.some((dish) => dish.id === id);
}

export function originalDish(id: string): Dish | undefined {
  return baseDishes.find((dish) => dish.id === id);
}

export async function editedDishIds(): Promise<Set<string>> {
  return new Set(Object.keys((await readDoc()).patches));
}

/* ------------------------------------------------------------------ writing */

/**
 * Adds a dish. It goes to the end of the running order and onto the website
 * straight away. Returns its new id.
 */
export async function createDish(form: DishForm): Promise<string> {
  const id = `d-${randomBytes(5).toString("hex")}`;
  const current = await resolveAll();
  const order = Math.min(999, Math.max(0, ...current.map((dish) => dish.order)) + 1);

  await changeDoc((doc) => ({
    ...doc,
    added: [
      ...doc.added,
      {
        id,
        name: form.name,
        tagline: form.tagline,
        description: form.description,
        tags: form.tags,
        signature: form.signature,
        order,
        imageKey: form.imageKey,
        createdAt: Date.now(),
      },
    ],
    hidden: form.visible ? doc.hidden : [...doc.hidden, id],
  }));
  return id;
}

/**
 * Saves the editor's form for any dish.
 *
 * For a code dish only the fields that differ from the code are kept, and the
 * stored position is carried over — the editor does not send one, and saving
 * a new description must not quietly move the dish back to its old place.
 */
export async function saveDish(id: string, form: DishForm): Promise<boolean> {
  let found = false;
  const base = originalDish(id);

  await changeDoc((doc) => {
    const hidden = new Set(doc.hidden);
    if (form.visible) hidden.delete(id);
    else hidden.add(id);

    if (base) {
      found = true;
      const baseline: Record<string, unknown> = { ...base, imageKey: keyOfImage(base.image) };
      const incoming: DishPatch = {
        name: form.name,
        tagline: form.tagline,
        description: form.description,
        tags: form.tags,
        signature: form.signature,
        imageKey: form.imageKey,
      };
      const trimmed: DishPatch = {};
      for (const [key, value] of Object.entries(incoming) as [keyof DishPatch, unknown][]) {
        if (JSON.stringify(value) !== JSON.stringify(baseline[key])) (trimmed as Record<string, unknown>)[key] = value;
      }
      const keptOrder = doc.patches[id]?.order;
      if (keptOrder !== undefined) trimmed.order = keptOrder;

      const patches = { ...doc.patches };
      if (Object.keys(trimmed).length > 0) patches[id] = trimmed;
      else delete patches[id];
      return { ...doc, patches, hidden: [...hidden] };
    }

    const index = doc.added.findIndex((dish) => dish.id === id);
    if (index < 0) return doc;
    found = true;
    const added = [...doc.added];
    added[index] = {
      ...added[index],
      name: form.name,
      tagline: form.tagline,
      description: form.description,
      tags: form.tags,
      signature: form.signature,
      imageKey: form.imageKey,
    };
    return { ...doc, added, hidden: [...hidden] };
  });

  return found;
}

/** Puts a code dish back as the code has it — words, photograph, place and visibility. */
export async function resetDish(id: string): Promise<void> {
  await changeDoc((doc) => {
    const patches = { ...doc.patches };
    delete patches[id];
    return { ...doc, patches, hidden: doc.hidden.filter((entry) => entry !== id) };
  });
}

/** Deletes a dish the chef added. Code dishes cannot be deleted, only hidden. */
export async function deleteDish(id: string): Promise<boolean> {
  let removed = false;
  await changeDoc((doc) => {
    removed = doc.added.some((dish) => dish.id === id);
    if (!removed) return doc;
    return {
      ...doc,
      added: doc.added.filter((dish) => dish.id !== id),
      hidden: doc.hidden.filter((entry) => entry !== id),
    };
  });
  return removed;
}

export async function setDishHidden(id: string, hidden: boolean): Promise<void> {
  await changeDoc((doc) => {
    const next = new Set(doc.hidden);
    if (hidden) next.add(id);
    else next.delete(id);
    return { ...doc, hidden: [...next] };
  });
}

export async function setDishSignature(id: string, signature: boolean): Promise<void> {
  await changeDoc((doc) => {
    const base = originalDish(id);
    if (base) {
      const patch: DishPatch = { ...doc.patches[id] };
      if (signature === base.signature) delete patch.signature;
      else patch.signature = signature;
      const patches = { ...doc.patches };
      if (Object.keys(patch).length > 0) patches[id] = patch;
      else delete patches[id];
      return { ...doc, patches };
    }
    return { ...doc, added: doc.added.map((dish) => (dish.id === id ? { ...dish, signature } : dish)) };
  });
}

/**
 * Stores a new running order: the dishes in `ids` become 1, 2, 3… in that
 * order. A code dish that lands on its own original number carries no patch
 * for it, so putting the list back as it was leaves nothing behind.
 */
export async function setDishOrder(ids: string[]): Promise<void> {
  const position = new Map(ids.map((id, index) => [id, index + 1]));

  await changeDoc((doc) => {
    const patches = { ...doc.patches };
    for (const base of baseDishes) {
      const order = position.get(base.id);
      if (order === undefined) continue;
      const patch: DishPatch = { ...patches[base.id] };
      if (order === base.order) delete patch.order;
      else patch.order = order;
      if (Object.keys(patch).length > 0) patches[base.id] = patch;
      else delete patches[base.id];
    }
    const added = doc.added.map((dish) => {
      const order = position.get(dish.id);
      return order === undefined ? dish : { ...dish, order };
    });
    return { ...doc, patches, added };
  });
}
