import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { site } from "@/data/site";
import { seo } from "@/data/seo";
import { buildMetadata } from "@/lib/seo/metadata";
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

/**
 * Site-wide defaults. Every public page overrides the title, description,
 * canonical URL and share blocks through `buildMetadata`; what is set here is
 * what those pages do not: the base URL that turns relative paths absolute,
 * crawler directives, authorship and search-console verification.
 */
export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  // The home page's copy as the fallback for routes that set none. The canonical
  // is dropped here: inherited, it would point the 404, the thank-you page and
  // the dashboard at the home page. Each public page sets its own.
  ...buildMetadata({ seo: seo.home, path: "/" }),
  alternates: undefined,
  applicationName: site.name,
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  publisher: site.name,
  category: "food",
  formatDetection: { telephone: false, address: false, email: false },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  // Set these in the hosting environment once the domain is added to Google
  // Search Console and Bing Webmaster Tools; unset, no tag is written.
  verification: {
    ...(process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : {}),
    ...(process.env.BING_SITE_VERIFICATION ? { other: { "msvalidate.01": process.env.BING_SITE_VERIFICATION } } : {}),
  },
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
 * stylesheet and the visit counter (which excludes `/admin` itself).
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${cormorant.variable} ${manrope.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <PageViewBeacon />
        {children}
      </body>
    </html>
  );
}
