import test from "node:test";
import assert from "node:assert/strict";
import { hasReservationIntent } from "../src/lib/chat/reservation.ts";
import { classifyInput } from "../src/lib/chat/gate.ts";

test("table-booking questions are detected", () => {
  for (const q of [
    "Can I book a table for four?",
    "How do I make a reservation?",
    "Do you take reservations?",
    "Is there a table available tonight?",
    "I'd like to reserve for Saturday",
    "Do you take walk-ins?",
    "Do you use Resy?",
    "How do I book?",
    "Any tables free at 8pm?",
  ]) {
    assert.equal(hasReservationIntent(q), true, `should detect: "${q}"`);
  }
});

test("private-service enquiries are NOT sent to Resy", () => {
  // These route to the team under the services rule; a wedding enquiry must not
  // be handed to a restaurant table-booking page.
  for (const q of [
    "How do I book a private dining experience?",
    "Can I book Chef Amrit for a wedding?",
    "I want to book a dinner party at my home",
    "How do I book a corporate event?",
    "Can I book a personal chef?",
    "Do you do yacht dining bookings?",
    "How do I book catering?",
  ]) {
    assert.equal(hasReservationIntent(q), false, `should NOT offer Resy: "${q}"`);
  }
});

test("unrelated questions do not trigger the reservation action", () => {
  for (const q of [
    "What are the opening hours?",
    "Is the food halal?",
    "How much is the samosa?",
    "Who is Chef Amrit?",
    "Where is the restaurant?",
    "",
  ]) {
    assert.equal(hasReservationIntent(q), false, `should not detect: "${q}"`);
  }
});

test("detection is robust to case, punctuation and hyphenation", () => {
  assert.equal(hasReservationIntent("BOOK A TABLE"), true);
  assert.equal(hasReservationIntent("Do you take walk-ins?"), true);
  assert.equal(hasReservationIntent("Do you take walk ins?"), true);
  assert.equal(hasReservationIntent("  reservation?  "), true);
});

test("non-string and empty input are handled", () => {
  assert.equal(hasReservationIntent(undefined as unknown as string), false);
  assert.equal(hasReservationIntent("   "), false);
});

test("reservation questions also pass the input gate, so they reach a reply", () => {
  // The action is attached to the assistant's turn, which only exists if the
  // question was not blocked upstream.
  for (const q of ["Can I book a table for four?", "How do I make a reservation?", "Do you use Resy?"]) {
    const decision = classifyInput(q);
    assert.equal(decision.allow, true, `gate should allow: "${q}"`);
  }
});
