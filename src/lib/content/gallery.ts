import "server-only";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { gallery as baseGallery, galleryCategories } from "@/data/gallery";
import { store } from "@/lib/store";
import type { GalleryCategory, GalleryItem, ImageAsset } from "@/types/content";
import { EXTENSIONS, readImage } from "./image-size";

/**
 * The gallery, which is the one part of the site the chef can add to rather
 * than only edit.
 *
 * That changes the shape of what is stored. A menu or a dish exists in the
 * code and the dashboard adjusts it; a photograph he uploads exists only here.
 * So this document carries four things rather than one:
 *
 *   patches  edits to the pictures that ship with the site
 *   added    pictures uploaded through the dashboard, newest first
 *   hidden   ids of shipped pictures retired from the public gallery
 *   order    the full running order, when he has rearranged it
 *
 * Hiding rather than deleting is deliberate for the shipped pictures: they
 * live in the code, so a "delete" that only removed them from a list would
 * reappear on the next deploy and look like a bug. Uploads, which exist
 * nowhere else, are genuinely deleted, bytes and all.
 */

const DOC = "gallery";

/** Photographs are big and the store is the server's own disk; this keeps one upload from filling it. */
export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;

const categoryValues = galleryCategories
  .map((entry) => entry.value)
  .filter((value): value is GalleryCategory => value !== "all");

const categorySchema = z.enum(categoryValues as [GalleryCategory, ...GalleryCategory[]]);
const spanSchema = z.enum(["wide", "tall", "square"]);

export const galleryPatchSchema = z.object({
  caption: z.string().trim().max(160).optional(),
  alt: z.string().trim().max(240).optional(),
  category: categorySchema.optional(),
  featured: z.boolean().optional(),
  span: spanSchema.optional(),
});

export type GalleryPatch = z.infer<typeof galleryPatchSchema>;

type Upload = {
  id: string;
  /** The blob key in the store, e.g. `u-3f9a…​.jpg`. */
  key: string;
  width: number;
  height: number;
  alt: string;
  caption?: string;
  category: GalleryCategory;
  featured?: boolean;
  span?: "wide" | "tall" | "square";
  uploadedAt: number;
};

type GalleryDoc = {
  version: 1;
  updatedAt: number;
  patches: Record<string, GalleryPatch>;
  added: Upload[];
  hidden: string[];
  order: string[];
};

const emptyDoc: GalleryDoc = { version: 1, updatedAt: 0, patches: {}, added: [], hidden: [], order: [] };

async function readDoc(): Promise<GalleryDoc> {
  const doc = await store.readDoc<GalleryDoc>(DOC);
  if (!doc || doc.version !== 1) return emptyDoc;
  return {
    ...emptyDoc,
    ...doc,
    patches: doc.patches ?? {},
    added: Array.isArray(doc.added) ? doc.added : [],
    hidden: Array.isArray(doc.hidden) ? doc.hidden : [],
    order: Array.isArray(doc.order) ? doc.order : [],
  };
}

async function writeDoc(doc: GalleryDoc): Promise<void> {
  await store.writeDoc<GalleryDoc>(DOC, { ...doc, version: 1, updatedAt: Date.now() });
}

/** Uploads are served through a route of their own, not from `/public`. */
export function uploadSrc(key: string): string {
  return `/api/media/${key}`;
}

function uploadToItem(upload: Upload): GalleryItem {
  const image: ImageAsset = {
    src: uploadSrc(upload.key),
    alt: upload.alt,
    width: upload.width,
    height: upload.height,
  };
  return {
    id: upload.id,
    image,
    category: upload.category,
    caption: upload.caption,
    featured: upload.featured,
    span: upload.span,
  };
}

function applyGalleryPatch(item: GalleryItem, patch: GalleryPatch | undefined): GalleryItem {
  if (!patch) return item;
  return {
    ...item,
    caption: patch.caption ?? item.caption,
    category: patch.category ?? item.category,
    featured: patch.featured ?? item.featured,
    span: patch.span ?? item.span,
    image: patch.alt ? { ...item.image, alt: patch.alt } : item.image,
  };
}

/**
 * Everything the dashboard shows, including pictures hidden from the public
 * gallery — the chef has to be able to see a retired photograph to bring it
 * back.
 */
export async function getGalleryForAdmin(): Promise<{ items: (GalleryItem & { hidden: boolean; uploaded: boolean })[] }> {
  const doc = await readDoc();
  const hidden = new Set(doc.hidden);

  const shipped = baseGallery.map((item) => ({
    ...applyGalleryPatch(item, doc.patches[item.id]),
    hidden: hidden.has(item.id),
    uploaded: false,
  }));

  const uploaded = doc.added.map((upload) => ({
    ...applyGalleryPatch(uploadToItem(upload), doc.patches[upload.id]),
    hidden: hidden.has(upload.id),
    uploaded: true,
  }));

  return { items: sortByOrder([...uploaded, ...shipped], doc.order) };
}

