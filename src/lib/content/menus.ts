import "server-only";
import { z } from "zod";
import { menus as baseMenus } from "@/data/menus";
import { images } from "@/data/images";
import { store } from "@/lib/store";
import type { Menu, MenuCourse } from "@/types/content";
import { applyPatch } from "./overrides";
import { imageFromKey, keyOfImage, uploadsFor } from "./pictures";

/**
 * The menus, as the site should show them: the ones written in
 * `src/data/menus.ts` with the chef's edits laid over the top, plus any menu
 * he has added himself in the dashboard.
 *
 * Every page that shows a menu reads through here, so there is exactly one
 * place where "what the code says" and "what the chef changed" are
 * reconciled. The same two kinds as the dishes:
 *
 *   shipped  exist in the code; only the fields he changed are stored, and
 *            they are hidden rather than deleted.
 *   added    exist only here, as whole records, and can be deleted.
 *
 * One rule the dishes do not need: at least one menu always stays on the
 * website. The menus page is built around a menu — its header photograph is
 * the first menu's cover — and with none left it would have nothing to show.
 */

const DOC = "menus";

const dietaryTag = z.enum(["vegetarian", "vegan", "gluten-free", "contains-nuts", "halal", "dairy"]);

/**
 * A course, as the editor sends it.
 *
 * `dishId` and the free-text `name`/`description` are alternatives: a course
 * either points at a dish on the dishes list, and inherits its photograph,
 * description and dietary tags, or spells itself out.
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
  imageKey: z.string().trim().max(60).optional(),
});

export type MenuPatch = z.infer<typeof menuPatchSchema>;

/** What the editor sends: the menu's own fields, and whether it is on the website. */
export const menuFormSchema = z.object({
  name: z.string().trim().min(1, "A menu needs a name.").max(80),
  courseLabel: z.string().trim().max(60),
  venue: z.string().trim().max(80),
  intro: z.string().trim().max(1_200),
  notes: z.array(z.string().trim().min(1).max(240)).max(8),
  featured: z.boolean(),
  visible: z.boolean(),
  courses: z.array(courseSchema).min(1, "A menu needs at least one course.").max(20),
  imageKey: z.string().trim().min(1, "Add a cover photograph for the menu.").max(60),
});

export type MenuForm = z.infer<typeof menuFormSchema>;

type AddedMenu = Omit<MenuForm, "visible"> & { slug: string; createdAt: number };

type MenusDoc = {
  version: 1;
  updatedAt: number;
  patches: Record<string, MenuPatch>;
  added: AddedMenu[];
  hidden: string[];
  /** The running order, when the chef has changed it. Menus it leaves out follow in their natural order. */
  order: string[];
};

/** A menu as the dashboard sees it. */
export type AdminMenu = Menu & {
  hidden: boolean;
  added: boolean;
  edited: boolean;
  imageKey: string;
};

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const FALLBACK_IMAGE = images.thaliOverhead;

const emptyDoc: MenusDoc = { version: 1, updatedAt: 0, patches: {}, added: [], hidden: [], order: [] };

function normalise(doc: Partial<MenusDoc> | null): MenusDoc {
  if (!doc || doc.version !== 1) return emptyDoc;
  return {
    version: 1,
    updatedAt: doc.updatedAt ?? 0,
    patches: doc.patches && typeof doc.patches === "object" ? doc.patches : {},
    added: Array.isArray(doc.added) ? doc.added : [],
    hidden: Array.isArray(doc.hidden) ? doc.hidden : [],
    order: Array.isArray(doc.order) ? doc.order : [],
  };
}

async function readDoc(): Promise<MenusDoc> {
  return normalise(await store.readDoc<MenusDoc>(DOC));
}

async function changeDoc(change: (doc: MenusDoc) => MenusDoc): Promise<void> {
  await store.updateDoc<MenusDoc>(DOC, (current) => ({ ...change(normalise(current)), version: 1, updatedAt: Date.now() }));
}

/* ------------------------------------------------------------------ reading */

