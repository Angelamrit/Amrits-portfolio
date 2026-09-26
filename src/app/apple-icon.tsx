import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

/**
 * Home-screen icon for iPhone and iPad (and a crisp raster icon for any
 * crawler that ignores SVG). The site's italic "A" monogram in antique gold
 * on chocolate, matching the favicon and the share cards.
 */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const italic = readFile(join(process.cwd(), "src/fonts/og/cormorant-garamond-latin-400-italic.woff"));

export default async function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #2c1b12, #1f130d)",
        }}
      >
        <div
          style={{
            width: 132,
            height: 132,
            borderRadius: 9999,
            border: "2px solid #c9a35f",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#e2bd6c",
            fontFamily: "Cormorant Italic",
            fontSize: 96,
            paddingBottom: 8,
          }}
        >
          A
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "Cormorant Italic", data: await italic, weight: 400, style: "italic" }] },
  );
}
