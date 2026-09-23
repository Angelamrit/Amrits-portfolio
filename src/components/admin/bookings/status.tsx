import { cn } from "@/lib/cn";
import type { BookingStatus } from "@/lib/bookings/bookings";

/**
 * How a booking's state looks everywhere it appears.
 *
 * Colour is never the only signal: every pill carries its word, so the list is
 * readable in greyscale, on a poor screen, or by someone who cannot tell the
 * green from the gold. The colours themselves follow what the state asks of the
 * chef — gold for "needs you", green for "settled", rose for "not happening",
 * and a quiet grey for "done" — rather than being assigned in order.
 */

export const statusStyle: Record<BookingStatus, { pill: string; dot: string }> = {
  new: { pill: "border-gold/45 bg-gold/15 text-gold-light", dot: "bg-gold-light shadow-[0_0_8px_rgba(240,217,160,0.8)]" },
  contacted: { pill: "border-[#a99bea]/40 bg-[#a99bea]/12 text-[#c9bff5]", dot: "bg-[#a99bea]" },
  confirmed: { pill: "border-[#7fc39b]/45 bg-[#7fc39b]/12 text-[#9fd8b6]", dot: "bg-[#7fc39b]" },
  completed: { pill: "border-fg/15 bg-fg/[0.05] text-fg/60", dot: "bg-fg/45" },
  declined: { pill: "border-[#e59a93]/35 bg-[#e59a93]/10 text-[#eeb3ad]", dot: "bg-[#e59a93]" },
};

export const statusLabel: Record<BookingStatus, string> = {
  new: "New",
  contacted: "Contacted",
  confirmed: "Confirmed",
  completed: "Completed",
  declined: "Declined",
};

export function StatusPill({ status, className }: { status: BookingStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-pill border px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.14em]",
        statusStyle[status].pill,
        className,
      )}
    >
      <span aria-hidden className={cn("size-1.5 rounded-pill", statusStyle[status].dot)} />
      {statusLabel[status]}
    </span>
  );
}

/**
 * `2099-06-14` → "Sat 14 Jun 2099".
 *
 * The date is a calendar day the guest picked, not an instant, so it is parsed
 * and printed in UTC. Parsing it in the viewer's own timezone is the classic
 * off-by-one: a date entered in New York would show as the day before for
 * anyone reading the dashboard west of Greenwich's midnight.
 */
export function formatEventDate(value: string | undefined, style: "short" | "long" = "short"): string {
  if (!value) return "Date to be agreed";
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: style === "long" ? "long" : "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** "in 12 days", "tomorrow", "today", "3 days ago" — measured against the restaurant's own today. */
export function daysUntil(value: string | undefined, today: string): string | null {
  if (!value) return null;
  const diff = Math.round((Date.parse(`${value}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);
  if (Number.isNaN(diff)) return null;
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff === -1) return "yesterday";
  return diff > 0 ? `in ${diff} days` : `${-diff} days ago`;
}

/** Whole days between two calendar days, `to - from`. */
export function dayDiff(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

export type Attention = {
  /** `act` asks for a change of status; `note` only points something out. */
  tone: "act" | "note";
  text: string;
  /** The status the booking most likely belongs in now, offered as one tap. */
  suggest?: BookingStatus;
};

/** A reply that has waited this many days is flagged as overdue. */
const REPLY_DUE_DAYS = 2;

/**
 * What, if anything, is out of step with a booking's status.
 *
 * A status is set by hand and the calendar keeps moving underneath it, so a
 * list quietly fills with "confirmed" dinners that happened last week and
 * enquiries nobody answered. These rules catch exactly those, and each one
 * suggests the status that would put it right — the chef confirms with a tap
 * rather than the dashboard changing a record on its own.
 */
export function attentionFor(
  booking: { status: BookingStatus; eventDate?: string; createdAt: number },
  today: string,
): Attention | null {
  const dateGap = booking.eventDate ? dayDiff(today, booking.eventDate) : null;
  const passed = dateGap !== null && dateGap < 0;

  switch (booking.status) {
    case "new": {
      if (passed) return { tone: "act", text: "The date has passed without a reply", suggest: "declined" };
      const received = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(booking.createdAt);
      const waited = dayDiff(received, today);
      if (waited >= REPLY_DUE_DAYS) return { tone: "act", text: `Waiting ${waited} days for a reply`, suggest: "contacted" };
      return null;
    }
    case "contacted":
      return passed ? { tone: "act", text: "The date passed before it was confirmed", suggest: "declined" } : null;
    case "confirmed":
      if (passed) return { tone: "act", text: "The event has happened", suggest: "completed" };
      if (dateGap !== null && dateGap <= 3) return { tone: "note", text: `Coming up ${daysUntil(booking.eventDate, today)}` };
      return null;
    case "completed":
      return dateGap !== null && dateGap > 0 ? { tone: "note", text: "Marked completed, but the date is still ahead" } : null;
    default:
      return null;
  }
}

/** Labels for the one-tap buttons that apply a suggestion. */
export const suggestLabel: Record<BookingStatus, string> = {
  new: "Mark new",
  contacted: "Mark contacted",
  confirmed: "Mark confirmed",
  completed: "Mark completed",
  declined: "Mark declined",
};