async function resolveAll(): Promise<AdminMenu[]> {
  const doc = await readDoc();
  const hidden = new Set(doc.hidden);
  const uploads = await uploadsFor([
    ...Object.values(doc.patches).map((patch) => patch.imageKey),
    ...doc.added.map((menu) => menu.imageKey),
  ]);

  const shipped = baseMenus.map((menu): AdminMenu => {
    const patch = doc.patches[menu.slug];
    const { imageKey, ...rest } = patch ?? {};
    const merged = applyPatch(menu, rest as Partial<Menu>);
    const image = imageFromKey(imageKey, uploads) ?? menu.image;
    return {
      ...merged,
      image,
      // Derived rather than stored: a menu should never claim seven courses while listing six.
      courseCount: merged.courses.length,
      hidden: hidden.has(menu.slug),
      added: false,
      edited: Boolean(patch),
      imageKey: keyOfImage(image),
    };
  });

  const added = doc.added.map((record): AdminMenu => {
    const image = imageFromKey(record.imageKey, uploads) ?? FALLBACK_IMAGE;
    return {
      slug: record.slug,
      name: record.name,
      kind: "tasting",
      courseCount: record.courses.length,
      courseLabel: record.courseLabel,
      intro: record.intro,
      courses: record.courses as MenuCourse[],
      notes: record.notes,
      venue: record.venue,
      featured: record.featured,
      image,
      hidden: hidden.has(record.slug),
      added: true,
      edited: false,
      imageKey: keyOfImage(image) || record.imageKey,
    };
  });

  const all = [...shipped, ...added];
  if (doc.order.length === 0) return all;
  const rank = new Map(doc.order.map((slug, index) => [slug, index]));
  return all
    .map((menu, index) => ({ menu, index }))
    .sort((a, b) => (rank.get(a.menu.slug) ?? 1_000 + a.index) - (rank.get(b.menu.slug) ?? 1_000 + b.index))
    .map(({ menu }) => menu);
}

export async function getMenusForAdmin(): Promise<AdminMenu[]> {
  return resolveAll();
}

export async function getMenuForAdmin(slug: string): Promise<AdminMenu | undefined> {
  return (await resolveAll()).find((menu) => menu.slug === slug);
}

function toPublic(menu: AdminMenu): Menu {
  return {
    slug: menu.slug,
    name: menu.name,
    kind: menu.kind,
    courseCount: menu.courseCount,
    courseLabel: menu.courseLabel,
    intro: menu.intro,
    courses: menu.courses,
    notes: menu.notes,
    venue: menu.venue,
    pdfUrl: menu.pdfUrl,
    featured: menu.featured,
    image: menu.image,
  };
}

/** What the website shows: hidden menus are left out everywhere. */
export async function getMenus(): Promise<Menu[]> {
  return (await resolveAll()).filter((menu) => !menu.hidden).map(toPublic);
}

export async function getMenuBySlug(slug: string): Promise<Menu | undefined> {
  return (await getMenus()).find((menu) => menu.slug === slug);
}

export async function getFeaturedMenus(): Promise<Menu[]> {
  return (await getMenus()).filter((menu) => menu.featured);
}

export async function menuExists(slug: string): Promise<boolean> {
  if (!SLUG.test(slug)) return false;
  return (await resolveAll()).some((menu) => menu.slug === slug);
}

export function originalMenu(slug: string): Menu | undefined {
  return baseMenus.find((menu) => menu.slug === slug);
}

/** Which menus the chef has edited — shown in the dashboard list. */
export async function editedMenuSlugs(): Promise<Set<string>> {
  return new Set(Object.keys((await readDoc()).patches));
}

/* ------------------------------------------------------------------ writing */

/** A web address for a new menu from its name: "Sunday Lunch" → "sunday-lunch", made unique. */
function slugFor(name: string, taken: Set<string>): string {
  const base =
    name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48)
      .replace(/-+$/, "") || "menu";
  if (!taken.has(base)) return base;
  for (let n = 2; ; n += 1) if (!taken.has(`${base}-${n}`)) return `${base}-${n}`;
}

function recordOf(form: MenuForm): Omit<AddedMenu, "slug" | "createdAt"> {
  return {
    name: form.name,
    courseLabel: form.courseLabel,
    venue: form.venue,
    intro: form.intro,
    notes: form.notes,
    featured: form.featured,
    courses: form.courses,
    imageKey: form.imageKey,
  };
}

/** Adds a menu at the end of the list. Returns its web address (slug). */
export async function createMenu(form: MenuForm): Promise<string> {
  let slug = "";
  await changeDoc((doc) => {
    slug = slugFor(form.name, new Set([...baseMenus.map((menu) => menu.slug), ...doc.added.map((menu) => menu.slug)]));
    return {
      ...doc,
      added: [...doc.added, { ...recordOf(form), slug, createdAt: Date.now() }],
      hidden: form.visible ? doc.hidden : [...doc.hidden, slug],
      order: doc.order.length > 0 ? [...doc.order, slug] : doc.order,
    };
  });
  return slug;
}

