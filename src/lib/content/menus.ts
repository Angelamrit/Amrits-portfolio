import "server-only";
import { z } from "zod";
import { menus as baseMenus } from "@/data/menus";
import type { Menu, MenuCourse } from "@/types/content";
import { applyPatch, readPatchDoc, writePatch, type PatchDoc } from "./overrides";

/**
 * The menus, as the site should show them: the ones written in
 * `src/data/menus.ts`, with the chef's own edits laid over the top.
 *
 * Every page that shows a menu reads through here rather than importing the
 * data module, so there is exactly one place where "what the code says" and
 * "what the chef changed" are reconciled.
 */

const DOC = "menus";

const dietaryTag = z.enum(["vegetarian", "vegan", "gluten-free", "contains-nuts", "halal", "dairy"]);

/**
 * A course, as the editor sends it.
 *
 * `dishId` and the free-text `name`/`description` are alternatives: a course
 * either points at a dish on the dishes list, and inherits its description and
 * dietary tags, or spells itself out. The editor offers both so a course can
 * be written in prose when it is not a single dish on the list.
 */
const courseSchema = z.object({
  title: z.string().trim().min(1, "Every course needs a heading.").max(80),
  dishId: z.string().trim().max(80).optional(),
  name: z.string().trim().max(120).optional(),
  description: z.string().trim().max(600).optional(),
  tags: z.array(dietaryTag).max(6).optional(),
  status: z.enum(["confirmed", "draft"]),
});

export const menuPatchSchema = z.object({
  name: z.string().trim().min(1, "A menu needs a name.").max(80).optional(),
  courseLabel: z.string().trim().max(60).optional(),
  venue: z.string().trim().max(80).optional(),
  intro: z.string().trim().max(1_200).optional(),
  notes: z.array(z.string().trim().min(1).max(240)).max(8).optional(),
  featured: z.boolean().optional(),
  courses: z.array(courseSchema).max(20).optional(),
});

export type MenuPatch = z.infer<typeof menuPatchSchema>;

export const menuSlugs = baseMenus.map((menu) => menu.slug);

/** The untouched version, for the editor's "reset" and for showing what changed. */
export function originalMenu(slug: string): Menu | undefined {
  return baseMenus.find((menu) => menu.slug === slug);
}

export async function getMenuPatches(): Promise<PatchDoc<MenuPatch>> {
  return readPatchDoc<MenuPatch>(DOC);
}

export async function getMenus(): Promise<Menu[]> {
  const { patches } = await getMenuPatches();

  return baseMenus.map((menu) => {
    const patch = patches[menu.slug];
    const merged = applyPatch(menu, patch as Partial<Menu> | undefined);

    // `courseCount` is displayed next to the courses, so it is derived rather
    // than stored: an editor who removes a course should never be able to
    // leave the site claiming seven when it lists six.
    return { ...merged, courseCount: merged.courses.length };
  });
}

export async function getMenuBySlug(slug: string): Promise<Menu | undefined> {
  return (await getMenus()).find((menu) => menu.slug === slug);
}

export async function getFeaturedMenus(): Promise<Menu[]> {
  return (await getMenus()).filter((menu) => menu.featured);
}

/**
 * Stores an edit.
 *
 * Only fields that genuinely differ from the code's version are kept, so a
 * chef who opens a menu, changes one word and saves does not thereby freeze
 * every other field against future code changes. When nothing differs the
 * patch is dropped entirely, which is the same thing as pressing reset.
 */
export async function saveMenuPatch(slug: string, patch: MenuPatch): Promise<void> {
  const base = originalMenu(slug);
  if (!base) throw new Error(`No menu with the slug ${JSON.stringify(slug)}`);

  const trimmed: MenuPatch = {};
  for (const [key, value] of Object.entries(patch) as [keyof MenuPatch, unknown][]) {
    if (value === undefined) continue;
    const original = (base as Record<string, unknown>)[key];
    if (JSON.stringify(value) === JSON.stringify(original)) continue;
    (trimmed as Record<string, unknown>)[key] = value;
  }

  await writePatch<MenuPatch>(DOC, slug, Object.keys(trimmed).length > 0 ? trimmed : undefined);
}

export async function resetMenu(slug: string): Promise<void> {
  await writePatch<MenuPatch>(DOC, slug, undefined);
}

/** Which menus the chef has edited — shown in the dashboard list. */
export async function editedMenuSlugs(): Promise<Set<string>> {
  const { patches } = await getMenuPatches();
  return new Set(Object.keys(patches));
}

export type { MenuCourse };
