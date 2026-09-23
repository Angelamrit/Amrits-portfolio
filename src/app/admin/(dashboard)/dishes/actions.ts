"use server";

import { z } from "zod";
import { dishes as baseDishes } from "@/data/dishes";
import { requireAdmin, refreshSessionIfStale } from "@/lib/admin/auth";
import { dishPatchSchema, resetDish, saveDishPatch } from "@/lib/content/dishes";
import { revalidateSite } from "@/lib/content/revalidate";
import type { EditorState } from "@/lib/content/state";

/**
 * Saving and resetting a dish. The same contract as the menu actions: prove
 * who is calling, validate against the content layer's own schema, write,
 * then tell the public site its pages are stale.
 */

const idSchema = z.enum(baseDishes.map((dish) => dish.id) as [string, ...string[]]);

function failure(message: string): EditorState {
  return { status: "error", message, at: Date.now() };
}

export async function saveDish(_previous: EditorState, formData: FormData): Promise<EditorState> {
  await requireAdmin();

  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return failure("That dish no longer exists.");

  const raw = formData.get("payload");
  if (typeof raw !== "string") return failure("The form did not send anything to save.");

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return failure("The form sent something this server could not read.");
  }

  const patch = dishPatchSchema.safeParse(parsed);
  if (!patch.success) return failure(patch.error.issues[0]?.message ?? "Some of those values could not be saved.");

  try {
    await saveDishPatch(id.data, patch.data);
  } catch (error) {
    console.error("[admin] could not save the dish:", error);
    return failure("The change could not be written to storage. Nothing was saved.");
  }

  revalidateSite();
  await refreshSessionIfStale();

  return { status: "saved", at: Date.now() };
}

export async function resetDishToOriginal(_previous: EditorState, formData: FormData): Promise<EditorState> {
  await requireAdmin();

  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return failure("That dish no longer exists.");

  try {
    await resetDish(id.data);
  } catch (error) {
    console.error("[admin] could not reset the dish:", error);
    return failure("The reset could not be written to storage.");
  }

  revalidateSite();
  await refreshSessionIfStale();

  return { status: "reset", at: Date.now() };
}