/** How many menus would be on the website after `change`. */
function visibleAfter(doc: MenusDoc, hide: Set<string>, remove: Set<string>): number {
  const hidden = new Set([...doc.hidden, ...hide]);
  const slugs = [...baseMenus.map((menu) => menu.slug), ...doc.added.map((menu) => menu.slug)].filter((slug) => !remove.has(slug));
  return slugs.filter((slug) => !hidden.has(slug)).length;
}

export class LastMenuError extends Error {
  constructor() {
    super("At least one menu has to stay on the website.");
  }
}

/**
 * Saves the editor's form for any menu. For a code menu only the fields that
 * differ from the code are kept. Throws `LastMenuError` if saving it as hidden
 * would leave the website with no menu.
 */
export async function saveMenu(slug: string, form: MenuForm): Promise<boolean> {
  let found = false;
  const base = originalMenu(slug);

  await changeDoc((doc) => {
    if (!form.visible && visibleAfter(doc, new Set([slug]), new Set()) === 0) throw new LastMenuError();
    const hidden = new Set(doc.hidden);
    if (form.visible) hidden.delete(slug);
    else hidden.add(slug);

    if (base) {
      found = true;
      const baseline: Record<string, unknown> = { ...base, imageKey: keyOfImage(base.image) };
      const incoming = recordOf(form) as Record<string, unknown>;
      const trimmed: MenuPatch = {};
      for (const [key, value] of Object.entries(incoming)) {
        if (JSON.stringify(value) !== JSON.stringify(baseline[key])) (trimmed as Record<string, unknown>)[key] = value;
      }
      const patches = { ...doc.patches };
      if (Object.keys(trimmed).length > 0) patches[slug] = trimmed;
      else delete patches[slug];
      return { ...doc, patches, hidden: [...hidden] };
    }

    const index = doc.added.findIndex((menu) => menu.slug === slug);
    if (index < 0) return doc;
    found = true;
    const added = [...doc.added];
    added[index] = { ...added[index], ...recordOf(form) };
    return { ...doc, added, hidden: [...hidden] };
  });

  return found;
}

/** Puts a code menu back as the code has it, including showing it again. */
export async function resetMenu(slug: string): Promise<void> {
  await changeDoc((doc) => {
    const patches = { ...doc.patches };
    delete patches[slug];
    return { ...doc, patches, hidden: doc.hidden.filter((entry) => entry !== slug) };
  });
}

/** Deletes a menu the chef added. Throws `LastMenuError` if it is the last one on the website. */
export async function deleteMenu(slug: string): Promise<boolean> {
  let removed = false;
  await changeDoc((doc) => {
    removed = doc.added.some((menu) => menu.slug === slug);
    if (!removed) return doc;
    if (visibleAfter(doc, new Set(), new Set([slug])) === 0) throw new LastMenuError();
    return {
      ...doc,
      added: doc.added.filter((menu) => menu.slug !== slug),
      hidden: doc.hidden.filter((entry) => entry !== slug),
      order: doc.order.filter((entry) => entry !== slug),
    };
  });
  return removed;
}

/** Throws `LastMenuError` rather than hide the last menu on the website. */
export async function setMenuHidden(slug: string, hidden: boolean): Promise<void> {
  await changeDoc((doc) => {
    if (hidden && visibleAfter(doc, new Set([slug]), new Set()) === 0) throw new LastMenuError();
    const next = new Set(doc.hidden);
    if (hidden) next.add(slug);
    else next.delete(slug);
    return { ...doc, hidden: [...next] };
  });
}

export async function setMenuFeatured(slug: string, featured: boolean): Promise<void> {
  await changeDoc((doc) => {
    const base = originalMenu(slug);
    if (base) {
      const patch: MenuPatch = { ...doc.patches[slug] };
      if (featured === base.featured) delete patch.featured;
      else patch.featured = featured;
      const patches = { ...doc.patches };
      if (Object.keys(patch).length > 0) patches[slug] = patch;
      else delete patches[slug];
      return { ...doc, patches };
    }
    return { ...doc, added: doc.added.map((menu) => (menu.slug === slug ? { ...menu, featured } : menu)) };
  });
}

export async function setMenuOrder(slugs: string[]): Promise<void> {
  await changeDoc((doc) => {
    const known = new Set([...baseMenus.map((menu) => menu.slug), ...doc.added.map((menu) => menu.slug)]);
    return { ...doc, order: [...new Set(slugs)].filter((slug) => known.has(slug)) };
  });
}

export type { MenuCourse };
