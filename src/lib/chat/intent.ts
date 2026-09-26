/**
 * Deterministic intent detection for the two actions the assistant can hand off.
 *
 * Decided here rather than asked of the model so the call-to-action is reliable:
 * it follows what the visitor asked for, not how the reply happened to be
 * phrased. Dependency-free and pure, like the input gate, so it runs on the
 * client and under `node --test` without a bundler.
 *
 * The assistant never completes a booking or an enquiry itself — both intents
 * end in a link to an existing workflow.
 */

export type ChatIntent = "resy" | "event";

/** Which occasion to preselect in the existing contact wizard, when it is clear. */
export type EventExperience =
  | "weddings"
  | "corporate-events"
  | "private-dining"
  | "villa-yacht-dining"
  | "personal-chef"
  | "dinner-parties";

export type IntentMatch = { intent: ChatIntent; experience?: EventExperience };

/** A table at the restaurant: these route to Resy. */
const TABLE_TERMS = ["table", "resy", "walk in", "walkin"];

/** Verbs and nouns that mean "I want to arrange something". */
const BOOKING_TERMS = [
  "book", "booking", "reserve", "reservation", "availab", "seats", "seating",
  "openings",
];
// Deliberately absent: "opening" matched "opening hours", "do you have any"
// matched every menu question, and "get a" matched "can I get a samosa". Phrases
// like "get a table" are already covered by TABLE_TERMS on their own.

/**
 * Occasions handled by the enquiry workflow rather than by Resy. Ordered most
 * specific first so the matching experience is the one preselected.
 */
const EVENT_TERMS: ReadonlyArray<{ terms: string[]; experience?: EventExperience }> = [
  { terms: ["wedding", "rehearsal dinner", "reception"], experience: "weddings" },
  {
    terms: ["corporate", "company", "work event", "team dinner", "client dinner", "office party"],
    experience: "corporate-events",
  },
  { terms: ["yacht", "villa", "boat"], experience: "villa-yacht-dining" },
  { terms: ["personal chef", "private chef", "weekly chef", "residency"], experience: "personal-chef" },
  {
    terms: ["private dining", "private room", "private dinner", "private event", "buy out", "buyout"],
    experience: "private-dining",
  },
  {
    terms: [
      "birthday", "anniversary", "engagement", "celebration", "celebrate", "celebrating",
      "dinner party", "family gathering", "gathering", "get together", "baby shower",
      "graduation", "special occasion", "host a", "hosting a", "catering", "cater",
    ],
    experience: "dinner-parties",
  },
  // An event enquiry with no identifiable occasion: hand off without presetting.
  { terms: ["event", "party", "function"], experience: undefined },
];

/** Short referring phrases that carry the previous turn's intent forward. */
const FOLLOW_UP_MARKERS = [
  "how do i do that", "how do i", "how does that", "how would i", "what next",
  "and then", "do that", "arrange that", "set that up", "sort that",
  "more info", "more information", "tell me more", "go on",
];

function normalize(input: string): string {
  return input
    .normalize("NFKC")
    .replace(/[-‐-―−]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function matchEvent(text: string): IntentMatch | null {
  for (const group of EVENT_TERMS) {
    if (group.terms.some((term) => text.includes(term))) {
      return { intent: "event", experience: group.experience };
    }
  }
  return null;
}

export type IntentOptions = {
  /**
   * The intent of the most recent reply, if any. A bare follow-up such as
   * "How do I do that?" keeps the conversation's handoff rather than losing it.
   */
  previous?: IntentMatch | null;
};

export function detectIntent(raw: string, options: IntentOptions = {}): IntentMatch | null {
  if (typeof raw !== "string") return null;
  const text = normalize(raw);
  if (!text) return null;

  const wantsTable = TABLE_TERMS.some((term) => text.includes(term));
  const wantsBooking = BOOKING_TERMS.some((term) => text.includes(term));

  // An explicit table request wins outright, even when an occasion is mentioned:
  // "book a table for my birthday" is a reservation, not an event enquiry.
  if (wantsTable && wantsBooking) return { intent: "resy" };

  const event = matchEvent(text);
  if (event) return event;

  // "a table tonight", with no other signal.
  if (wantsTable) return { intent: "resy" };

  // "I want to make a booking", "do you have availability Saturday?"
  if (wantsBooking) return { intent: "resy" };

  // Nothing of its own: carry the conversation's handoff across a short
  // follow-up, so "How do I do that?" after an event question still helps.
  const { previous } = options;
  if (previous && FOLLOW_UP_MARKERS.some((marker) => text.includes(marker))) {
    return previous;
  }

  return null;
}

/** Kept for the reservation-specific checks; equivalent to a "resy" match. */
export function hasReservationIntent(raw: string): boolean {
  return detectIntent(raw)?.intent === "resy";
}
