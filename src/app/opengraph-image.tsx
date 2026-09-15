import { ImageResponse } from "next/og";
import { chef } from "@/data/chef";

export const alt = `${chef.name} — Owner & Head Chef, Angel Indian Restaurant`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#14120f",
          color: "#f7f4ee",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 44,
              height: 44,
              border: "1.5px solid #b8975a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#b8975a",
              fontSize: 28,
              fontStyle: "italic",
            }}
          >
            A
          </div>
          <div style={{ fontSize: 18, letterSpacing: 6, textTransform: "uppercase", color: "#b8975a" }}>
            Michelin Guide · Bib Gourmand · Jackson Heights, Queens
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 112, fontWeight: 300, lineHeight: 0.95, letterSpacing: -2 }}>{chef.name}</div>
          <div style={{ marginTop: 28, width: 120, height: 1, background: "#b8975a" }} />
          <div style={{ marginTop: 28, fontSize: 30, color: "rgba(247,244,238,0.7)" }}>
            Owner & Head Chef, Angel Indian Restaurant — New York City
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
