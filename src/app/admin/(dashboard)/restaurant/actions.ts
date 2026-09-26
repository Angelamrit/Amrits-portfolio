"use server";

import { requireAdmin, refreshSessionIfStale } from "@/lib/admin/auth";
import { resetVenue, saveVenuePatch, venuePatchSchema } from "@/lib/content/venue";
import { revalidateSite } from "@/lib/content/revalidate";
import type { EditorState } from "@/lib/content/state";

/** Saving and resetting the restaurant's details. Same contract as the other editors. */

function failure(message: string): EditorState {
  return { status: "error", message, at: Date.now() };
}

export async function saveVenue(_previous: EditorState, formData: FormData): Promise<EditorState> {
  await requireAdmin();

  const raw = formData.get("payload");
  if (typeof raw !== "string") return failure("The form did not send anything to save.");

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return failure("The form sent something this server could not read.");
  }

  const patch = venuePatchSchema.safeParse(parsed);
  if (!patch.success) return failure(patch.error.issues[0]?.message ?? "Some of those values could not be saved.");

  try {
    await saveVenuePatch(patch.data);
  } catch (error) {
    console.error("[admin] could not save the restaurant details:", error);
    return failure("The change could not be written to storage. Nothing was saved.");
  }

  revalidateSite();
  await refreshSessionIfStale();

  return { status: "saved", at: Date.now() };
}

export async function resetVenueToOriginal(): Promise<EditorState> {
  await requireAdmin();

  try {
    await resetVenue();
  } catch (error) {
    console.error("[admin] could not reset the restaurant details:", error);
    return failure("The reset could not be written to storage.");
  }

  revalidateSite();
  await refreshSessionIfStale();

  return { status: "reset", at: Date.now() };
}
