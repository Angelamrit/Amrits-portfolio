import test from "node:test";
import assert from "node:assert/strict";
import { parseInline, parseMarkdown } from "../src/lib/chat/markdown.ts";

const text = (spans: { text: string }[]) => spans.map((s) => s.text).join("");

test("plain text is a single paragraph with no bold", () => {
  const blocks = parseMarkdown("Angel is open Tuesday to Sunday.");
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].type, "paragraph");
  if (blocks[0].type === "paragraph") {
    assert.equal(text(blocks[0].spans), "Angel is open Tuesday to Sunday.");
    assert.ok(blocks[0].spans.every((s) => !s.bold));
  }
});

test("bold markers are consumed, never printed", () => {
  const spans = parseInline("The **Samosa** is $5.99.");
  assert.equal(text(spans), "The Samosa is $5.99.");
  assert.deepEqual(
    spans.map((s) => [s.text, s.bold]),
    [["The ", false], ["Samosa", true], [" is $5.99.", false]],
  );
  assert.ok(!text(spans).includes("*"));
});

test("an unclosed bold marker reads as bold, so streaming never flashes asterisks", () => {
  // Regression: this is the partial state a reply passes through on every chunk.
  for (const partial of ["**Vegetarian", "The **Sam", "a **b** and **c"]) {
    const spans = parseInline(partial);
    assert.ok(!text(spans).includes("*"), `raw asterisk leaked from "${partial}"`);
  }
  const spans = parseInline("**Vegetarian Appetizers");
  assert.equal(spans.length, 1);
  assert.equal(spans[0].bold, true);
});

test("unordered lists become real list blocks", () => {
  const blocks = parseMarkdown("Options:\n\n- Samosa\n- Aloo Tikki Chat\n* Kale Pakora");
  assert.equal(blocks.length, 2);
  assert.equal(blocks[0].type, "paragraph");
  assert.equal(blocks[1].type, "list");
  if (blocks[1].type === "list") {
    assert.equal(blocks[1].ordered, false);
    assert.equal(blocks[1].items.length, 3);
    assert.deepEqual(blocks[1].items.map(text), ["Samosa", "Aloo Tikki Chat", "Kale Pakora"]);
  }
});

test("numbered lists are ordered, and both marker styles work", () => {
  for (const src of ["1. First\n2. Second", "1) First\n2) Second"]) {
    const blocks = parseMarkdown(src);
    assert.equal(blocks.length, 1);
    assert.equal(blocks[0].type, "list");
    if (blocks[0].type === "list") {
      assert.equal(blocks[0].ordered, true);
      assert.deepEqual(blocks[0].items.map(text), ["First", "Second"]);
    }
  }
});

test("bold inside a list item is parsed, not printed", () => {
  const blocks = parseMarkdown("- **Samosa** ($5.99) — crispy pastry");
  assert.equal(blocks[0].type, "list");
  if (blocks[0].type === "list") {
    const item = blocks[0].items[0];
    assert.equal(text(item), "Samosa ($5.99) — crispy pastry");
    assert.equal(item[0].bold, true);
  }
});

test("switching list type starts a new list rather than mixing markers", () => {
  const blocks = parseMarkdown("- one\n- two\n1. three");
  assert.equal(blocks.length, 2);
  if (blocks[0].type === "list" && blocks[1].type === "list") {
    assert.equal(blocks[0].ordered, false);
    assert.equal(blocks[1].ordered, true);
  }
});

test("a realistic menu answer renders with no markup left over", () => {
  const reply = [
    "Here are the vegetarian options on the current menu snapshot:",
    "",
    "**Vegetarian Appetizers**",
    "- Aloo Tikki Chat ($11.99) — Potatoes, tamarind, turmeric",
    "- Samosa ($5.99) — Crispy pastry stuffed with chilli potatoes",
    "",
    "Prices are subject to change.",
  ].join("\n");

  const blocks = parseMarkdown(reply);
  const rendered = blocks
    .map((b) => (b.type === "list" ? b.items.map(text).join(" ") : text(b.spans)))
    .join(" ");

  assert.ok(!rendered.includes("**"), "bold markers survived");
  assert.ok(!/^\s*-\s/m.test(rendered), "bullet markers survived");
  assert.ok(rendered.includes("Aloo Tikki Chat ($11.99)"));
  assert.ok(rendered.includes("Prices are subject to change."));
  assert.equal(blocks.filter((b) => b.type === "list").length, 1);
});

test("content is preserved exactly, only markup is removed", () => {
  const reply = "Angel is **100% Halal**.\n\n- Open Tuesday to Sunday\n- Closed Monday";
  const blocks = parseMarkdown(reply);
  const all = blocks
    .map((b) => (b.type === "list" ? b.items.map(text).join("\n") : text(b.spans)))
    .join("\n");
  assert.equal(all, "Angel is 100% Halal.\nOpen Tuesday to Sunday\nClosed Monday");
});

test("headings are parsed, not printed as hashes", () => {
  // Regression: the model emitted "### Vegetarian Appetizers" despite the prompt
  // asking for no headings, and the hashes rendered literally.
  const blocks = parseMarkdown("### Vegetarian Appetizers\n- Samosa ($5.99)");
  assert.equal(blocks.length, 2);
  assert.equal(blocks[0].type, "heading");
  if (blocks[0].type === "heading") assert.equal(text(blocks[0].spans), "Vegetarian Appetizers");
  assert.equal(blocks[1].type, "list");

  for (const src of ["# One", "## Two", "###### Six", "## Closed ##"]) {
    const [block] = parseMarkdown(src);
    assert.equal(block.type, "heading", `"${src}" should parse as a heading`);
    if (block.type === "heading") assert.ok(!text(block.spans).includes("#"));
  }
});

test("no markup character of any supported kind survives a full reply", () => {
  const reply = "### Starters\n\n**Samosa** ($5.99)\n\n- Crispy pastry\n1. Also numbered";
  const rendered = parseMarkdown(reply)
    .map((b) => (b.type === "list" ? b.items.map(text).join(" ") : text(b.spans)))
    .join(" ");
  assert.ok(!rendered.includes("**"));
  assert.ok(!rendered.includes("#"));
  assert.ok(!/^\s*[-*]\s/m.test(rendered));
});

test("empty and whitespace input produce no blocks", () => {
  assert.deepEqual(parseMarkdown(""), []);
  assert.deepEqual(parseMarkdown("   \n\n  "), []);
});

test("every prefix of a streamed reply parses without throwing or leaking markup", () => {
  const reply = "Here are options:\n\n**Starters**\n- Samosa ($5.99)\n- Kale Pakora ($10.99)";
  for (let i = 1; i <= reply.length; i++) {
    const blocks = parseMarkdown(reply.slice(0, i));
    const rendered = blocks
      .map((b) => (b.type === "list" ? b.items.map(text).join(" ") : text(b.spans)))
      .join(" ");
    assert.ok(!rendered.includes("**"), `asterisks visible at prefix length ${i}`);
  }
});
