import NextImage, { type ImageProps } from "next/image";
import { capPixelDensity } from "@/lib/images/sizes";

/**
 * `next/image` for the public site, with the download capped near 2x pixel
 * density on dense phone screens (see src/lib/images/sizes.ts). A drop-in
 * replacement: import it as `Image` and use it exactly like `next/image`.
 *
 * The dashboard keeps plain `next/image`: its thumbnails are small and it is
 * used on a desk, not on a phone across the world from the server.
 */
export default function Image({ sizes, ...props }: ImageProps) {
  // A `fill` picture without `sizes` is treated by Next as 100vw; cap that too.
  const slot = sizes ?? (props.fill ? "100vw" : undefined);
  return <NextImage {...props} sizes={slot ? capPixelDensity(slot) : undefined} />;
}
