import "server-only";

/**
 * Reads a picture's dimensions out of its own header bytes.
 *
 * Every image on this site is rendered with an explicit width and height, so
 * the browser can reserve the right space before the file arrives and the page
 * does not jump as photographs load. An uploaded picture has to supply those
 * numbers from somewhere.
 *
 * It could come from the browser — `naturalWidth` after the file is chosen —
 * and that was the first instinct. It is wrong twice: the numbers would be
 * untrusted input shaping the layout of the public site, and a deliberately
 * mismatched pair would let somebody reserve a page-height gap for a 1-pixel
 * image. Reading the file itself costs a few dozen bytes and cannot be lied to.
 *
 * Only the three formats the uploader accepts are parsed. Anything else — or
 * anything whose header does not make sense — returns `null`, and the upload
 * is refused rather than guessed at.
 */

export type Dimensions = { width: number; height: number };

/** The largest a sane photograph is. Beyond this the file is almost certainly crafted. */
const MAX_DIMENSION = 20_000;

function sane(width: number, height: number): Dimensions | null {
  if (!Number.isInteger(width) || !Number.isInteger(height)) return null;
  if (width < 1 || height < 1 || width > MAX_DIMENSION || height > MAX_DIMENSION) return null;
  return { width, height };
}

function pngSize(view: DataView): Dimensions | null {
  // 8-byte signature, then an IHDR chunk whose width and height are the first
  // two 32-bit fields of its data.
  if (view.byteLength < 24) return null;
  return sane(view.getUint32(16, false), view.getUint32(20, false));
}

function jpegSize(view: DataView): Dimensions | null {
  // Walk the marker segments until one of the Start-Of-Frame markers, which
  // carries the dimensions. Every other segment declares its own length, so
  // this skips over them without needing to understand them.
  let offset = 2;
  while (offset + 9 < view.byteLength) {
    if (view.getUint8(offset) !== 0xff) return null;

    const marker = view.getUint8(offset + 1);

    // Standalone markers: no length field to skip.
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }

    // SOF0–SOF15, excluding the four that are not frame headers.
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return sane(view.getUint16(offset + 7, false), view.getUint16(offset + 5, false));
    }

    const length = view.getUint16(offset + 2, false);
    if (length < 2) return null;
    offset += 2 + length;
  }
  return null;
}

function webpSize(view: DataView, bytes: Uint8Array): Dimensions | null {
  // RIFF container; the chunk after "WEBP" says which of the three encodings
  // this is, and each stores its dimensions differently.
  if (view.byteLength < 30) return null;

  const format = String.fromCharCode(bytes[12], bytes[13], bytes[14], bytes[15]);

  if (format === "VP8 ") {
    // Lossy: 14 bits each, after a 3-byte start code.
    return sane(view.getUint16(26, true) & 0x3fff, view.getUint16(28, true) & 0x3fff);
  }

  if (format === "VP8L") {
    // Lossless: 14 bits each, packed into the four bytes after the signature.
    const bits = view.getUint32(21, true);
    return sane((bits & 0x3fff) + 1, ((bits >> 14) & 0x3fff) + 1);
  }

  if (format === "VP8X") {
    // Extended: 24-bit little-endian, stored as one less than the real value.
    const width = bytes[24] | (bytes[25] << 8) | (bytes[26] << 16);
    const height = bytes[27] | (bytes[28] << 8) | (bytes[29] << 16);
    return sane(width + 1, height + 1);
  }

  return null;
}

/**
 * Also decides what the file actually is.
 *
 * The declared content type on an upload is whatever the browser was told by
 * the operating system, and a renamed file carries the wrong one. The magic
 * bytes are the only honest answer, and they are what gets stored — so a file
 * claiming to be a picture but holding something else is refused here rather
 * than being served back to visitors under a type it does not have.
 */
export function readImage(bytes: Uint8Array): { type: string; dimensions: Dimensions } | null {
  if (bytes.byteLength < 24) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  const isPng =
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  if (isPng) {
    const dimensions = pngSize(view);
    return dimensions ? { type: "image/png", dimensions } : null;
  }

  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    const dimensions = jpegSize(view);
    return dimensions ? { type: "image/jpeg", dimensions } : null;
  }

  const isRiff = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46;
  const isWebp = bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
  if (isRiff && isWebp) {
    const dimensions = webpSize(view, bytes);
    return dimensions ? { type: "image/webp", dimensions } : null;
  }

  return null;
}

export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
