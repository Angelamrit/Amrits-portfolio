import type { MetadataRoute } from "next";
import { site } from "@/data/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${site.name} · Angel Indian Restaurant`,
    short_name: site.shortName,
    description: site.description,
    start_url: "/",
    display: "standalone",
    // The brand's chocolate, matching the header and the viewport theme colour.
    background_color: "#1f130d",
    theme_color: "#2c1b12",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
