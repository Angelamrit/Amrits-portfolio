/**
 * Minimal Markdown parser for assistant replies.
 *
 * The model returns light Markdown — bold labels and bullet or numbered lists —
 * and rendering it as plain text printed the syntax literally (a single menu
 * answer showed 26 raw asterisks). This turns that subset into a structure the
 * renderer can map onto React elements, so nothing is ever injected as HTML.
 *
 * Deliberately small: bold, unordered lists, ordered lists, paragraphs. Anything
 * else is left as literal text rather than guessed at.
 *
 * Streaming matters here. Replies arrive a chunk at a time, so this is called on
 * every partial string and must behave sensibly mid-token — see the odd-marker
 * handling in `parseInline`.
 */

export type Span = { text: string; bold: boolean };

export type Block =
  | { type: "paragraph"; spans: Span[] }
  | { type: "heading"; spans: Span[] }
  | { type: "list"; ordered: boolean; items: Span[][] };

const UNORDERED = /^\s*[-*+]\s+(.*)$/;
const ORDERED = /^\s*\d+[.)]\s+(.*)$/;
/**
 * The prompt asks for no headings, but the model still emits `### Section` when
 * grouping a long menu answer. Parsing them is the safety net: unhandled, the
 * hashes printed literally, which is the same defect as the raw asterisks.
 */
const HEADING = /^\s{0,3}#{1,6}\s+(.*?)\s*#*\s*$/;

/**
 * Splits a line into bold and plain runs.
 *
 * Text is split on the `**` delimiter, which leaves alternating runs: even
 * indices are plain, odd indices are bold. An unclosed trailing `**` therefore
 * reads as bold-until-the-end, which is what keeps a streaming reply from
 * flashing raw asterisks between the opening and closing markers.
 */
export function parseInline(text: string): Span[] {
  const parts = text.split("**");
  const spans: Span[] = [];

  for (const [i, part] of parts.entries()) {
    if (part === "") continue;
    spans.push({ text: part, bold: i % 2 === 1 });
  }

  return spans.length > 0 ? spans : [{ text: "", bold: false }];
}

export function parseMarkdown(input: string): Block[] {
  const blocks: Block[] = [];
  const lines = input.split("\n");

  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    const text = paragraph.join("\n").trim();
    if (text) blocks.push({ type: "paragraph", spans: parseInline(text) });
    paragraph = [];
  };

  const flushList = () => {
    if (!list) return;
    blocks.push({
      type: "list",
      ordered: list.ordered,
      items: list.items.map((item) => parseInline(item)),
    });
    list = null;
  };

  for (const line of lines) {
    const heading = HEADING.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      const content = heading[1].trim();
      if (content) blocks.push({ type: "heading", spans: parseInline(content) });
      continue;
    }

    const unordered = UNORDERED.exec(line);
    const ordered = unordered ? null : ORDERED.exec(line);

    if (unordered || ordered) {
      flushParagraph();
      const isOrdered = Boolean(ordered);
      // A change of list type starts a new list rather than mixing markers.
      if (list && list.ordered !== isOrdered) flushList();
      list ??= { ordered: isOrdered, items: [] };
      list.items.push((unordered ?? ordered)![1]);
      continue;
    }

    if (line.trim() === "") {
      flushParagraph();
      flushList();
      continue;
    }

    flushList();
    paragraph.push(line);
  }

  flushParagraph();
  flushList();

  return blocks;
}
