import test from "node:test";
import assert from "node:assert/strict";
import { detectIntent, hasReservationIntent } from "../src/lib/chat/intent.ts";
import { classifyInput } from "../src/lib/chat/gate.ts";

const intentOf = (q: string) => detectIntent(q)?.intent ?? null;

test("table bookings route to Resy", () => {
  for (const q of [
    "I want to book a table",
    "I want to book a table tonight.",
    "Can I book for tonight?",
    "Can I reserve a table?",
    "Do you have availability Saturday?",
    "Can I get a table tonight?",
    "I want to make a booking",
    "Do you take reservations?",
    "Do you use Resy?",
    "Do you take walk-ins?",
  ]) {
    assert.equal(intentOf(q), "resy", `should be resy: "${q}"`);
  }
});

test("celebrations and events route to the enquiry form, not Resy", () => {
  for (const q of [
    "I want to celebrate my birthday",
    "Can I host an anniversary dinner?",
    "I want to plan a private event",
    "Do you have birthday packages?",
    "We're planning an engagement dinner",
    "Can you cater a family gathering?",
    "I'd like to arrange a wedding reception",
    "Looking for a private dining room",
  ]) {
    assert.equal(intentOf(q), "event", `should be event: "${q}"`);
  }
});

test("an explicit table request wins even when an occasion is mentioned", () => {
  // The spec's decisive case: a table booking is a reservation, whatever it is for.
  for (const q of [
    "Can I book a table for my birthday?",
    "I want to book a table for my anniversary",
    "Reserve a table for our engagement dinner",
  ]) {
    assert.equal(intentOf(q), "resy", `should be resy: "${q}"`);
  }
});

test("the occasion preselects the matching experience in the contact wizard", () => {
  const cases: [string, string | undefined][] = [
    ["I'd like to arrange a wedding reception", "weddings"],
    ["Can we host a corporate dinner?", "corporate-events"],
    ["I want to plan a private dining evening", "private-dining"],
    ["Do you do yacht dining?", "villa-yacht-dining"],
    ["Can I hire a personal chef?", "personal-chef"],
    ["I want to celebrate my birthday", "dinner-parties"],
    // No identifiable occasion: hand off without presetting anything.
    ["I'd like to enquire about an event", undefined],
  ];
  for (const [q, experience] of cases) {
    const match = detectIntent(q);
    assert.equal(match?.intent, "event", `should be event: "${q}"`);
    assert.equal(match?.experience, experience, `wrong experience for "${q}"`);
  }
});

test("a bare follow-up keeps the conversation's handoff", () => {
  const previous = detectIntent("I want to celebrate my birthday");
  assert.equal(previous?.intent, "event");

  for (const q of ["How do I do that?", "how do i arrange that", "Tell me more", "What next?"]) {
    const match = detectIntent(q, { previous });
    assert.equal(match?.intent, "event", `follow-up lost event context: "${q}"`);
    assert.equal(match?.experience, "dinner-parties");
  }

  // The same carry works for reservations.
  const table = detectIntent("Can I reserve a table?");
  assert.equal(detectIntent("How do I do that?", { previous: table })?.intent, "resy");
});

test("a follow-up with no prior handoff offers nothing", () => {
  assert.equal(detectIntent("How do I do that?"), null);
  assert.equal(detectIntent("Tell me more"), null);
});

test("ordinary questions offer no call to action", () => {
  for (const q of [
    "What are the opening hours?",
    "Is the food halal?",
    "How much is the samosa?",
    "Who is Chef Amrit?",
    "What is on the menu?",
    // Regression: these tripped booking terms that were too generic —
    // "opening hours" on "opening", and menu questions on "do you have any"
    // and "get a".
    "What are the opening hours?",
    "Do you have any vegetarian dishes?",
    "Can I get a samosa?",
    "What are your opening times?",
    "",
  ]) {
    assert.equal(detectIntent(q), null, `should offer nothing: "${q}"`);
  }
});

