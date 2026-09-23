import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { site } from "@/data/site";
import { buildMetadata } from "@/lib/seo/metadata";
import { Providers } from "@/components/layout/Providers";
import { PageViewBeacon } from "@/components/analytics/PageViewBeacon";

// Self-hosted variable fonts (Fontsource builds of the Google Fonts originals).
const cormorant = localFont({
  variable: "--font-cormorant",
  display: "swap",
  src: [
    { path: "../fonts/cormorant-garamond-latin-wght-normal.woff2", weight: "300 700", style: "normal" },
    { path: "../fonts/cormorant-garamond-latin-wght-italic.woff2", weight: "300 700", style: "italic" },
  ],
});

const manrope = localFont({
  variable: "--font-manrope",
  display: "swap",
  src: [{ path: "../fonts/manrope-latin-wght-normal.woff2", weight: "200 800", style: "normal" }],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    template: `%s | ${site.name}`,
    default: `${site.name} — Owner & Head Chef, Angel Indian Restaurant`,
  },
  ...buildMetadata(),
};

export const viewport: Viewport = {
  themeColor: "#2c1b12",
  colorScheme: "dark",
};

/**
 * The document, and nothing else.
 *
 * The public site's navigation, footer, backdrop and page transition used to
 * be here. They now live in `SiteShell`, applied by the `(site)` group layout,
 * because the admin dashboard is a route on this same app that must not
 * inherit any of it. What is left is genuinely shared by both: the fonts, the
 * stylesheet, and the motion/smooth-scroll providers.
 *
 * The visit counter sits deliberately *outside* `Providers`. `Providers`
 * decides whether to enable smooth scrolling only after it has mounted, and
 * turning it on swaps the element wrapping its children, which remounts
 * everything below. Anything under there that must run once per page — this
 * counter above all — would run twice. It excludes `/admin` itself.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${cormorant.variable} ${manrope.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <PageViewBeacon />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
