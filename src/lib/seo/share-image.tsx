import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import type { PageSeo } from "@/data/seo";

/**
 * The branded share card (Open Graph / Twitter image) every page uses.
 *
 * Typographic rather than photographic on purpose: a photograph rendered into
 * the PNG these cards must be would weigh around a megabyte, and link previews
 * that load slowly are often skipped. This one is a few dozen kilobytes and
 * carries the brand: chocolate ground, antique-gold hairlines, the Cormorant
 * serif the site uses for its headlines.
 *
 * The renderer cannot read .woff2, so static .woff cuts of the site's own fonts
 * live in src/fonts/og. They are read once, when the module loads.
 */

export const shareImageSize = { width: 1200, height: 630 };
export const shareImageType = "image/png";

const fontDir = join(process.cwd(), "src/fonts/og");
const fonts = Promise.all([
  readFile(join(fontDir, "cormorant-garamond-latin-300-normal.woff")),
  readFile(join(fontDir, "cormorant-garamond-latin-400-italic.woff")),
  readFile(join(fontDir, "manrope-latin-600-normal.woff")),
]);

const gold = "#e2bd6c";
const goldDeep = "#a87c40";
const ivory = "#f6efe2";

export async function renderShareImage(card: PageSeo["card"]) {
  const [serif, serifItalic, sans] = await fonts;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          // Warm at the top corner, falling to espresso — the light of the site's
          // dark sections, done as a linear gradient because the image renderer
          // draws radial ones with visible edges.
          background: "linear-gradient(135deg, #1c110b 0%, #24160e 40%, #3a2616 78%, #5a3f22 100%)",
          color: ivory,
          fontFamily: "Manrope",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 24,
            left: 24,
            width: 1152,
            height: 582,
            border: "1px solid rgba(226,189,108,0.3)",
            borderRadius: 28,
            display: "flex",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 9999,
              border: `1.5px solid ${gold}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: gold,
              fontFamily: "Cormorant Italic",
              fontSize: 30,
            }}
          >
            A
          </div>
          <div style={{ display: "flex", fontSize: 17, letterSpacing: 5, textTransform: "uppercase", color: gold }}>{card.eyebrow}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontFamily: "Cormorant", fontSize: 104, lineHeight: 1, letterSpacing: -1 }}>{card.title}</div>
          {card.accent && (
            <div style={{ display: "flex", fontFamily: "Cormorant Italic", fontSize: 104, lineHeight: 1.05, color: gold }}>{card.accent}</div>
          )}
          <div style={{ display: "flex", marginTop: 34, width: 140, height: 2, background: `linear-gradient(90deg, ${gold}, ${goldDeep}, rgba(168,124,64,0))` }} />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 18, letterSpacing: 3, textTransform: "uppercase" }}>
          <div style={{ display: "flex", color: "rgba(246,239,226,0.72)" }}>Chef Amrit Pal Singh · Angel Indian Restaurant</div>
          <div style={{ display: "flex", color: gold }}>Michelin Bib Gourmand</div>
        </div>
      </div>
    ),
    {
      ...shareImageSize,
      fonts: [
        { name: "Cormorant", data: serif, weight: 300, style: "normal" },
        { name: "Cormorant Italic", data: serifItalic, weight: 400, style: "italic" },
        { name: "Manrope", data: sans, weight: 600, style: "normal" },
      ],
    },
  );
}