test("only one call to action is ever offered", () => {
  // detectIntent returns a single match, so a reply can never show both buttons.
  const match = detectIntent("Can I book a table for my birthday?");
  assert.equal(match?.intent, "resy");
  assert.ok(!Array.isArray(match));
});

test("detection is robust to case, punctuation and hyphenation", () => {
  assert.equal(intentOf("BOOK A TABLE"), "resy");
  assert.equal(intentOf("Do you take walk-ins?"), "resy");
  assert.equal(intentOf("  birthday celebration?  "), "event");
});

test("non-string and empty input are handled", () => {
  assert.equal(detectIntent(undefined as unknown as string), null);
  assert.equal(detectIntent("   "), null);
  assert.equal(hasReservationIntent("Can I reserve a table?"), true);
  assert.equal(hasReservationIntent("I want to celebrate my birthday"), false);
});

test("reservation and event questions both pass the input gate", () => {
  // The call to action lives on the assistant's turn, which only exists if the
  // question was not refused upstream.
  for (const q of [
    "Can I book a table for four?",
    "I want to celebrate my birthday",
    "Can I host an anniversary dinner?",
    "Do you have birthday packages?",
  ]) {
    assert.equal(classifyInput(q).allow, true, `gate should allow: "${q}"`);
  }
});

test("a date continues whatever was already being arranged", () => {
  // Behavioural regression: "I want to host a birthday event" followed by
  // "What about October 15?" lost the celebration handoff entirely — the second
  // turn matched no booking or occasion word, so the button vanished.
  const event = { intent: "event", experience: "dinner-parties" } as const;
  for (const q of [
    "What about October 15?",
    "Can I do it in October?",
    "What about tomorrow?",
    "Can I do it on Saturday?",
    "Is next Saturday possible?",
  ]) {
    assert.deepEqual(detectIntent(q, { previous: event }), event, `event context lost on "${q}"`);
  }

  const table = { intent: "resy" } as const;
  for (const q of ["What about October 15?", "What about Saturday?", "What about tomorrow?"]) {
    assert.deepEqual(detectIntent(q, { previous: table }), table, `table context lost on "${q}"`);
  }
});

test("a date carries the previous handoff, it does not invent one", () => {
  // With no conversation behind it, a bare date is not a booking request.
  for (const q of ["What about October 15?", "What about tomorrow?", "Can I do it on Saturday?"]) {
    assert.equal(detectIntent(q), null, `"${q}" must not conjure a handoff from nothing`);
  }
});

test("a follow-up with its own subject does not inherit the old handoff", () => {
  // The carry-forward is for bare continuations. A question that changes the
  // subject must not keep showing a reservation button.
  const event = { intent: "event", experience: "dinner-parties" } as const;
  for (const q of ["What vegetarian dishes do you have?", "Who is the chef?", "Where are you located?"]) {
    assert.equal(detectIntent(q, { previous: event }), null, `"${q}" should not inherit the event handoff`);
  }
});

test("asking who made this website hands off to Aceva Tech", () => {
  // The studio credited in the footer. The reply is one fixed sentence; the
  // button is what carries the visitor to them.
  for (const q of [
    "Who built this website?",
    "who made this site",
    "Tell me about Aceva",
    "aceva?",
    "designers behind this website",
    "contact the developers",
    "Who designed the website?",
    // Added on request: the assistant itself, the founder, the studio, its office.
    "who built you",
    "what is aceva",
    "where are aceva headquarter",
    "where is Aceva's head office?",
    "who is founder of this website",
  ]) {
    assert.deepEqual(detectIntent(q), { intent: "aceva" }, `"${q}" should hand off to Aceva`);
  }
});

test("a birthday with an age and a headcount is still an event enquiry", () => {
  // "40th" and "30" are an age and a party size; the handoff rests on "birthday".
  assert.deepEqual(
    detectIntent("I want to host my 40th birthday dinner for 30 guests"),
    { intent: "event", experience: "dinner-parties" },
  );
});
