"use server";

import { z } from "zod";
import { requireAdmin, refreshSessionIfStale } from "@/lib/admin/auth";
import { menuPatchSchema, menuSlugs, resetMenu, saveMenuPatch } from "@/lib/content/menus";
import { revalidateSite } from "@/lib/content/revalidate";
import type { EditorState } from "@/lib/content/state";

/**
 * Saving and resetting a menu.
 *
 * Both start by proving who is calling. A Server Action is a public POST
 * endpoint: it exists at a stable id whether or not a page links to it, and
 * the proxy in front of `/admin` does not protect it. `requireAdmin` here is
 * the check that actually matters.
 *
 * The payload is validated with the same schema the content layer uses, so the
 * form's rules and the server's rules cannot drift apart — and a submission
 * crafted by hand meets exactly the same bar as one the form produced.
 */

/** Only a slug the code actually defines. Anything else is rejected before it reaches storage. */
const slugSchema = z.enum(menuSlugs as [string, ...string[]]);

function failure(message: string): EditorState {
  return { status: "error", message, at: Date.now() };
}

export async function saveMenu(_previous: EditorState, formData: FormData): Promise<EditorState> {
  await requireAdmin();

  const slug = slugSchema.safeParse(formData.get("slug"));
  if (!slug.success) return failure("That menu no longer exists.");

  const raw = formData.get("payload");
  if (typeof raw !== "string") return failure("The form did not send anything to save.");

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return failure("The form sent something this server could not read.");
  }

  const patch = menuPatchSchema.safeParse(parsed);
  if (!patch.success) {
    // The first problem, in the schema's own words — those messages are
    // written for the chef ("Every course needs a heading."), not for a log.
    const first = patch.error.issues[0];
    return failure(first?.message ?? "Some of those values could not be saved.");
  }

  try {
    await saveMenuPatch(slug.data, patch.data);
  } catch (error) {
    console.error("[admin] could not save the menu:", error);
    return failure("The change could not be written to storage. Nothing was saved.");
  }

  revalidateSite();
  await refreshSessionIfStale();

  return { status: "saved", at: Date.now() };
}

export async function resetMenuToOriginal(_previous: EditorState, formData: FormData): Promise<EditorState> {
  await requireAdmin();

  const slug = slugSchema.safeParse(formData.get("slug"));
  if (!slug.success) return failure("That menu no longer exists.");

  try {
    await resetMenu(slug.data);
  } catch (error) {
    console.error("[admin] could not reset the menu:", error);
    return failure("The reset could not be written to storage.");
  }

  revalidateSite();
  await refreshSessionIfStale();

  return { status: "reset", at: Date.now() };
}
