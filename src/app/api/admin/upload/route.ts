import { headers } from "next/headers";
import { z } from "zod";
import { currentSession, refreshSessionIfStale } from "@/lib/admin/auth";
import { addUpload, galleryCategories } from "@/lib/content/gallery";
import { MAX_UPLOAD_BYTES } from "@/lib/content/upload-limits";
import { revalidateSite } from "@/lib/content/revalidate";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { sameOrigin } from "@/lib/same-origin";
import type { GalleryCategory } from "@/types/content";

/**
 * Where the dashboard sends a photograph, one file per request.
 *
 * A Route Handler rather than a Server Action, and that is the whole point of
 * it. Server Actions refuse any request body over 1MB, and a photograph from a
 * phone is two to eight — so the upload the dashboard had always failed on the
 * pictures the chef actually takes. Raising that limit is a site-wide setting:
 * it would also let anyone post twelve-megabyte bodies at the public contact
 * form before its rate limit ever ran. Here the size is checked against the
 * declared length before a byte of the body is read, and only after the
 * session has been verified, so only a signed-in admin can make this server
 * accept a large body at all.
 *
 * It sits outside `/admin`, so `proxy.ts` (which would buffer and cap the body
 * at 10MB) never sees it, and the session check below is the only gate —
 * which is exactly where it belongs.
 */

/** Room for the multipart boundaries and the two small text fields around the file. */
const MAX_BODY_BYTES = MAX_UPLOAD_BYTES + 64 * 1024;

/** Generous for a chef adding a shoot; a ceiling on how fast anyone can fill the disk. */
const PER_IP = { limit: 60, windowMs: 10 * 60_000 };

const categorySchema = z.enum(
  galleryCategories
    .map((entry) => entry.value)
    .filter((value) => value !== "all") as [GalleryCategory, ...GalleryCategory[]],
);

const altSchema = z.string().trim().min(3, "Describe the photograph so screen readers can announce it.").max(240);

function reply(status: number, body: { ok: true; id: string; src: string } | { ok: false; message: string }) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const requestHeaders = await headers();

  if (!sameOrigin(requestHeaders)) return reply(403, { ok: false, message: "That request was refused." });

  if (!(await currentSession())) {
    return reply(401, { ok: false, message: "You have been signed out. Sign in again, then retry the upload." });
  }

  // No length means a chunked body whose size is only known once it has all
  // been read — which is the thing this check exists to avoid.
  const declared = Number(requestHeaders.get("content-length"));
  if (!Number.isFinite(declared) || declared <= 0) {
    return reply(411, { ok: false, message: "The browser did not say how large the file is." });
  }
  if (declared > MAX_BODY_BYTES) {
    return reply(413, { ok: false, message: `Photographs must be under ${MAX_UPLOAD_BYTES / 1024 / 1024}MB.` });
  }

  const verdict = rateLimit([{ key: `admin-upload:${clientIp(requestHeaders)}`, rule: PER_IP }]);
  if (!verdict.allowed) {
    return reply(429, {
      ok: false,
      message: `That is a lot of photographs at once. Try again in ${Math.ceil(verdict.retryAfterSeconds / 60)} minutes.`,
    });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return reply(400, { ok: false, message: "The upload arrived incomplete. Try it again." });
  }

  // "gallery" (the default) puts the picture on the public gallery wall; "dish"
  // keeps it in the library for the dish editor only, and needs no category.
  const forDish = form.get("place") === "dish";

  const category = forDish ? { success: true as const, data: "signature-dishes" as const } : categorySchema.safeParse(form.get("category"));
  if (!category.success) return reply(400, { ok: false, message: "Choose which part of the gallery this belongs to." });

  const alt = altSchema.safeParse(form.get("alt"));
  if (!alt.success) return reply(400, { ok: false, message: alt.error.issues[0].message });

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return reply(400, { ok: false, message: "That file was empty." });

  try {
    const result = await addUpload(new Uint8Array(await file.arrayBuffer()), {
      alt: alt.data,
      category: category.data,
      inGallery: !forDish,
    });
    if (!result.ok) return reply(422, { ok: false, message: result.reason });

    // A dish photograph is not on the website until the dish is saved with it.
    if (!forDish) revalidateSite();
    await refreshSessionIfStale();
    return reply(201, { ok: true, id: result.id, src: result.src });
  } catch (error) {
    console.error("[admin] an upload failed:", error);
    return reply(500, { ok: false, message: "The photograph could not be stored. Nothing was added." });
  }
}
