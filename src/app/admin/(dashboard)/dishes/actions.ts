"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { refreshSessionIfStale } from "@/lib/admin/auth";
import { refuseIfSignedOut } from "@/lib/admin/guard";
import {
  createDish,
  deleteDish,
  dishExists,
  dishFormSchema,
  getDishesForAdmin,
  isKnownImageKey,
  originalDish,
  resetDish,
  saveDish,
  setDishHidden,
  setDishOrder,
  setDishSignature,
} from "@/lib/content/dishes";
import { revalidateSite } from "@/lib/content/revalidate";
import type { EditorState } from "@/lib/content/state";

/**
 * Everything the chef can do to a dish: add one, edit it, reset or delete
 * it, move it up or down the list, and switch it in or out of the website
 * and the signature showcase.
 *
 * The same contract as every dashboard action: prove who is calling (with a
 * message rather than a redirect, so nothing typed is lost), validate against
 * the content layer's own schema, write, then tell the public site its pages
 * are stale. Ids are checked against the dishes that exist, not only their
 * shape, so a hand-made request cannot create records under invented ids.
 */

const idSchema = z.string().trim().regex(/^[a-z0-9-]{1,80}$/, "That is not a dish.");

function failure(message: string): EditorState {
  return { status: "error", message, at: Date.now() };
}

async function done(message?: string): Promise<EditorState> {
  revalidateSite();
  await refreshSessionIfStale();
  return { status: "saved", at: Date.now(), ...(message ? { message } : {}) };
}

async function knownId(value: FormDataEntryValue | null): Promise<string | null> {
  const id = idSchema.safeParse(value);
  if (!id.success) return null;
  return (await dishExists(id.data)) ? id.data : null;
}

function readForm(formData: FormData) {
  const raw = formData.get("payload");
  if (typeof raw !== "string") return { error: "The form did not send anything to save." } as const;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { error: "The form sent something this server could not read." } as const;
  }
  const form = dishFormSchema.safeParse(parsed);
  if (!form.success) return { error: form.error.issues[0]?.message ?? "Some of those values could not be saved." } as const;
  return { form: form.data } as const;
}

export async function saveDishAction(_previous: EditorState, formData: FormData): Promise<EditorState> {
  const refused = await refuseIfSignedOut();
  if (refused) return refused;

  const id = await knownId(formData.get("id"));
  if (!id) return failure("That dish no longer exists.");

  const read = readForm(formData);
  if ("error" in read) return failure(read.error!);

  // A key that names nothing would be stored and then silently ignored, and
  // the dish would keep its old picture with no hint why.
  if (!(await isKnownImageKey(read.form.imageKey))) return failure("That photograph is no longer available. Pick another one.");

  try {
    if (!(await saveDish(id, read.form))) return failure("That dish no longer exists.");
  } catch (error) {
    console.error("[admin] could not save the dish:", error);
    return failure("The change could not be written to storage. Nothing was saved.");
  }

  return done();
}

export async function createDishAction(_previous: EditorState, formData: FormData): Promise<EditorState> {
  const refused = await refuseIfSignedOut();
  if (refused) return refused;

  const read = readForm(formData);
  if ("error" in read) return failure(read.error!);
  if (!(await isKnownImageKey(read.form.imageKey))) return failure("That photograph is no longer available. Pick another one.");

  // Plenty for a restaurant's list, and a ceiling on what a runaway script could add.
  if ((await getDishesForAdmin()).length >= 60) return failure("The list already holds 60 dishes. Delete one before adding another.");

  let id: string;
  try {
    id = await createDish(read.form);
  } catch (error) {
    console.error("[admin] could not add the dish:", error);
    return failure("The dish could not be written to storage. Nothing was added.");
  }

  revalidateSite();
  await refreshSessionIfStale();
  // Back to the list, which names and highlights the new dish.
  redirect(`/admin/dishes?added=${id}`);
}

export async function resetDishAction(_previous: EditorState, formData: FormData): Promise<EditorState> {
  const refused = await refuseIfSignedOut();
  if (refused) return refused;

  const id = await knownId(formData.get("id"));
  if (!id || !originalDish(id)) return failure("Only dishes that came with the website can be reset.");

  try {
    await resetDish(id);
  } catch (error) {
    console.error("[admin] could not reset the dish:", error);
    return failure("The reset could not be written to storage.");
  }

  revalidateSite();
  await refreshSessionIfStale();
  return { status: "reset", at: Date.now() };
}

export async function deleteDishAction(_previous: EditorState, formData: FormData): Promise<EditorState> {
  const refused = await refuseIfSignedOut();
  if (refused) return refused;

  const id = await knownId(formData.get("id"));
  if (!id) return failure("That dish no longer exists.");
  if (originalDish(id)) return failure("Dishes that came with the website can be hidden, but not deleted.");

  const name = (await getDishesForAdmin()).find((dish) => dish.id === id)?.name ?? "The dish";
  try {
    if (!(await deleteDish(id))) return failure("That dish no longer exists.");
  } catch (error) {
    console.error("[admin] could not delete the dish:", error);
    return failure("The dish could not be deleted.");
  }

  revalidateSite();
  await refreshSessionIfStale();
  redirect(`/admin/dishes?deleted=${encodeURIComponent(name.slice(0, 90))}`);
}

export async function reorderDishesAction(_previous: EditorState, formData: FormData): Promise<EditorState> {
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
  const order = z.array(idSchema).max(100).safeParse(parsed);
  if (!order.success) return failure("That order could not be read.");

  const existing = new Set((await getDishesForAdmin()).map((dish) => dish.id));
  const ids = [...new Set(order.data)].filter((id) => existing.has(id));

  try {
    await setDishOrder(ids);
  } catch (error) {
    console.error("[admin] could not save the dish order:", error);
    return failure("The new order could not be written to storage.");
  }
  return done("New order saved.");
}

export async function setDishVisibilityAction(_previous: EditorState, formData: FormData): Promise<EditorState> {
  const refused = await refuseIfSignedOut();
  if (refused) return refused;

  const id = await knownId(formData.get("id"));
  if (!id) return failure("That dish no longer exists.");
  const visible = formData.get("visible") === "true";

  try {
    await setDishHidden(id, !visible);
  } catch (error) {
    console.error("[admin] could not change the dish's visibility:", error);
    return failure("That could not be written to storage.");
  }
  return done(visible ? "Shown on the website again." : "Hidden from the website.");
}

export async function setDishSignatureAction(_previous: EditorState, formData: FormData): Promise<EditorState> {
  const refused = await refuseIfSignedOut();
  if (refused) return refused;

  const id = await knownId(formData.get("id"));
  if (!id) return failure("That dish no longer exists.");
  const signature = formData.get("signature") === "true";

  try {
    await setDishSignature(id, signature);
  } catch (error) {
    console.error("[admin] could not change the signature setting:", error);
    return failure("That could not be written to storage.");
  }
  return done(signature ? "Added to the signature showcase." : "Taken out of the signature showcase.");
}
