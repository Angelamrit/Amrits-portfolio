/**
 * Caps how sharp a photograph is downloaded on very dense phone screens.
 *
 * A browser picks a file from an image's `srcset` by multiplying the slot
 * width in `sizes` by the screen's pixel density. Most phones are 2.6x to 3x,
 * so a photograph 390px wide on screen was fetched as the 1080px or 1200px
 * file: on a 3x phone the home page came to 2.6MB of photographs, against
 * 1.4MB for the same page on a 2x screen. Beyond 2x the eye cannot tell the
 * difference on a photograph (Next's own image code says as much about 3x
 * OLED panels), but the wait is real, and on this site every byte crosses
 * from a server in Mumbai to guests in New York.
 *
 * So each `sizes` entry gains two variants in front of it for dense screens,
 * reporting a slot narrow enough that the file picked lands near 2x:
 *
 *   (min-width: 768px) 28rem, 20rem
 * becomes
 *   (min-width: 768px) and (min-resolution: 2.75dppx) calc(28rem * 2 / 3),
 *   (min-width: 768px) and (min-resolution: 2.25dppx) calc(28rem * 0.8),
 *   (min-width: 768px) 28rem,
 *   (min-resolution: 2.75dppx) calc(20rem * 2 / 3),
 *   (min-resolution: 2.25dppx) calc(20rem * 0.8),
 *   20rem
 *
 * The browser takes the first entry that matches, so a 3x phone reads the
 * first variant, a 2.6x phone the second, and every other screen falls
 * through to the original entry untouched. A browser that does not know
 * `min-resolution` treats the variants as not matching and behaves exactly
 * as before. Only the `sizes` hint changes: layout comes from the CSS around
 * the picture, so nothing moves on screen.
 */

const DENSE = [
  { query: "(min-resolution: 2.75dppx)", scale: "2 / 3" },
  { query: "(min-resolution: 2.25dppx)", scale: "0.8" },
] as const;

/** Splits a `sizes` list on its top-level commas, leaving any inside `calc(...)` alone. */
function splitEntries(sizes: string): string[] {
  const entries: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < sizes.length; i++) {
    const ch = sizes[i];
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    else if (ch === "," && depth === 0) {
      entries.push(sizes.slice(start, i).trim());
      start = i + 1;
    }
  }
  entries.push(sizes.slice(start).trim());
  return entries.filter(Boolean);
}

/** One entry as its media condition (possibly empty) and its length. */
function parseEntry(entry: string): { condition: string; length: string } {
  const calc = entry.lastIndexOf("calc(");
  if (calc >= 0 && entry.endsWith(")")) {
    return { condition: entry.slice(0, calc).trim(), length: entry.slice(calc) };
  }
  const space = entry.lastIndexOf(" ");
  if (space < 0) return { condition: "", length: entry };
  return { condition: entry.slice(0, space).trim(), length: entry.slice(space + 1) };
}

const cache = new Map<string, string>();

export function capPixelDensity(sizes: string): string {
  const hit = cache.get(sizes);
  if (hit !== undefined) return hit;

  const out: string[] = [];
  for (const entry of splitEntries(sizes)) {
    const { condition, length } = parseEntry(entry);
    // A condition built with `or` or `not` cannot simply be joined with `and`;
    // such an entry is kept as it is rather than risk changing its meaning.
    const combinable = !/\b(or|not)\b/.test(condition);
    if (combinable) {
      for (const { query, scale } of DENSE) {
        out.push(`${condition ? `${condition} and ` : ""}${query} calc(${length} * ${scale})`);
      }
    }
    out.push(entry);
  }

  const result = out.join(", ");
  cache.set(sizes, result);
  return result;
}
