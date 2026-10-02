import "server-only";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { gallery as baseGallery, galleryCategories } from "@/data/gallery";
import { store } from "@/lib/store";
import type { GalleryCategory, GalleryItem, ImageAsset } from "@/types/content";
import { EXTENSIONS, readImage } from "./image-size";
import { MAX_UPLOAD_BYTES } from "./upload-limits";

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
  /**
   * A 16-pixel-wide WebP of the photograph as a data URL, made at upload time
   * and drawn blurred in its frame until the real file arrives. Absent on
   * older uploads and when the server could not make one; the frame then
   * simply shows its background while it loads.
   */
  blur?: string;
  /**
   * `false` for a photograph uploaded for one dish from the dish editor. It is
   * kept in the same library — so it can be picked again for any dish — but
   * never appears on the public gallery wall, where a close-up meant for a
   * menu card would be out of place. Absent (older uploads) means `true`.
   */
  inGallery?: boolean;
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

function normalise(doc: GalleryDoc | null): GalleryDoc {
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

async function readDoc(): Promise<GalleryDoc> {
  return normalise(await store.readDoc<GalleryDoc>(DOC));
}

/**
 * Every write is a read-modify-write inside the store's own queue.
 *
 * The gallery takes several small actions in quick succession — hide one
 * picture, move another, upload a third — and each rewrites the same
 * document. Read-then-write as two steps let a second action read the
 * document before the first had written it, and one change silently
 * disappeared.
 */
async function changeDoc(change: (doc: GalleryDoc) => GalleryDoc): Promise<void> {
  await store.updateDoc<GalleryDoc>(DOC, (current) => ({
    ...change(normalise(current)),
    version: 1,
    updatedAt: Date.now(),
  }));
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
    ...(upload.blur ? { blurDataURL: upload.blur } : {}),
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

  const uploaded = doc.added.filter((upload) => upload.inGallery !== false).map((upload) => ({
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

/**
 * Uploaded photographs as images another part of the site can use — the dish
 * editor offers them beside the shipped photography. Keyed by upload id.
 */
export async function getUploadedImages(): Promise<Map<string, { image: ImageAsset; label: string }>> {
  const doc = await readDoc();
  return new Map(
    doc.added.map((upload) => {
      const patch = doc.patches[upload.id];
      const alt = patch?.alt || upload.alt;
      return [upload.id, { image: { ...uploadToItem(upload).image, alt }, label: patch?.caption || upload.caption || alt }];
    }),
  );
}

/** Whether an id names a picture that exists, shipped or uploaded — so a write can never name a ghost. */
function knownIds(doc: GalleryDoc): Set<string> {
  return new Set([...baseGallery.map((item) => item.id), ...doc.added.map((upload) => upload.id)]);
}

export async function saveGalleryPatch(id: string, patch: GalleryPatch): Promise<boolean> {
  let found = false;
  await changeDoc((doc) => {
    found = knownIds(doc).has(id);
    return found ? { ...doc, patches: { ...doc.patches, [id]: patch } } : doc;
  });
  return found;
}

export async function setHidden(id: string, hidden: boolean): Promise<boolean> {
  let found = false;
  await changeDoc((doc) => {
    found = knownIds(doc).has(id);
    if (!found) return doc;
    const next = new Set(doc.hidden);
    if (hidden) next.add(id);
    else next.delete(id);
    return { ...doc, hidden: [...next] };
  });
  return found;
}

/**
 * Stores a new running order. Ids that no longer exist are dropped, and any
 * picture the order leaves out keeps its place at the end (see `sortByOrder`),
 * so a stale order sent from an old tab can reorder but never lose a picture.
 */
export async function setOrder(ids: string[]): Promise<void> {
  await changeDoc((doc) => {
    const known = knownIds(doc);
    return { ...doc, order: [...new Set(ids)].filter((id) => known.has(id)) };
  });
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
  { alt, category, inGallery = true }: { alt: string; category: GalleryCategory; inGallery?: boolean },
): Promise<{ ok: true; id: string; src: string } | { ok: false; reason: string }> {
  if (bytes.byteLength === 0) return { ok: false, reason: "That file was empty." };
  if (bytes.byteLength > MAX_UPLOAD_BYTES) {
    return { ok: false, reason: `Photographs must be under ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)}MB.` };
  }

  const read = readImage(bytes);
  if (!read) return { ok: false, reason: "That does not look like a JPEG, PNG or WebP photograph." };

  const id = `up-${randomBytes(8).toString("hex")}`;
  const key = `${id}.${EXTENSIONS[read.type]}`;

  await store.putBlob({ key, bytes, contentType: read.type });

  const upload: Upload = {
    id,
    key,
    width: read.dimensions.width,
    height: read.dimensions.height,
    alt,
    category,
    uploadedAt: Date.now(),
    ...(await blurPlaceholder(bytes)),
    ...(inGallery ? {} : { inGallery: false }),
  };

  // Newest first, and pinned to the front of the running order so a picture
  // just uploaded is the first thing on the screen rather than something to
  // go hunting for. A dish-only photograph has no place in that order.
  await changeDoc((doc) => ({
    ...doc,
    added: [upload, ...doc.added],
    order: inGallery && doc.order.length > 0 ? [id, ...doc.order] : doc.order,
  }));

  return { ok: true, id, src: uploadSrc(key) };
}

/**
 * The blurred stand-in for an upload (see `Upload.blur`), made the same way as
 * the shipped photography's (scripts/image-placeholders.mjs). `sharp` is the
 * image library Next.js itself uses, so it is always installed; if it fails on
 * a file anyway, the upload goes ahead without a placeholder rather than
 * failing over something cosmetic.
 */
async function blurPlaceholder(bytes: Uint8Array): Promise<{ blur?: string }> {
  try {
    const sharp = (await import("sharp")).default;
    const tiny = await sharp(bytes).rotate().resize({ width: 16, withoutEnlargement: true }).webp({ quality: 50, alphaQuality: 50 }).toBuffer();
    return { blur: `data:image/webp;base64,${tiny.toString("base64")}` };
  } catch (error) {
    console.warn("[gallery] could not make a placeholder for an upload:", error instanceof Error ? error.message : error);
    return {};
  }
}

/** Uploads are removed for real — they exist nowhere else, so there is nothing to fall back to. */
export async function deleteUpload(id: string): Promise<boolean> {
  let removed: Upload | undefined;

  // The record goes first and the bytes second: a crash in between leaves an
  // orphaned file on disk, which is harmless, rather than a gallery entry
  // pointing at a file that no longer exists, which is a broken picture.
  await changeDoc((doc) => {
    removed = doc.added.find((entry) => entry.id === id);
    if (!removed) return doc;

    const patches = { ...doc.patches };
    delete patches[id];
    return {
      ...doc,
      added: doc.added.filter((entry) => entry.id !== id),
      patches,
      hidden: doc.hidden.filter((entry) => entry !== id),
      order: doc.order.filter((entry) => entry !== id),
    };
  });

  if (!removed) return false;
  await store.deleteBlob(removed.key);
  return true;
}

export async function galleryIsEdited(): Promise<boolean> {
  const doc = await readDoc();
  return Object.keys(doc.patches).length > 0 || doc.added.length > 0 || doc.hidden.length > 0 || doc.order.length > 0;
}

export { galleryCategories };
export type { GalleryCategory };
