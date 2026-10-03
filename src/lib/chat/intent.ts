/**
 * Deterministic intent detection for the three actions the assistant can hand off.
 *
 * Decided here rather than asked of the model so the call-to-action is reliable:
 * it follows what the visitor asked for, not how the reply happened to be
 * phrased. Dependency-free and pure, like the input gate, so it runs on the
 * client and under `node --test` without a bundler.
 *
 * The assistant never completes a booking or an enquiry itself — both intents
 * end in a link to an existing workflow.
 */

import { SCOPE_REPLY } from "./gate.ts";

export type ChatIntent = "resy" | "event" | "aceva";

/** Which occasion to preselect in the existing contact wizard, when it is clear. */
export type EventExperience =
  | "weddings"
  | "corporate-events"
  | "private-dining"
  | "villa-yacht-dining"
  | "personal-chef"
  | "dinner-parties";

export type IntentMatch = { intent: ChatIntent; experience?: EventExperience };

/**
 * The studio credited in the footer. A question about who made this site gets
 * a Visit Aceva Tech button; the reply itself is one fixed sentence, so the
 * button is the only thing that carries the visitor anywhere.
 */
export const ACEVA_URL = "https://acevatech.com";
const ACEVA_TERMS = [
  "aceva", "acevatech",
  "who built this website", "who built this site", "who built the website", "who built the site",
  "who made this website", "who made this site", "who created this website", "who created this site",
  "who designed this website", "who designed this site", "who designed the website",
  "who developed this website", "who developed this site", "built this website", "built the website",
  "designed this website", "designed the website", "developed this website",
  "designers behind this website", "designers behind the website", "designer behind this website",
  "developers behind this website", "developers behind the website",
  "contact the developers", "contact the developer", "contact the designers", "contact the designer",
  "the developers", "the developer of this", "the designer of this", "web developer", "web designer",
  // The assistant itself, and the people behind the site.
  "who built you", "who made you", "who created you", "who developed you", "who designed you",
  "founder of this website", "founder of the website", "founder of this site", "who founded this website",
];

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

/**
 * A date, day or time. Naming one is the commonest way a visitor continues a
 * booking or a celebration — "what about October 15?", "can I do it on
 * Saturday?", "what about tomorrow?" — and none of those phrases carries a
 * booking word of its own, so the handoff used to vanish on the second turn.
 *
 * The assistant still cannot see a diary; this only decides which existing
 * workflow the button points at, never whether the date is free.
 */
const DATE_MARKERS =
  /\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b|\b(?:mon|tue|tues|wed|wednes|thu|thur|thurs|fri|sat|satur|sun)(?:day)?\b|\b(?:today|tonight|tomorrow|weekend|this week|next week|next month|this month)\b|\b\d{1,2}(?:st|nd|rd|th)?\b/;

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

  // Unambiguous and about this site rather than the restaurant, so it is
  // decided before anything that could read "contact" or "event" into it.
  if (ACEVA_TERMS.some((term) => text.includes(term))) return { intent: "aceva" };

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

  // A bare date continues whatever was already being arranged. Without this,
  // "I want to host a birthday event" followed by "What about October 15?" lost
  // the celebration handoff and offered nothing at all.
  if (previous && DATE_MARKERS.test(text)) {
    return previous;
  }

  return null;
}

/**
 * The handoff a reply should actually carry.
 *
 * `detectIntent` runs on the visitor's wording before the answer exists, which
 * is what keeps the button steady while the reply streams in. That guess can be
 * wrong: "Do you cater?" matches an event term but catering is not a listed
 * service, and "What experiences are available?" matches a booking term. Both
 * are refused, and both were rendering a call-to-action button underneath the
 * refusal sentence. The refusal is meant to be one sentence and nothing else,
 * so a refused reply carries no handoff.
 *
 * Routing is unchanged — this only withdraws a handoff the answer disowned, or
 * swaps it for the one the answer actually names.
 */
export function ctaForReply(cta: IntentMatch | undefined, replyText: string): IntentMatch | undefined {
  if (replyText === SCOPE_REPLY) return undefined;
  if (!cta || cta.intent === "aceva") return cta;

  // The keyword guess and the answer can disagree. "Book a table for a wedding
  // party of 40" reads as a reservation on "book" + "table", but the answer
  // — rightly — sends a forty-guest wedding to the enquiry form, and the
  // visitor was shown a Reserve a Table button under words telling them to use
  // Plan Your Celebration. The assistant is instructed to name the button it
  // means, so when the words name only the other workflow, the button follows
  // the words. When both are named, or neither, the guess stands.
  const namesEvent = /Plan Your Celebration/i.test(replyText);
  const namesResy = /Reserve a Table|\bResy\b/i.test(replyText);
  if (cta.intent === "resy" && namesEvent && !namesResy) return { intent: "event" };
  if (cta.intent === "event" && namesResy && !namesEvent) return { intent: "resy" };
  return cta;
}

/** Kept for the reservation-specific checks; equivalent to a "resy" match. */
export function hasReservationIntent(raw: string): boolean {
  return detectIntent(raw)?.intent === "resy";
}
