"use server";

import { z } from "zod";
import { requireAdmin, refreshSessionIfStale } from "@/lib/admin/auth";
import {
  addUpload,
  deleteUpload,
  galleryCategories,
  galleryPatchSchema,
  saveGalleryPatch,
  setHidden,
  setOrder,
  MAX_UPLOAD_BYTES,
} from "@/lib/content/gallery";
import { revalidateSite } from "@/lib/content/revalidate";
import type { GalleryCategory } from "@/types/content";
import type { EditorState } from "@/lib/content/state";

/**
 * The gallery's actions: edit a caption, hide a picture, reorder the wall,
 * upload new photography, delete an upload.
 *
 * More of them than the other editors have, because the gallery is the one
 * screen where the chef is doing several different things rather than filling
 * in one form — and each of those things should take effect on its own rather
 * than being staged up behind a single save.
 */

const categorySchema = z.enum(
  galleryCategories
    .map((entry) => entry.value)
    .filter((value) => value !== "all") as [GalleryCategory, ...GalleryCategory[]],
);

const idSchema = z.string().trim().min(1).max(64).regex(/^[a-zA-Z0-9_-]+$/, "That is not a picture id.");

function failure(message: string): EditorState {
  return { status: "error", message, at: Date.now() };
}

export async function saveGalleryItem(_previous: EditorState, formData: FormData): Promise<EditorState> {
  await requireAdmin();

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
    await saveGalleryPatch(id.data, patch.data);
  } catch (error) {
    console.error("[admin] could not save the gallery item:", error);
    return failure("The change could not be written to storage. Nothing was saved.");
  }

  revalidateSite();
  await refreshSessionIfStale();
  return { status: "saved", at: Date.now() };
}

export async function toggleGalleryItem(_previous: EditorState, formData: FormData): Promise<EditorState> {
  await requireAdmin();

  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return failure("That picture no longer exists.");

  try {
    await setHidden(id.data, formData.get("hidden") === "true");
  } catch (error) {
    console.error("[admin] could not change the picture's visibility:", error);
    return failure("That could not be written to storage.");
  }

  revalidateSite();
  await refreshSessionIfStale();
  return { status: "saved", at: Date.now() };
}

export async function reorderGallery(_previous: EditorState, formData: FormData): Promise<EditorState> {
  await requireAdmin();

  const raw = formData.get("order");
  if (typeof raw !== "string") return failure("Nothing to reorder.");

  const order = z.array(idSchema).max(500).safeParse(JSON.parse(raw));
  if (!order.success) return failure("That order could not be read.");

  try {
    await setOrder(order.data);
  } catch (error) {
    console.error("[admin] could not save the gallery order:", error);
    return failure("The new order could not be written to storage.");
  }

  revalidateSite();
  await refreshSessionIfStale();
  return { status: "saved", at: Date.now() };
}

export async function uploadPhotographs(_previous: EditorState, formData: FormData): Promise<EditorState> {
  await requireAdmin();

  const category = categorySchema.safeParse(formData.get("category"));
  if (!category.success) return failure("Choose which part of the gallery these belong to.");

  const alt = z.string().trim().min(3, "Describe the photograph so screen readers can announce it.").max(240)
    .safeParse(formData.get("alt"));
  if (!alt.success) return failure(alt.error.issues[0].message);

  const files = formData.getAll("files").filter((value): value is File => value instanceof File && value.size > 0);
  if (files.length === 0) return failure("Choose at least one photograph.");
  if (files.length > 12) return failure("Twelve photographs at a time, at most.");

  const total = files.reduce((sum, file) => sum + file.size, 0);
  if (total > MAX_UPLOAD_BYTES * 12) return failure("That is more than this server will take in one go.");

  let added = 0;
  const problems: string[] = [];

  for (const file of files) {
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const result = await addUpload(bytes, { alt: alt.data, category: category.data });
      if (result.ok) added += 1;
      else problems.push(result.reason);
    } catch (error) {
      console.error("[admin] an upload failed:", error);
      problems.push("One file could not be stored.");
    }
  }

  revalidateSite();
  await refreshSessionIfStale();

  if (added === 0) return failure(problems[0] ?? "Nothing was uploaded.");

  // Partial success is reported as success with a note, because the pictures
  // that did land are on the site and saying "failed" would be wrong.
  return {
    status: "saved",
    at: Date.now(),
    message:
      problems.length > 0
        ? `${added} added. ${problems.length} skipped: ${problems[0]}`
        : `${added} ${added === 1 ? "photograph" : "photographs"} added.`,
  };
}

export async function removeUpload(_previous: EditorState, formData: FormData): Promise<EditorState> {
  await requireAdmin();

  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return failure("That picture no longer exists.");

  try {
    const removed = await deleteUpload(id.data);
    if (!removed) return failure("Only photographs uploaded here can be deleted.");
  } catch (error) {
    console.error("[admin] could not delete the upload:", error);
    return failure("That could not be deleted.");
  }

  revalidateSite();
  await refreshSessionIfStale();
  return { status: "saved", at: Date.now(), message: "Photograph deleted." };
}
