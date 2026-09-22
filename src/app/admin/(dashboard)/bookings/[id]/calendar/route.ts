import { isSignedIn } from "@/lib/admin/auth";
import { getBooking } from "@/lib/bookings/bookings";
import { experienceLabels } from "@/lib/validation/inquiry";

/**
 * One booking as a calendar file, so a confirmed event lands in the chef's
 * own calendar — phone, Outlook or Google — with the guest's details on it.
 *
 * It is an all-day event: the booking form asks for a day, not a time. The
 * session is checked here again, as on the spreadsheet export, because a route
 * handler is reachable on its own. Every value came from the public, so each
 * is escaped per RFC 5545 — an unescaped newline or semicolon in a "name"
 * would otherwise start a property of its own.
 */

function escapeText(value: string): string {
  return value.replace(/\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\,").replace(/\r?\n/g, "\n");
}

/** Lines are folded at 75 octets, as the format requires — counted in UTF-8 bytes, never splitting a character. */
function fold(line: string): string {
  const out: string[] = [];
  let current = "";
  let bytes = 0;
  for (const char of line) {
    const size = Buffer.byteLength(char);
    if (bytes + size > 74) {
      out.push(current);
      current = " ";
      bytes = 1;
    }
    current += char;
    bytes += size;
  }
  out.push(current);
  return out.join("\r\n");
}

const compactDate = (value: string) => value.replace(/-/g, "");

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const headers = { "Cache-Control": "no-store" };
  if (!(await isSignedIn())) return new Response("Not signed in.", { status: 401, headers });

  const { id } = await params;
  const booking = /^bk-[a-f0-9]{16}$/.test(id) ? await getBooking(id) : undefined;
  if (!booking) return new Response("That booking does not exist.", { status: 404, headers });
  if (!booking.eventDate) return new Response("This booking has no date yet.", { status: 409, headers });

  const start = new Date(`${booking.eventDate}T00:00:00Z`);
  const end = new Date(start.getTime() + 86_400_000).toISOString().slice(0, 10);
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  const description = [
    `${booking.guests} ${booking.guests === 1 ? "guest" : "guests"} · ${experienceLabels[booking.experience]}`,
    booking.email && `Email: ${booking.email}`,
    booking.phone && `Phone: ${booking.phone}`,
    booking.dietary && `Dietary: ${booking.dietary}`,
    booking.message && `\n${booking.message}`,
    `\nReference ${booking.ref}`,
  ]
    .filter(Boolean)
    .join("\n");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Chef Amrit Pal Singh//Bookings//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${booking.id}@chef-amrit-pal-singh`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${compactDate(booking.eventDate)}`,
    `DTEND;VALUE=DATE:${compactDate(end)}`,
    `SUMMARY:${escapeText(`${booking.name} — ${experienceLabels[booking.experience]} (${booking.guests})`)}`,
    booking.location ? `LOCATION:${escapeText(booking.location)}` : "",
    `DESCRIPTION:${escapeText(description)}`,
    `STATUS:${booking.status === "confirmed" || booking.status === "completed" ? "CONFIRMED" : "TENTATIVE"}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  return new Response(`${lines.map(fold).join("\r\n")}\r\n`, {
    headers: {
      ...headers,
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${booking.ref}.ics"`,
    },
  });
}