/**
 * The running order.
 *
 * Ids the chef has arranged come first, in his order; anything he has not
 * touched — a picture added in code since he last rearranged things — keeps
 * its natural position at the end rather than disappearing or jumping to the
 * front.
 */
function sortByOrder<T extends { id: string }>(items: T[], order: string[]): T[] {
  if (order.length === 0) return items;
  const rank = new Map(order.map((id, index) => [id, index]));
  return [...items].sort((a, b) => (rank.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b.id) ?? Number.MAX_SAFE_INTEGER));
}

/** What the public gallery shows. */
export async function getGallery(): Promise<GalleryItem[]> {
  const { items } = await getGalleryForAdmin();
  // The two dashboard-only flags are dropped here rather than carried into the
  // public components, which have no business knowing where a picture came from.
  return items
    .filter((item) => !item.hidden)
    .map((item): GalleryItem => ({
      id: item.id,
      image: item.image,
      category: item.category,
      caption: item.caption,
      featured: item.featured,
      span: item.span,
    }));
}

export async function getFeaturedGallery(): Promise<GalleryItem[]> {
  return (await getGallery()).filter((item) => item.featured);
}

export async function getGalleryByCategory(category: GalleryCategory): Promise<GalleryItem[]> {
  return (await getGallery()).filter((item) => item.category === category);
}

export async function saveGalleryPatch(id: string, patch: GalleryPatch): Promise<void> {
  const doc = await readDoc();
  await writeDoc({ ...doc, patches: { ...doc.patches, [id]: patch } });
}

export async function setHidden(id: string, hidden: boolean): Promise<void> {
  const doc = await readDoc();
  const next = new Set(doc.hidden);
  if (hidden) next.add(id);
  else next.delete(id);
  await writeDoc({ ...doc, hidden: [...next] });
}

export async function setOrder(ids: string[]): Promise<void> {
  const doc = await readDoc();
  await writeDoc({ ...doc, order: ids });
}

/**
 * Stores an uploaded photograph.
 *
 * The file's real type is read from its own bytes rather than taken from the
 * browser's word for it, and the stored name is generated here rather than
 * taken from the upload — a filename from a file picker is attacker-controlled
 * text, and none of it is needed. Returns a message on refusal so the chef is
 * told why rather than watching an upload fail silently.
 */
export async function addUpload(
  bytes: Uint8Array,
  { alt, category }: { alt: string; category: GalleryCategory },
): Promise<{ ok: true; id: string } | { ok: false; reason: string }> {
  if (bytes.byteLength === 0) return { ok: false, reason: "That file was empty." };
  if (bytes.byteLength > MAX_UPLOAD_BYTES) {
    return { ok: false, reason: `Photographs must be under ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)}MB.` };
  }

  const read = readImage(bytes);
  if (!read) return { ok: false, reason: "That does not look like a JPEG, PNG or WebP photograph." };

  const id = `up-${randomBytes(8).toString("hex")}`;
  const key = `${id}.${EXTENSIONS[read.type]}`;

  await store.putBlob({ key, bytes, contentType: read.type });

  const doc = await readDoc();
  const upload: Upload = {
    id,
    key,
    width: read.dimensions.width,
    height: read.dimensions.height,
    alt,
    category,
    uploadedAt: Date.now(),
  };

  // Newest first, and pinned to the front of the running order so a picture
  // just uploaded is the first thing on the screen rather than something to
  // go hunting for.
  await writeDoc({
    ...doc,
    added: [upload, ...doc.added],
    order: doc.order.length > 0 ? [id, ...doc.order] : [],
  });

  return { ok: true, id };
}

/** Uploads are removed for real — they exist nowhere else, so there is nothing to fall back to. */
export async function deleteUpload(id: string): Promise<boolean> {
  const doc = await readDoc();
  const upload = doc.added.find((entry) => entry.id === id);
  if (!upload) return false;

  await store.deleteBlob(upload.key);

  const patches = { ...doc.patches };
  delete patches[id];

  await writeDoc({
    ...doc,
    added: doc.added.filter((entry) => entry.id !== id),
    patches,
    hidden: doc.hidden.filter((entry) => entry !== id),
    order: doc.order.filter((entry) => entry !== id),
  });
  return true;
}

export async function galleryIsEdited(): Promise<boolean> {
  const doc = await readDoc();
  return Object.keys(doc.patches).length > 0 || doc.added.length > 0 || doc.hidden.length > 0 || doc.order.length > 0;
}

export { galleryCategories };
export type { GalleryCategory };
