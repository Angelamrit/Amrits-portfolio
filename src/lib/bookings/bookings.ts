import "server-only";
import { randomBytes, randomInt } from "node:crypto";
import { z } from "zod";
import { store } from "@/lib/store";
import { budgetOptions, experienceOptions, type InquiryInput } from "@/lib/validation/inquiry";

/**
 * Every booking enquiry, kept.
 *
 * Until this existed an enquiry was an email and nothing else: if the mailer
 * was misconfigured, or the message landed in spam, or the chef archived it
 * by accident, the enquiry was gone. Now the booking form stores each one
 * here first and emails second, so the dashboard is the record and the email
 * is the notification.
 *
 * The lifecycle is deliberately short — the five states a private-dining
 * enquiry actually moves through — and every change of state is written to a
 * history, so "when did we confirm this?" has an answer months later.
 *
 * Storage is one document holding every booking, updated through
 * `store.updateDoc`. That matters: bookings arrive from the public, two can
 * land in the same second, and a separate read-then-write would let one of
 * them silently overwrite the other.
 */

const DOC = "bookings";

export const BOOKING_STATUSES = ["new", "contacted", "confirmed", "completed", "declined"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const statusLabels: Record<BookingStatus, string> = {
  new: "New",
  contacted: "Contacted",
  confirmed: "Confirmed",
  completed: "Completed",
  declined: "Declined",
};

/** One line each, shown under the status buttons so the meaning is never a guess. */
export const statusHints: Record<BookingStatus, string> = {
  new: "Just arrived. Nobody has replied yet.",
  contacted: "You have replied and are talking it through.",
  confirmed: "Agreed and in the diary.",
  completed: "The event has happened.",
  declined: "Not going ahead — turned down, cancelled or spam.",
};

export type BookingSource = "website" | "manual";

export type BookingNote = { id: string; at: number; text: string };
export type BookingEvent = { at: number; status: BookingStatus };

export type Booking = {
  id: string;
  /** Short, speakable reference — what the chef and the guest quote to each other. */
  ref: string;
  createdAt: number;
  updatedAt: number;
  status: BookingStatus;
  source: BookingSource;

  name: string;
  email?: string;
  phone?: string;
  /** `YYYY-MM-DD`, as the date picker sends it. A calendar day, deliberately not an instant. */
  eventDate?: string;
  location?: string;
  guests: number;
  experience: (typeof experienceOptions)[number];
  dietary?: string;
  budget?: (typeof budgetOptions)[number];
  message: string;

  /** Whether the notification email to the chef actually went out. False means this dashboard is the only copy. */
  emailed: boolean;

  /** Private to the dashboard. Never shown to the guest, never emailed. */
  notes: BookingNote[];
  history: BookingEvent[];
};

type BookingsDoc = { version: 1; bookings: Booking[] };

function readBookingsDoc(current: BookingsDoc | null): BookingsDoc {
  return current?.version === 1 && Array.isArray(current.bookings) ? current : { version: 1, bookings: [] };
}

/**
 * Letters and digits that cannot be misread over the phone or in handwriting:
 * no 0/O, no 1/I/L, no 5/S, no 8/B. "APS-7K3Q" survives being read aloud.
 */
const REF_ALPHABET = "2346789ACDEFGHJKMNPQRTUVWXYZ";

function newRef(taken: Set<string>): string {
  for (;;) {
    let code = "";
    for (let i = 0; i < 5; i += 1) code += REF_ALPHABET[randomInt(REF_ALPHABET.length)];
    const ref = `APS-${code}`;
    if (!taken.has(ref)) return ref;
  }
}

/* ------------------------------------------------------------------ reads */

export async function listBookings(): Promise<Booking[]> {
  const doc = readBookingsDoc(await store.readDoc<BookingsDoc>(DOC));
  return [...doc.bookings].sort((a, b) => b.createdAt - a.createdAt);
}

export async function getBooking(id: string): Promise<Booking | undefined> {
  return (await listBookings()).find((booking) => booking.id === id);
}

export async function countNewBookings(): Promise<number> {
  return (await listBookings()).filter((booking) => booking.status === "new").length;
}

/* ----------------------------------------------------------------- writes */

type NewBooking = Omit<Booking, "id" | "ref" | "createdAt" | "updatedAt" | "status" | "notes" | "history" | "emailed"> & {
  status?: BookingStatus;
  note?: string;
};

export async function createBooking(input: NewBooking): Promise<Booking> {
  const now = Date.now();
  const status = input.status ?? "new";
  const { note, ...fields } = input;

  let created: Booking | undefined;
  await store.updateDoc<BookingsDoc>(DOC, (current) => {
    const doc = readBookingsDoc(current);
    created = {
      ...fields,
      id: `bk-${randomBytes(8).toString("hex")}`,
      ref: newRef(new Set(doc.bookings.map((booking) => booking.ref))),
      createdAt: now,
      updatedAt: now,
      status,
      emailed: false,
      notes: note ? [{ id: randomBytes(6).toString("hex"), at: now, text: note }] : [],
      history: [{ at: now, status }],
    };
    return { version: 1, bookings: [...doc.bookings, created] };
  });
  return created!;
}

/** The website form's path in: the validated enquiry, as-is. */
export function recordWebsiteBooking(inquiry: InquiryInput): Promise<Booking> {
  return createBooking({
    source: "website",
    name: inquiry.name,
    email: inquiry.email,
    phone: inquiry.phone,
    eventDate: inquiry.eventDate,
    location: inquiry.location,
    guests: inquiry.guests,
    experience: inquiry.experience,
    dietary: inquiry.dietary,
    budget: inquiry.budget,
    message: inquiry.message,
  });
}

/**
 * Changes one booking in place. Returns `false` when the id is unknown, so the
 * caller can say "that booking no longer exists" rather than "saved".
 */
async function mutate(id: string, change: (booking: Booking) => Booking): Promise<boolean> {
  let found = false;
  await store.updateDoc<BookingsDoc>(DOC, (current) => {
    const doc = readBookingsDoc(current);
    return {
      version: 1,
      bookings: doc.bookings.map((booking) => {
        if (booking.id !== id) return booking;
        found = true;
        return { ...change(booking), updatedAt: Date.now() };
      }),
    };
  });
  return found;
}

export function markEmailed(id: string): Promise<boolean> {
  return mutate(id, (booking) => ({ ...booking, emailed: true }));
}

export function setStatus(id: string, status: BookingStatus): Promise<boolean> {
  return mutate(id, (booking) =>
    booking.status === status
      ? booking
      : { ...booking, status, history: [...booking.history, { at: Date.now(), status }] },
  );
}

export function addNote(id: string, text: string): Promise<boolean> {
  return mutate(id, (booking) => ({
    ...booking,
    notes: [...booking.notes, { id: randomBytes(6).toString("hex"), at: Date.now(), text }],
  }));
}

export function removeNote(id: string, noteId: string): Promise<boolean> {
  return mutate(id, (booking) => ({ ...booking, notes: booking.notes.filter((note) => note.id !== noteId) }));
}

/** The fields the chef can correct after the fact — a misspelt name, a date that moved, a new head count. */
export const bookingDetailsSchema = z.object({
  name: z.string().trim().min(2, "The guest needs a name.").max(80),
  email: z
    .string()
    .trim()
    .max(254)
    .refine((value) => value === "" || z.email().safeParse(value).success, "That is not an email address."),
  phone: z.string().trim().max(40),
  eventDate: z
    .string()
    .trim()
    .refine((value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value), "Choose a date."),
  location: z.string().trim().max(120),
  guests: z.coerce.number().int("Guests must be a whole number.").min(1, "At least one guest.").max(1000),
  experience: z.enum(experienceOptions),
  budget: z.union([z.enum(budgetOptions), z.literal("")]),
  dietary: z.string().trim().max(500),
  message: z.string().trim().max(2000),
});

export type BookingDetails = z.infer<typeof bookingDetailsSchema>;

/** Blank optional fields are stored as absent, not as empty strings. */
function tidy(details: BookingDetails) {
  const blank = (value: string) => (value.length > 0 ? value : undefined);
  return {
    name: details.name,
    email: blank(details.email),
    phone: blank(details.phone),
    eventDate: blank(details.eventDate),
    location: blank(details.location),
    guests: details.guests,
    experience: details.experience,
    budget: details.budget === "" ? undefined : details.budget,
    dietary: blank(details.dietary),
    message: details.message,
  };
}

export function updateDetails(id: string, details: BookingDetails): Promise<boolean> {
  return mutate(id, (booking) => ({ ...booking, ...tidy(details) }));
}

export function createManualBooking(details: BookingDetails, status: BookingStatus, note?: string): Promise<Booking> {
  return createBooking({ ...tidy(details), source: "manual", status, note });
}

/**
 * Removes a booking outright.
 *
 * For spam, duplicates and a guest who asks for their details to be erased.
 * A booking that simply is not going ahead should be marked declined instead,
 * which keeps the record.
 */
export async function deleteBooking(id: string): Promise<boolean> {
  let found = false;
  await store.updateDoc<BookingsDoc>(DOC, (current) => {
    const doc = readBookingsDoc(current);
    const bookings = doc.bookings.filter((booking) => booking.id !== id);
    found = bookings.length !== doc.bookings.length;
    return { version: 1, bookings };
  });
  return found;
}

/* ---------------------------------------------------------------- summary */

/** Today as `YYYY-MM-DD` in the restaurant's own timezone, which is what "upcoming" is measured against. */
export function todayInNewYork(now = Date.now()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date(now));
}

export type BookingSummary = {
  awaitingReply: number;
  upcomingConfirmed: number;
  receivedThisMonth: number;
  guestsConfirmedUpcoming: number;
  byStatus: Record<BookingStatus, number>;
  nextEvent: Booking | null;
};

export function summarise(bookings: Booking[], now = Date.now()): BookingSummary {
  const today = todayInNewYork(now);
  const monthPrefix = today.slice(0, 7);

  const byStatus = Object.fromEntries(BOOKING_STATUSES.map((status) => [status, 0])) as Record<BookingStatus, number>;
  for (const booking of bookings) byStatus[booking.status] += 1;

  const upcoming = bookings
    .filter((booking) => booking.status === "confirmed" && booking.eventDate && booking.eventDate >= today)
    .sort((a, b) => (a.eventDate ?? "").localeCompare(b.eventDate ?? ""));

  return {
    awaitingReply: byStatus.new,
    upcomingConfirmed: upcoming.length,
    receivedThisMonth: bookings.filter((booking) => todayInNewYork(booking.createdAt).startsWith(monthPrefix)).length,
    guestsConfirmedUpcoming: upcoming.reduce((sum, booking) => sum + booking.guests, 0),
    byStatus,
    nextEvent: upcoming[0] ?? null,
  };
}
