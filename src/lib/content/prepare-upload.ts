/**
 * Shrinks a photograph in the browser before it is uploaded.
 *
 * Three reasons, in order of how much they matter:
 *
 *   1. Vercel refuses any request or response body over 4.5MB, and a photo
 *      straight off a modern phone is often 5–12MB. Without this, the upload
 *      fails on the live site even though it works on a laptop.
 *   2. Nothing on the site is ever shown wider than 1920px (see `deviceSizes`
 *      in next.config.ts), so pixels beyond {@link MAX_EDGE} are never seen,
 *      yet every resize the image optimizer does starts by decoding all of them.
 *   3. Re-encoding drops the file's metadata, which on a phone photo includes
 *      the GPS position it was taken at.
 *
 * Small photographs are sent untouched. Anything that cannot be decoded here
 * is also sent untouched, and the server's own checks decide.
 */

/** The longest side kept. The largest photograph the site itself ships is 2400px wide. */
export const MAX_EDGE = 2400;

/** Files at or under this size, and within {@link MAX_EDGE}, are left exactly as they are. */
const KEEP_UNDER_BYTES = 2.5 * 1024 * 1024;

const QUALITY = 0.86;

async function encode(canvas: HTMLCanvasElement, type: string): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, QUALITY));
}

export async function prepareUpload(file: File): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || typeof createImageBitmap !== "function") return file;

  let bitmap: ImageBitmap;
  try {
    // "from-image" applies the camera's rotation flag, so a portrait photo
    // stays portrait once the flag is gone with the rest of the metadata.
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file;
  }

  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size <= KEEP_UNDER_BYTES) return file;

    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return file;
    context.imageSmoothingQuality = "high";

    // A PNG may be transparent: keep it as WebP where the browser can write
    // WebP. Safari cannot, and hands back a PNG instead, so that falls through
    // to JPEG on a light background rather than to a larger PNG.
    let blob: Blob | null = null;
    if (file.type !== "image/jpeg") {
      context.drawImage(bitmap, 0, 0, width, height);
      const webp = await encode(canvas, "image/webp");
      if (webp?.type === "image/webp") blob = webp;
    }
    if (!blob) {
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
      context.drawImage(bitmap, 0, 0, width, height);
      blob = await encode(canvas, "image/jpeg");
    }

    // Re-encoding a photo that was only slightly over the size limit can, now
    // and then, come out larger. Keep whichever is smaller.
    if (!blob || (blob.size >= file.size && scale === 1)) return file;

    const extension = blob.type === "image/webp" ? "webp" : "jpg";
    const name = `${file.name.replace(/\.[^.]+$/, "") || "photograph"}.${extension}`;
    return new File([blob], name, { type: blob.type, lastModified: file.lastModified });
  } finally {
    bitmap.close();
  }
}
