import type { ImageAsset } from "@/types/content";

/**
 * The props that give `next/image` a blurred stand-in to draw while the real
 * photograph downloads — when the asset carries one. The registry's pictures
 * get theirs from scripts/image-placeholders.mjs; uploads get theirs at upload
 * time. Spread it onto the `<Image>`; without a placeholder it adds nothing,
 * and the frame's own background shows until the picture arrives.
 *
 * Safe in client components: no data is imported here, only read off the asset.
 */
export function blurProps(image: Pick<ImageAsset, "blurDataURL">): { placeholder: "blur"; blurDataURL: string } | { placeholder?: undefined } {
  return image.blurDataURL ? { placeholder: "blur", blurDataURL: image.blurDataURL } : {};
}
