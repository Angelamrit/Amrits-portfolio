import { isSignedIn } from "@/lib/admin/auth";
import { listBookings } from "@/lib/bookings/bookings";
import { budgetLabels, experienceLabels } from "@/lib/validation/inquiry";
import { statusLabel } from "@/components/admin/bookings/status";

/**
 * Every booking as a spreadsheet.
 *
 * For the accountant, for a backup kept somewhere other than this server, or
 * for anyone who would rather sort a list in Excel than in a browser.
 *
 * Two things this is careful about. The session is checked here again rather
 * than trusted from `proxy.ts`, because a route handler is reachable on its own.
 * And every cell is guarded against formula injection: these values were typed
 * by the public, and a "name" of `=HYPERLINK(...)` would otherwise run as a
 * formula the moment the chef opens the file.
 */

function cell(value: string | number | undefined): string {
  let text = value === undefined ? "" : String(value);
  // A leading = + - @ (or a tab/carriage return) makes a spreadsheet treat the
  // cell as a formula. A leading apostrophe makes it plain text again.
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export async function GET() {
  if (!(await isSignedIn())) {
    return new Response("Not signed in.", { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  const bookings = await listBookings();
  const header = [
    "Reference",
    "Status",
    "Received",
    "Source",
    "Name",
    "Email",
    "Phone",
    "Event date",
    "Guests",
    "Experience",
    "Where",
    "Budget",
    "Dietary",
    "Message",
    "Private notes",
  ];

  const rows = bookings.map((booking) =>
    [
      booking.ref,
      statusLabel[booking.status],
      new Date(booking.createdAt).toISOString().slice(0, 16).replace("T", " "),
      booking.source === "manual" ? "Added by hand" : "Website",
      booking.name,
      booking.email,
      booking.phone,
      booking.eventDate,
      booking.guests,
      experienceLabels[booking.experience],
      booking.location,
      booking.budget ? budgetLabels[booking.budget] : undefined,
      booking.dietary,
      booking.message,
      booking.notes.map((note) => note.text).join(" | "),
    ]
      .map(cell)
      .join(","),
  );

  // The byte-order mark is what makes Excel read the file as UTF-8, so a
  // guest's accented name is not mangled into question marks.
  const csv = `\uFEFF${[header.join(","), ...rows].join("\r\n")}\r\n`;
  const date = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bookings-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
