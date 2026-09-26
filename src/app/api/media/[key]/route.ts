import { store } from "@/lib/store";

/**
 * Serves a photograph the chef uploaded.
 *
 * Uploads cannot live in `/public`: that directory is part of the build, so
 * anything written there after a deploy is lost on the next one, and on a
 * read-only filesystem it cannot be written at all. They live in the same
 * store as everything else, and this is the door onto it.
 *
 * Deliberately public, with no session check. These are photographs that
 * appear in the site's gallery — they are published the moment they are
 * uploaded, and putting a login in front of them would only break the pages
 * showing them. The store's own key validation is what keeps a crafted path
 * from reaching anything that is not an upload.
 */

/** A year. The key is generated per upload and never reused, so the bytes behind it never change. */
const IMMUTABLE = "public, max-age=31536000, immutable";

export async function GET(_request: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;

  let blob;
  try {
    blob = await store.readBlob(key);
  } catch {
    // An unsafe key throws rather than returning null; from the outside the
    // two are the same thing and should look the same.
    return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
  }

  if (!blob) return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });

  return new Response(blob.bytes as BodyInit, {
    headers: {
      "Content-Type": blob.contentType,
      "Content-Length": String(blob.bytes.byteLength),
      "Cache-Control": IMMUTABLE,
      // These are user-supplied bytes served from this origin. Sniffing is off
      // and the type is the one read from the file's own header, not the one
      // the browser claimed at upload time.
      "X-Content-Type-Options": "nosniff",
    },
  });
}
