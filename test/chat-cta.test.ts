import test from "node:test";
import assert from "node:assert/strict";
import { ctaForReply, detectIntent } from "../src/lib/chat/intent.ts";
import { SCOPE_REPLY } from "../src/lib/chat/gate.ts";

/**
 * The handoff button is chosen from the visitor's wording before the answer
 * exists, so it does not flicker while the reply streams. That guess can be
 * wrong, and when the answer is the fixed refusal it must not carry a button.
 */

test("a refusal drops the celebration handoff it was optimistically given", () => {
  // Behavioural regression: "Do you cater?" is refused, because catering is not
  // one of the listed services — but the word "cater" had already matched, and
  // Plan Your Celebration rendered underneath the refusal sentence.
  assert.equal(detectIntent("Do you cater?")?.intent, "event", "premise: still reads as an event");
  assert.equal(
    ctaForReply({ intent: "event", experience: "dinner-parties" }, SCOPE_REPLY),
    undefined,
    "a refusal must not offer a celebration button",
  );
});

test("a refusal drops a reservation handoff too", () => {
  // "What experiences are available?" matched the booking term "availab".
  assert.equal(detectIntent("What experiences are available?")?.intent, "resy", "premise: reads as a booking");
  assert.equal(ctaForReply({ intent: "resy" }, SCOPE_REPLY), undefined, "a refusal must not offer Resy");
});

test("a real answer keeps its call to action", () => {
  assert.deepEqual(
    ctaForReply({ intent: "resy" }, "Reservations are handled through Resy — you can book your table there."),
    { intent: "resy" },
  );
  assert.deepEqual(
    ctaForReply({ intent: "event", experience: "weddings" }, "The team would love to help plan it."),
    { intent: "event", experience: "weddings" },
  );
});

test("a reply that never had a handoff is unaffected", () => {
  assert.equal(ctaForReply(undefined, SCOPE_REPLY), undefined);
  assert.equal(ctaForReply(undefined, "Angel is in Jackson Heights."), undefined);
});

test("only the exact refusal sentence withdraws the button", () => {
  // An answer that merely quotes the scope line must not be mistaken for one.
  assert.deepEqual(
    ctaForReply({ intent: "resy" }, "Ask me about Chef Amrit or Angel Indian Restaurant — and yes, you can book."),
    { intent: "resy" },
  );
});
