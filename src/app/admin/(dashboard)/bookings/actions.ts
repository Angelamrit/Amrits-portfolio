"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin, refreshSessionIfStale } from "@/lib/admin/auth";
import {
  BOOKING_STATUSES,
  addNote,
  bookingDetailsSchema,
  createManualBooking,
  deleteBooking,
  removeNote,
  setStatus,
  updateDetails,
} from "@/lib/bookings/bookings";
import type { EditorState } from "@/lib/content/state";

/**
 * Everything the chef can do to a booking.
 *
 * Each action proves who is calling before it reads a single field — these are
 * public POST endpoints like every Server Action, and a booking holds a guest's
 * name, email and phone number. Ids are checked for shape before they reach
 * storage, and every text field is length-capped by its schema.
 *
 * None of these touch the public site, so they revalidate only the dashboard's
 * own pages rather than the whole layout the content editors revalidate.
 */

const idSchema = z.string().regex(/^bk-[a-f0-9]{16}$/, "That booking does not exist.");
const statusSchema = z.enum(BOOKING_STATUSES);

function failure(message: string): EditorState {
  return { status: "error", message, at: Date.now() };
}

async function done(id?: string, message?: string): Promise<EditorState> {
  revalidatePath("/admin/bookings");
  if (id) revalidatePath(`/admin/bookings/${id}`);
  // The sidebar badge counts new bookings, and it lives in the layout.
  revalidatePath("/admin", "layout");
  await refreshSessionIfStale();
  return { status: "saved", at: Date.now(), message };
}

export async function changeBookingStatus(_previous: EditorState, formData: FormData): Promise<EditorState> {
  await requireAdmin();

  const id = idSchema.safeParse(formData.get("id"));
  const status = statusSchema.safeParse(formData.get("status"));
  if (!id.success || !status.success) return failure("That change could not be made.");

  try {
    if (!(await setStatus(id.data, status.data))) return failure("That booking no longer exists.");
  } catch (error) {
    console.error("[admin] could not change a booking's status:", error);
    return failure("The change could not be saved.");
  }
  return done(id.data);
}

const noteSchema = z.string().trim().min(1, "Write something first.").max(2000, "Notes are limited to 2,000 characters.");

export async function addBookingNote(_previous: EditorState, formData: FormData): Promise<EditorState> {
  await requireAdmin();

  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return failure("That booking does not exist.");
  const text = noteSchema.safeParse(formData.get("note"));
  if (!text.success) return failure(text.error.issues[0].message);

  try {
    if (!(await addNote(id.data, text.data))) return failure("That booking no longer exists.");
  } catch (error) {
    console.error("[admin] could not add a booking note:", error);
    return failure("The note could not be saved.");
  }
  return done(id.data, "Note added.");
}

export async function deleteBookingNote(_previous: EditorState, formData: FormData): Promise<EditorState> {
  await requireAdmin();

  const id = idSchema.safeParse(formData.get("id"));
  const noteId = z.string().regex(/^[a-f0-9]{12}$/).safeParse(formData.get("noteId"));
  if (!id.success || !noteId.success) return failure("That note could not be found.");

  try {
    await removeNote(id.data, noteId.data);
  } catch (error) {
    console.error("[admin] could not remove a booking note:", error);
    return failure("The note could not be removed.");
  }
  return done(id.data);
}

function detailsFrom(formData: FormData) {
  const field = (name: string) => {
    const value = formData.get(name);
    return typeof value === "string" ? value : "";
  };
  return bookingDetailsSchema.safeParse({
    name: field("name"),
    email: field("email"),
    phone: field("phone"),
    eventDate: field("eventDate"),
    location: field("location"),
    guests: field("guests"),
    experience: field("experience"),
    budget: field("budget"),
    dietary: field("dietary"),
    message: field("message"),
  });
}

export async function saveBookingDetails(_previous: EditorState, formData: FormData): Promise<EditorState> {
  await requireAdmin();

  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return failure("That booking does not exist.");

  const details = detailsFrom(formData);
  if (!details.success) return failure(details.error.issues[0]?.message ?? "Some of those details could not be saved.");

  try {
    if (!(await updateDetails(id.data, details.data))) return failure("That booking no longer exists.");
  } catch (error) {
    console.error("[admin] could not update a booking:", error);
    return failure("The change could not be saved.");
  }
  return done(id.data, "Details saved.");
}

export async function createBookingByHand(_previous: EditorState, formData: FormData): Promise<EditorState> {
  await requireAdmin();

  const details = detailsFrom(formData);
  if (!details.success) return failure(details.error.issues[0]?.message ?? "Some of those details could not be saved.");

  // Someone who rang the restaurant usually needs a way back to them; a
  // booking with neither an email nor a phone number is a dead end.
  if (!details.data.email && !details.data.phone) return failure("Add an email address or a phone number for the guest.");

  const status = statusSchema.safeParse(formData.get("status"));
  const note = z.string().trim().max(2000).safeParse(formData.get("note") ?? "");

  let id: string;
  try {
    const booking = await createManualBooking(
      details.data,
      status.success ? status.data : "new",
      note.success && note.data ? note.data : undefined,
    );
    id = booking.id;
  } catch (error) {
    console.error("[admin] could not create a booking:", error);
    return failure("The booking could not be saved.");
  }

  await done(id);
  redirect(`/admin/bookings/${id}`);
}

export async function removeBooking(_previous: EditorState, formData: FormData): Promise<EditorState> {
  await requireAdmin();

  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return failure("That booking does not exist.");

  try {
    await deleteBooking(id.data);
  } catch (error) {
    console.error("[admin] could not delete a booking:", error);
    return failure("The booking could not be deleted.");
  }

  await done();
  redirect("/admin/bookings");
}
