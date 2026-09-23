/**
 * Deterministic reservation-intent detection.
 *
 * When a visitor asks about booking a table, the assistant must not take or
 * confirm anything in chat — it points at Resy. Deciding that here rather than
 * asking the model to emit a marker keeps the call-to-action reliable: the
 * button appears on intent, not on however the reply happened to be phrased.
 *
 * Dependency-free and pure, like the input gate, so it runs on the client and
 * under `node --test` without a bundler.
 */

/** Wanting a table, a time, or a booking. */
const RESERVATION_TERMS = [
  "reserve", "reservation", "resy", "book a table", "book at table", "booking",
  "table for", "get a table", "a table", "seats", "seating", "walk in", "walkin",
  "availability", "available tonight", "available tomorrow", "any tables",
  "do you take bookings", "how do i book", "can i book",
];

/**
 * Private-service enquiries also use "book", but they route to the team rather
 * than Resy — sending a wedding enquiry to a restaurant booking page would be
 * the wrong handoff.
 */
const PRIVATE_SERVICE_TERMS = [
  "private dining", "private dinner", "private event", "private chef",
  "personal chef", "dinner party", "corporate", "wedding", "catering", "cater",
  "yacht", "villa", "residency", "at my home", "at my house", "off site", "offsite",
];

function normalize(input: string): string {
  return input
    .normalize("NFKC")
    .replace(/[-‐-―−]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * True when the visitor is asking about a restaurant table booking, and not
 * about a private service.
 */
export function hasReservationIntent(raw: string): boolean {
  if (typeof raw !== "string") return false;
  const text = normalize(raw);
  if (!text) return false;

  if (PRIVATE_SERVICE_TERMS.some((term) => text.includes(term))) return false;

  return RESERVATION_TERMS.some((term) => text.includes(term));
}
