/**
 * Deterministic pre-model gate.
 *
 * The knowledge base's `answer_policy.input_decision_flow` requires that
 * greetings, gibberish, emoji-only, empty and context-free inputs never reach
 * the model at all ("do not invoke the AI model"). That is a hard requirement,
 * not a prompt instruction: the Gemini free tier is quota-limited per day, so a
 * visitor typing "hi" must not cost a request.
 *
 * This module is intentionally dependency-free and pure so it can run on the
 * client (for instant feedback), on the server (as the authoritative guard) and
 * under `node --test` without a bundler.
 */

export type GateReason =
  | "empty"
  | "too_long"
  | "emoji_only"
  | "gibberish"
  | "greeting"
  | "profanity"
  | "vague_wh"
  | "off_topic";

export type GateDecision =
  | { allow: true }
  | { allow: false; reason: GateReason; response: string };

/** Longest input we accept. Anything beyond this is abuse, not a question. */
export const MAX_INPUT_LENGTH = 1000;

const SCOPE_HINT =
  "I can only help with questions about Chef Amrit Pal Singh and Angel Indian Restaurant — the menu, the food, visiting, recognition and contact details.";

const GATE_RESPONSES: Record<GateReason, string> = {
  empty: "Please type a question about Chef Amrit or Angel Indian Restaurant.",
  too_long: "That message is a little long for me. Could you shorten it to a single question?",
  emoji_only: "Ask me about Chef Amrit or Angel Indian Restaurant.",
  gibberish: "I didn't catch that. Ask me about Chef Amrit or Angel Indian Restaurant.",
  greeting: "Ask me about Chef Amrit or Angel Indian Restaurant.",
  profanity: "Ask me about Chef Amrit or Angel Indian Restaurant.",
  vague_wh: "Could you give me a little more detail? " + SCOPE_HINT,
  off_topic: SCOPE_HINT,
};

/** Small talk that carries no question. A message made only of these is not answered. */
const SMALL_TALK = new Set([
  "hi", "hii", "hiii", "hiya", "hello", "helo", "hey", "heya", "yo", "howdy", "greetings",
  "good", "morning", "afternoon", "evening", "night", "day",
  "thanks", "thank", "thankyou", "thx", "ty", "cheers", "appreciated",
  "bye", "goodbye", "cya", "later",
  "ok", "okay", "k", "cool", "nice", "great", "awesome", "lovely", "sure", "yes", "no",
  "yeah", "nah", "please", "sorry", "welcome", "sup", "whatsup", "wassup",
  "there", "mate", "friend",
  "how", "are", "you", "doing", "is", "it", "going", "u", "r",
  "test", "testing",
]);

/**
 * Whole-phrase small talk. These are matched before the WH check so that
 * "how are you" reads as a greeting while a bare "how?" reads as a
 * context-free question.
 */
const SMALL_TALK_PHRASES = new Set([
  "how are you",
  "how are you doing",
  "how is it going",
  "hows it going",
  "how do you do",
  "whats up",
  "what is up",
  "good to see you",
  "nice to meet you",
]);

const WH_WORDS = new Set(["what", "why", "how", "where", "when", "who", "whom", "whose", "which"]);

/**
 * Abusive input is answered with the scope reminder rather than sent to the
 * model. Matched as token prefixes, never as substrings, so ordinary words are
 * not caught — the classic example being place names that contain a slur.
 * Checked against the whole knowledge base vocabulary for collisions: none.
 */
const PROFANITY_STEMS = [
  "fuck", "motherfuck", "shit", "bullshit", "cunt", "bitch", "bastard", "wank",
  "slut", "whore", "nigg", "fag", "retard", "asshole", "arsehole", "bollock",
  "twat", "piss",
];

/** Filler that can pad a context-free question without adding a subject. */
const FILLER = new Set([
  "a", "an", "the", "is", "are", "was", "were", "do", "does", "did", "can", "could",
  "would", "should", "will", "shall", "it", "this", "that", "there", "here", "to",
  "of", "for", "about", "me", "you", "your", "i", "and", "or", "please", "tell",
  "much", "many", "long", "far", "come", "on", "so", "then", "really", "up",
  "one", "ones", "some", "any", "else", "other", "more", "again", "too",
  // Words that only refer back to something already said. They let a genuine
  // follow-up ("and the second one?") stay recognisable as structural now that
  // unrecognised input is no longer waved through mid-conversation.
  "first", "second", "third", "last", "next", "previous", "both", "either",
  "them", "they", "those", "these", "im", "am",
]);

/**
 * Topics that stay out of scope even mid-conversation. Once a thread is open the
 * gate relaxes for follow-ups, so this list keeps the obvious general-knowledge
 * detours out without relying on the model to decline them.
 */
