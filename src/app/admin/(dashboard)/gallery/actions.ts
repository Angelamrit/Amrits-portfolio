"use server";

import { z } from "zod";
import { refreshSessionIfStale } from "@/lib/admin/auth";
import { refuseIfSignedOut } from "@/lib/admin/guard";
import { deleteUpload, galleryPatchSchema, saveGalleryPatch, setHidden, setOrder } from "@/lib/content/gallery";
import { revalidateSite } from "@/lib/content/revalidate";
import type { EditorState } from "@/lib/content/state";

/**
 * The gallery's actions: edit a caption, hide a picture, reorder the wall,
 * delete an upload.
 *
 * More of them than the other editors have, because the gallery is the one
 * screen where the chef is doing several different things rather than filling
 * in one form — and each of those things should take effect on its own rather
 * than being staged up behind a single save.
 *
 * Uploading is not here. Server Actions cap a request at 1MB, which is smaller
 * than a photograph, so new pictures go to `/api/admin/upload` instead.
 */

const idSchema = z.string().trim().min(1).max(64).regex(/^[a-zA-Z0-9_-]+$/, "That is not a picture id.");

function failure(message: string): EditorState {
  return { status: "error", message, at: Date.now() };
}

async function done(message: string): Promise<EditorState> {
  revalidateSite();
  await refreshSessionIfStale();
  return { status: "saved", at: Date.now(), message };
}

export async function saveGalleryItem(_previous: EditorState, formData: FormData): Promise<EditorState> {
  const refused = await refuseIfSignedOut();
  if (refused) return refused;

  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return failure("That picture no longer exists.");

  const raw = formData.get("payload");
  if (typeof raw !== "string") return failure("The form did not send anything to save.");

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return failure("The form sent something this server could not read.");
  }

  const patch = galleryPatchSchema.safeParse(parsed);
  if (!patch.success) return failure(patch.error.issues[0]?.message ?? "Some of those values could not be saved.");

  try {
    if (!(await saveGalleryPatch(id.data, patch.data))) return failure("That picture no longer exists.");
  } catch (error) {
    console.error("[admin] could not save the gallery item:", error);
    return failure("The change could not be written to storage. Nothing was saved.");
  }

  return done("Photograph details saved.");
}

export async function toggleGalleryItem(_previous: EditorState, formData: FormData): Promise<EditorState> {
  const refused = await refuseIfSignedOut();
  if (refused) return refused;

  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return failure("That picture no longer exists.");

  const hidden = formData.get("hidden") === "true";
  try {
    if (!(await setHidden(id.data, hidden))) return failure("That picture no longer exists.");
  } catch (error) {
    console.error("[admin] could not change the picture's visibility:", error);
    return failure("That could not be written to storage.");
  }

  return done(hidden ? "Hidden from the website." : "Shown on the website again.");
}

export async function reorderGallery(_previous: EditorState, formData: FormData): Promise<EditorState> {
  const refused = await refuseIfSignedOut();
  if (refused) return refused;

  const raw = formData.get("order");
  if (typeof raw !== "string") return failure("Nothing to reorder.");

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return failure("That order could not be read.");
  }

  const order = z.array(idSchema).max(500).safeParse(parsed);
  if (!order.success) return failure("That order could not be read.");

  try {
    await setOrder(order.data);
  } catch (error) {
    console.error("[admin] could not save the gallery order:", error);
    return failure("The new order could not be written to storage.");
  }

  return done("New order saved.");
}

export async function removeUpload(_previous: EditorState, formData: FormData): Promise<EditorState> {
  const refused = await refuseIfSignedOut();
  if (refused) return refused;

  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return failure("That picture no longer exists.");

  try {
    const removed = await deleteUpload(id.data);
    if (!removed) return failure("Only photographs uploaded here can be deleted.");
  } catch (error) {
    console.error("[admin] could not delete the upload:", error);
    return failure("That could not be deleted.");
  }

  return done("Photograph deleted.");
}
