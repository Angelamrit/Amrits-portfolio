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

test("the button follows the workflow the answer names when the guess disagrees", () => {
  // "Book a table for a wedding party of 40" guessed Resy on "book" + "table",
  // but the answer sent the wedding to the enquiry form — a Reserve a Table
  // button under words saying "Plan Your Celebration".
  assert.deepEqual(
    ctaForReply({ intent: "resy" }, "For a wedding party of 40 the team will help plan it — the Plan Your Celebration button opens the enquiry form."),
    { intent: "event" },
  );
  assert.deepEqual(
    ctaForReply({ intent: "event", experience: "dinner-parties" }, "A table for two is a reservation — tap Reserve a Table and pick your date on Resy."),
    { intent: "resy" },
  );
});

test("the button keeps its guess when the answer names both workflows or neither", () => {
  const both = "Tables go through Resy; for the party itself use Plan Your Celebration.";
  assert.deepEqual(ctaForReply({ intent: "resy" }, both), { intent: "resy" });
  assert.deepEqual(ctaForReply({ intent: "event" }, both), { intent: "event" });
  assert.deepEqual(ctaForReply({ intent: "resy" }, "We'd love to have you."), { intent: "resy" });
  // "Resy" is matched as a word, so "Resync" or a URL fragment does not count.
  assert.deepEqual(ctaForReply({ intent: "event" }, "Plan Your Celebration — see resyncing"), { intent: "event" });
});

test("the Aceva handoff is never swapped by the answer's wording", () => {
  assert.deepEqual(
    ctaForReply({ intent: "aceva" }, "This website was designed and built by Aceva Tech. Reserve a Table is beside the reply."),
    { intent: "aceva" },
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
  assert.equal(buttons.length, 3, "all three handoffs are Buttons");
  for (const b of buttons) {
    assert.match(b, /icon=\{false\}/, `the arrow does not fit this width: ${b}`);
    assert.match(b, /className=\{ctaClass\}/, "every handoff must look the same");
  }
});

test("the Aceva handoff is a Visit Aceva Tech button to the studio's site", () => {
  const source = readFileSync(new URL("../src/components/chat/ChatMessage.tsx", import.meta.url), "utf8");
  const cta = source.slice(source.indexOf("function ChatCta"), source.indexOf("export function ChatMessage"));
  const aceva = cta.slice(cta.indexOf('cta.intent === "aceva"'));
  assert.match(aceva.slice(0, 400), /href=\{ACEVA_URL\}/, "the button must link to the studio");
  assert.match(aceva.slice(0, 400), /Visit Aceva Tech/, "the label is Visit Aceva Tech");
  assert.match(source, /ACEVA_URL/, "the URL is the single exported constant, not a string typed twice");
});