const OFF_TOPIC_MARKERS = [
  "football", "cricket", "soccer", "basketball", "baseball", "nfl", "nba",
  "election", "president", "politic", "government", "stock market", "crypto", "bitcoin",
  "weather", "forecast", "homework", "essay", "javascript", "python", "write code",
  "translate", "movie", "netflix", "song", "lyrics", "celebrity", "horoscope", "lottery",
  "medical advice", "diagnos", "legal advice",
];

/** Core in-scope vocabulary. KB-derived terms are added on top of this at call time. */
export const CORE_SCOPE_TERMS = [
  // Identity
  "amrit", "amritpal", "singh", "angel", "chef", "owner", "restaurant", "kitchen",
  // Place and visiting
  "jackson heights", "queens", "new york", "nyc", "37th", "address", "located", "location",
  "direction", "map", "parking", "visit", "hour", "open", "close", "closing", "opening",
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
  "lunch", "dinner", "brunch", "breakfast",
  // Bare time words ("today", "tonight", "tomorrow", "weekend") are deliberately
  // absent: alone they signal nothing about scope, and they would rescue
  // off-topic questions such as "what is the weather tomorrow".
  // Booking
  "book", "booking", "reserve", "reservation", "resy", "table", "seat", "seating",
  "party", "group", "walk in", "walkin", "cancel", "deposit",
  // Food
  "menu", "dish", "food", "eat", "dine", "dining", "cuisine", "taste", "tasting",
  "appetizer", "starter", "main", "course", "dessert", "bread", "side", "drink",
  "cocktail", "wine", "beer", "bar", "byob", "special", "signature", "recommend",
  "popular", "spice", "spicy", "mild", "portion", "price", "cost", "expensive", "cheap",
  "vegan", "vegetarian", "veg", "halal", "meat", "chicken", "lamb", "goat", "fish",
  "paneer", "tandoor", "biryani", "curry", "naan", "samosa", "pakora", "lassi", "chai",
  "allerg", "gluten", "dairy", "diet", "dietary",
  // Story and recognition
  "punjab", "punjabi", "pathankot", "india", "indian", "australia", "rahi", "adda",
  "michelin", "bib", "gourmand", "guide", "award", "recognition", "press", "review",
  "acclaim", "vikas", "khanna", "story", "history", "background", "career",
  "philosophy", "biography", "experience", "team", "staff",
  // Private services (listed on the portfolio; see the services rule in the prompt)
  "private", "event", "wedding", "corporate", "catering", "cater", "yacht", "villa",
  "personal chef", "dinner party", "celebration", "birthday", "anniversary",
  // Contact
  "contact", "phone", "call", "email", "enquir", "inquir", "reach",
  "delivery", "deliver", "takeout", "take out", "takeaway", "pickup",
  // Paying, tipping and gift cards
  "pay", "payment", "paying", "cash", "credit card", "debit card", "card payment",
  "apple pay", "google pay", "venmo", "amex", "contactless", "gratuity",
  "service charge", "bill", "gift", "gift card", "voucher", "certificate",
  // Facilities
  "restroom", "bathroom", "toilet", "washroom", "coat check", "cloakroom",
  // Arriving without a booking, and waiting
  "walk in", "walkin", "waitlist", "queue",
  // Bringing something, and celebrations
  "cake", "candle", "balloon", "decorate", "byo", "corkage",
  // Accessibility and hospitality
  "kid", "child", "family friendly", "wheelchair", "accessible", "dress code",
];

