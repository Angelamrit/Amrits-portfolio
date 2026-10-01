import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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

test("the handoff button fits the bubble it is rendered in", () => {
  // The chat bubble is 85% of a panel that is 320px wide on a small phone, so
  // the button has roughly 220px of usable width. At the design system's 0.22em
  // tracking "Plan Your Celebration" measures 263px, which wrapped it onto two
  // lines and left the trailing arrow stranded beside the block — it read as a
  // misaligned icon rather than an affordance.
  //
  // Measured: 263px at 0.22em, 230px at 0.12em. Dropping the arrow and tightening
  // the tracking is what brings the label back onto one line.
  const source = readFileSync(new URL("../src/components/chat/ChatMessage.tsx", import.meta.url), "utf8");
  const cta = source.slice(source.indexOf("function ChatCta"), source.indexOf("export function ChatMessage"));

  assert.match(cta, /tracking-\[0\.12em\]/, "the in-chat CTA needs tighter tracking than a page button");
  const buttons = [...cta.matchAll(/<Button[^>]*>/g)].map((m) => m[0]);
  assert.equal(buttons.length, 2, "both handoffs are Buttons");
  for (const b of buttons) {
    assert.match(b, /icon=\{false\}/, `the arrow does not fit this width: ${b}`);
    assert.match(b, /className=\{ctaClass\}/, "both handoffs must look the same");
  }
});
