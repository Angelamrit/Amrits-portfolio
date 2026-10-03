import "server-only";
import { images } from "@/data/images";
import type { ImageAsset } from "@/types/content";
import { getUploadedImages, uploadSrc } from "./gallery";

/**
 * Choosing a photograph by key, shared by everything the chef can put a
 * picture on (a dish, a menu's cover).
 *
 * A key is either a name from `src/data/images.ts` or the id of a photograph
 * uploaded through the dashboard (`up-…`). Storing keys rather than paths is
 * what keeps a choice safe: nothing can point at a file that does not exist,
 * and the alt text and dimensions come along with the choice.
 */

export type PictureChoice = { key: string; src: string; alt: string; label: string };

type Uploads = Awaited<ReturnType<typeof getUploadedImages>>;

const imagesByKey = images as Record<string, ImageAsset>;

export const isUploadKey = (key: string) => key.startsWith("up-");

/** The pictures that ship with the site, with a readable label: "choleBhatura" → "Chole bhatura". */
const shippedChoices: PictureChoice[] = Object.entries(images).map(([key, image]) => ({
  key,
  src: image.src,
  alt: image.alt,
  label: key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim(),
}));

/** Every picture the chef can choose from: his own uploads first, then the site's photography. */
export async function getImageChoices(): Promise<PictureChoice[]> {
  const uploads = await getUploadedImages();
  return [
    ...[...uploads].map(([id, { image, label }]) => ({ key: id, src: image.src, alt: image.alt, label: `Yours · ${label}` })),
    ...shippedChoices,
  ];
}

/** Reads the uploads only when one of the keys actually needs them. */
export async function uploadsFor(keys: (string | undefined)[]): Promise<Uploads | null> {
  return keys.some((key) => key && isUploadKey(key)) ? getUploadedImages() : null;
}

/** The picture a key names, or undefined when it names nothing (an upload deleted since it was chosen). */
export function imageFromKey(key: string | undefined, uploads: Uploads | null): ImageAsset | undefined {
  if (!key) return undefined;
  return isUploadKey(key) ? uploads?.get(key)?.image : imagesByKey[key];
}

/** The key of a picture, or "" when it is not one the chef could have chosen. */
export function keyOfImage(image: ImageAsset): string {
  if (image.src.startsWith(uploadSrc(""))) return image.src.slice(uploadSrc("").length).split(".")[0];
  return Object.keys(images).find((key) => imagesByKey[key].src === image.src) ?? "";
}

/** Whether a key names a picture that exists right now — checked before anything is saved pointing at it. */
export async function isKnownImageKey(key: string): Promise<boolean> {
  if (!isUploadKey(key)) return key in imagesByKey;
  return (await getUploadedImages()).has(key);
}
