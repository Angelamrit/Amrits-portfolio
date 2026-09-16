import test from "node:test";
import assert from "node:assert/strict";
import { cleanFieldValue } from "@/lib/sanitize";

const MAX = 4000;

test("a newline in a single-line field cannot forge a line in the enquiry email", () => {
  // The enquiry email renders each answer as one `Label: value` line, so a
  // newline here would let a guest invent a line the form never asked for.
  const forged = "Mallory\nBcc: attacker@example.com";
  const cleaned = cleanFieldValue(forged, MAX);

  assert.equal(cleaned, "Mallory Bcc: attacker@example.com");
  assert.ok(!cleaned.includes("\n"));
});

test("a carriage return is folded too, not just a newline", () => {
  assert.ok(!cleanFieldValue("Mallory\r\nBcc: x@example.com", MAX).includes("\n"));
  assert.ok(!cleanFieldValue("Mallory\rBcc: x@example.com", MAX).includes("\r"));
});

test("the message keeps its paragraphs but not a wall of blank lines", () => {
  const written = "We are celebrating an anniversary.\n\n\n\n\nEight guests, no nuts.";
  assert.equal(
    cleanFieldValue(written, MAX, { multiline: true }),
    "We are celebrating an anniversary.\n\nEight guests, no nuts.",
  );
});

test("control characters are removed", () => {
  assert.equal(cleanFieldValue("Am\u0000ri\u0007t\u001f", MAX), "Amrit");
});

test("a field of invisible spaces does not survive to pass a minimum length", () => {
  // Copy-pasted text arrives full of these; without folding them, a name of
  // non-breaking spaces would clear `min(2)` while looking empty.
  assert.equal(cleanFieldValue("\u00a0\u2007\u3000\u202f", MAX), "");
});

test("truncation happens before the rest, so a long field cannot be expensive", () => {
  assert.equal(cleanFieldValue("abcdefghij", 4), "abcd");
});

test("ordinary answers are left alone apart from trimming", () => {
  assert.equal(cleanFieldValue("  Amrit Pal Singh  ", MAX), "Amrit Pal Singh");
});
