import { placeholders } from "@/data/placeholders.generated";
import type { ImageAsset } from "@/types/content";

/** `/images/…` path → a 16-pixel-wide WebP of that photograph, as a data URL. */
const byPath = placeholders;

/**
 * Attaches each photograph's blurred placeholder to the image registry (see
 * scripts/image-placeholders.mjs). A picture with no placeholder on file — one
 * added since the script last ran — is left exactly as it is, so a missing
 * entry only means a plainer loading state, never a broken one.
 */
export function withPlaceholders<T extends Record<string, ImageAsset>>(registry: T): T {
  const out: Record<string, ImageAsset> = {};
  for (const [key, image] of Object.entries(registry)) {
    const blurDataURL = byPath[image.src];
    out[key] = blurDataURL && !image.blurDataURL ? { ...image, blurDataURL } : image;
  }
  return out as T;
}