function normalize(input: string): string {
  return (
    input
      .normalize("NFKC")
      // Hyphens and dashes become spaces before any matching, so hyphenated
      // forms reach the space-separated phrases in the lexicon: "walk-ins"
      // becomes "walk ins", which contains "walk in". Without this every
      // hyphenated term missed, and "Do you take walk-ins?" was refused as
      // off-topic despite "walk in" being listed.
      .replace(/[-‐-―−]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase()
  );
}

function tokenize(normalized: string): string[] {
  return normalized
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function isEmojiOnly(normalized: string): boolean {
  const hadEmoji = /\p{Extended_Pictographic}/u.test(normalized);
  if (!hadEmoji) return false;
  const remainder = normalized
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/[️‍]/g, "")
    .replace(/[\s\p{P}\p{S}]/gu, "");
  return remainder.length === 0;
}

/**
 * Keyboard-smash detection. Deliberately conservative: it only fires when no
 * token looks like a word, so a real question containing an unusual proper noun
 * is never mistaken for noise.
 */
function isGibberish(tokens: string[]): boolean {
  if (tokens.length === 0) return true;

  const wordish = tokens.filter((t) => {
    if (!/\p{L}/u.test(t)) return false; // pure numbers and symbols are not words
    if (t.length <= 2) return /^(a|i|is|it|in|on|at|to|do|of|so|no|ok|hi|my|we|he|us)$/.test(t);
    if (/(.)\1{3,}/.test(t)) return false; // "aaaaa"
    if (!/[aeiouy]/.test(t)) return false; // no vowel at all is a smash
    // A smash such as "asdjkh" still contains a vowel, and its vowel density is
    // identical to a real word like "thanks", so density cannot separate them.
    // The signal that does is the consonant run: "asdjkh" has five in a row,
    // "thanks" has at most three.
    if (/[^aeiouy\W\d]{4,}/.test(t)) return false;
    return true;
  });

  return wordish.length === 0;
}

function hasOffTopicMarker(normalized: string): boolean {
  return OFF_TOPIC_MARKERS.some((m) => normalized.includes(m));
}

function hasScopeSignal(normalized: string, tokens: string[], lexicon: readonly string[]): boolean {
  const tokenSet = new Set(tokens);
  for (const term of lexicon) {
    if (term.includes(" ")) {
      if (normalized.includes(term)) return true;
    } else if (tokenSet.has(term)) {
      return true;
    } else if (term.length >= 4 && tokens.some((t) => t.startsWith(term))) {
      // Cheap stemming: "hour" matches "hours", "allerg" matches "allergies".
      return true;
    }
  }
  return false;
}

export type GateOptions = {
  /** Extra in-scope vocabulary, normally derived from the knowledge base. */
  lexicon?: readonly string[];
  /**
   * True when the visitor already has an answered, in-scope exchange open. A
   * short follow-up ("which ones?") is not a *context-free* question, so the
   * vague-WH and unknown-subject blocks are relaxed — but small talk, noise and
   * explicit off-topic detours stay blocked.
   */
  hasContext?: boolean;
};

export function classifyInput(raw: string, options: GateOptions = {}): GateDecision {
  const { lexicon = [], hasContext = false } = options;
  const block = (reason: GateReason): GateDecision => ({
    allow: false,
    reason,
    response: GATE_RESPONSES[reason],
  });

  if (typeof raw !== "string") return block("empty");
  if (raw.length > MAX_INPUT_LENGTH) return block("too_long");

  const normalized = normalize(raw);
  if (normalized.length === 0) return block("empty");
  if (isEmojiOnly(normalized)) return block("emoji_only");

  const tokens = tokenize(normalized);
  if (tokens.length === 0) return block("gibberish");

  // Checked before scope: abuse is refused whether or not it is wrapped around a
  // real question, and never costs a model call.
  if (tokens.some((t) => PROFANITY_STEMS.some((stem) => t.startsWith(stem)))) {
    return block("profanity");
  }

  const terms = [...CORE_SCOPE_TERMS, ...lexicon];
  const inScope = hasScopeSignal(normalized, tokens, terms);

  // An explicit general-knowledge detour is refused even mid-conversation.
  if (hasOffTopicMarker(normalized) && !inScope) return block("off_topic");

  if (isGibberish(tokens)) return block("gibberish");

  // Whole-phrase small talk is matched before the WH check so that "how are you"
  // reads as a greeting while a bare "how?" stays a context-free question.
  if (SMALL_TALK_PHRASES.has(tokens.join(" "))) return block("greeting");

  const hasWhWord = tokens.some((t) => WH_WORDS.has(t));
  if (!hasWhWord && tokens.every((t) => SMALL_TALK.has(t))) return block("greeting");

  if (inScope) return { allow: true };

  // No recognisable subject from here on.
  //
  // An open conversation relaxes the *context-free* rule only: a follow-up made
  // purely of referring words ("which ones?", "and the second one?") is not
  // context-free, so it is allowed. Anything else is still refused.
  //
  // Regression: this used to allow ANY unrecognised input once a thread was
  // open, so typos and abuse ("hekki", "fuck") reached the model mid-conversation
  // even though they were correctly blocked as a first message.
  const allStructural = tokens.every((t) => WH_WORDS.has(t) || FILLER.has(t) || SMALL_TALK.has(t));
  if (allStructural) {
    return hasContext ? { allow: true } : block("vague_wh");
  }

  // A lone unrecognised word ("hekki") is noise rather than an off-topic
  // question, so it gets the short "I didn't catch that" redirect instead of the
  // fuller scope explanation, which is meant for things like sports scores.
  if (tokens.length === 1) return block("gibberish");

  return block("off_topic");
}
