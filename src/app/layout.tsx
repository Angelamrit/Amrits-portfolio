import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { site } from "@/data/site";
import { buildMetadata } from "@/lib/seo/metadata";
import { personJsonLd, restaurantJsonLd } from "@/lib/seo/jsonld";
import { Providers } from "@/components/layout/Providers";
import { Backdrop } from "@/components/layout/Backdrop";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SkipLink } from "@/components/layout/SkipLink";
import { StickyBookCta } from "@/components/layout/StickyBookCta";
import { PageTransition } from "@/components/layout/PageTransition";

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = [personJsonLd(), restaurantJsonLd()];
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${cormorant.variable} ${manrope.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
        <Backdrop />
        <Providers>
          <SkipLink />
          <Header />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer />
          <StickyBookCta />
          <PageTransition />
        </Providers>
      </body>
    </html>
  );
}
