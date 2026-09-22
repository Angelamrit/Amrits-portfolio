import "server-only";
import { z } from "zod";
import { dishes as baseDishes } from "@/data/dishes";
import { images } from "@/data/images";
import type { Dish } from "@/types/content";
import { applyPatch, readPatchDoc, writePatch, type PatchDoc } from "./overrides";

/**
 * The dishes, with the chef's edits laid over the code's versions.
 *
 * The same patch model as the menus, with one addition: a dish carries a
 * photograph, and the chef can change which one. He picks from the pictures
 * already in `src/data/images.ts` rather than typing a path, so a dish can
 * never end up pointing at a file that does not exist — and the alt text,
 * dimensions and credit come along with the choice instead of being retyped.
 */

const DOC = "dishes";

const dietaryTag = z.enum(["vegetarian", "vegan", "gluten-free", "contains-nuts", "halal", "dairy"]);

export const dishPatchSchema = z.object({
  name: z.string().trim().min(1, "A dish needs a name.").max(90).optional(),
  tagline: z.string().trim().max(120).optional(),
  description: z.string().trim().max(600).optional(),
  tags: z.array(dietaryTag).max(6).optional(),
  signature: z.boolean().optional(),
  order: z.number().int().min(1).max(99).optional(),
  /** A key from `images`, not a path — see the note above. */
  imageKey: z.string().trim().max(60).optional(),
});

export type DishPatch = z.infer<typeof dishPatchSchema>;

/** Every picture the chef can choose from, with a readable label. */
export const imageChoices = Object.entries(images).map(([key, image]) => ({
  key,
  src: image.src,
  alt: image.alt,
  // "paneerCurry" reads as "Paneer curry" in a dropdown.
  label: key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim(),
}));

const imagesByKey = images as Record<string, Dish["image"]>;

export function imageKeyFor(dish: Dish): string | undefined {
  return Object.keys(images).find((key) => imagesByKey[key].src === dish.image.src);
}

export function originalDish(id: string): Dish | undefined {
  return baseDishes.find((dish) => dish.id === id);
}

export async function getDishPatches(): Promise<PatchDoc<DishPatch>> {
  return readPatchDoc<DishPatch>(DOC);
}

export async function getDishes(): Promise<Dish[]> {
  const { patches } = await getDishPatches();

  return baseDishes
    .map((dish) => {
      const patch = patches[dish.id];
      if (!patch) return dish;

      const { imageKey, ...rest } = patch;
      const merged = applyPatch(dish, rest as Partial<Dish>);
      const chosen = imageKey ? imagesByKey[imageKey] : undefined;
      return chosen ? { ...merged, image: chosen } : merged;
    })
    .sort((a, b) => a.order - b.order);
}

export async function getDishById(id: string): Promise<Dish | undefined> {
  return (await getDishes()).find((dish) => dish.id === id);
}

export async function getSignatureDishes(): Promise<Dish[]> {
  return (await getDishes()).filter((dish) => dish.signature);
}

export async function saveDishPatch(id: string, patch: DishPatch): Promise<void> {
  const base = originalDish(id);
  if (!base) throw new Error(`No dish with the id ${JSON.stringify(id)}`);

  const baseline: Record<string, unknown> = { ...base, imageKey: imageKeyFor(base) };

  const trimmed: DishPatch = {};
  for (const [key, value] of Object.entries(patch) as [keyof DishPatch, unknown][]) {
    if (value === undefined) continue;
    if (JSON.stringify(value) === JSON.stringify(baseline[key])) continue;
    (trimmed as Record<string, unknown>)[key] = value;
  }

  await writePatch<DishPatch>(DOC, id, Object.keys(trimmed).length > 0 ? trimmed : undefined);
}

export async function resetDish(id: string): Promise<void> {
  await writePatch<DishPatch>(DOC, id, undefined);
}

export async function editedDishIds(): Promise<Set<string>> {
  const { patches } = await getDishPatches();
  return new Set(Object.keys(patches));
}
