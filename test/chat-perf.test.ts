import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/**
 * Architectural guarantees behind the chat panel's responsiveness.
 *
 * Deliberately not timing assertions: the wait is dominated by Gemini's
 * thinking phase, which varies from about three to nine seconds, and a test
 * that pinned a number would fail on upstream load rather than on a regression.
 * What is asserted here are the properties that make the UI feel immediate and
 * that a refactor could silently break.
 */

const read = (p: string) => readFileSync(new URL(p, import.meta.url), "utf8");
const route = read("../src/app/api/chat/route.ts");
const useChat = read("../src/components/chat/useChat.ts");
const message = read("../src/components/chat/ChatMessage.tsx");
const css = read("../src/app/globals.css");

test("the server streams each chunk as it arrives instead of buffering the answer", () => {
  // Measured: time-to-first-byte at the route matches raw SDK time-to-first-
  // token, and the streaming window is 55-700ms. That only holds while the
  // enqueue happens inside the loop. Collecting chunks into a string and
  // sending at the end would add the whole generation to the visible wait.
  const loop = route.slice(route.indexOf("for await (const chunk of stream)"));
  const enqueueAt = loop.indexOf("controller.enqueue");
  const closeAt = loop.indexOf("controller.close()");
  assert.ok(enqueueAt > -1, "the stream loop must enqueue");
  assert.ok(enqueueAt < closeAt, "chunks must be enqueued before the stream closes");
  assert.match(
    loop.slice(0, enqueueAt),
    /const text = chunk\.text;\s*\r?\n\s*if \(text\)/,
    "each chunk should be forwarded directly, not accumulated first",
  );
  assert.doesNotMatch(
    loop.slice(0, closeAt),
    /(?:body|buffer|full|whole)\s*\+=/,
    "the route must not accumulate the response before sending it",
  );
});

test("no settled reply can be empty, so the thinking dots always clear", () => {
  // The dots render whenever an assistant turn's text is empty. An empty
  // settle would therefore leave them animating for ever with no reply coming.
  // Regression: the `!response.body` branch passed the body through verbatim.
  const settles = [...useChat.matchAll(/settle\(([^;]+)\);/g)].map((m) => m[1]);
  assert.ok(settles.length >= 3, `expected the three settle sites, found ${settles.length}`);
  for (const arg of settles) {
    assert.match(
      arg,
      /\|\|\s*NETWORK_ERROR|\?[^:]+:\s*NETWORK_ERROR/,
      `every settle must fall back to a message: ${arg}`,
    );
  }
});

test("the aborted request drops its turn rather than settling it empty", () => {
  const abort = useChat.slice(useChat.indexOf('error.name === "AbortError"'));
  assert.match(
    abort.slice(0, 400),
    /prev\.filter\(\(t\) => t\.id !== replyId && t\.id !== askedId\)/,
    "an abort must remove the pending turn, not leave it blank",
  );
});

test("the thinking indicator shows only while the reply is empty", () => {
  // This is what ties the dots to the stream: they are the else-branch of the
  // turn having text, so the first chunk removes them with no extra state.
  assert.match(
    message,
    /\{turn\.text \?[\s\S]{0,900}\) : \([\s\S]{0,400}role="status" aria-label="Thinking"/,
    "the dots must be the empty-text branch of the bubble",
  );
});

test("the dots use their own animation, not the 3s ambient pulse", () => {
  // Regression: the indicator borrowed --animate-pulse-glow, a 3s breathe
  // shared with the live-dot treatment. A 160ms stagger across 3000ms is a 5%
  // phase offset, so the three dots moved together and a seven-second wait
  // looked stalled.
  assert.match(message, /animate-chat-thinking/, "the dots must use the dedicated animation");
  assert.doesNotMatch(message, /animate-pulse-glow/, "the 3s ambient pulse reads as frozen here");
  assert.match(css, /--animate-chat-thinking:\s*chat-thinking 1\.4s/, "the token must exist and stay brisk");
  assert.match(css, /@keyframes chat-thinking/, "the keyframe must exist");
});

test("the dots animate only compositor properties", () => {
  // Three elements animating for up to nine seconds. opacity and transform are
  // composited; animating width, height or a colour would repaint each frame.
  const kf = css.slice(css.indexOf("@keyframes chat-thinking"));
  const block = kf.slice(0, kf.indexOf("}", kf.indexOf("40%")) + 40);
  const props = [...block.matchAll(/^\s*([a-z-]+):/gm)].map((m) => m[1]);
  assert.deepEqual(
    [...new Set(props)].sort(),
    ["opacity", "transform"],
    `only opacity and transform may animate, found ${props}`,
  );
});

test("reduced motion stills the dots without hiding them", () => {
  // The global rule collapses every animation. The dots must therefore be
  // legible in their unanimated state: the keyframe carries the faded opacity,
  // never the element's base style, so they settle at full strength.
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]{0,200}animation-duration: 0\.01ms/);
  assert.doesNotMatch(message, /opacity-[0-9]/, "the dots must not be faded outside the animation");
});
