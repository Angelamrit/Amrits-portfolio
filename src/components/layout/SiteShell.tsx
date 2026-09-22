import { personJsonLd, restaurantJsonLd } from "@/lib/seo/jsonld";
import { getVenue } from "@/lib/content/venue";
import { VenueProvider } from "./VenueContext";
import { Backdrop } from "./Backdrop";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { SkipLink } from "./SkipLink";
import { StickyBookCta } from "./StickyBookCta";
import { PageTransition } from "./PageTransition";

/**
 * Everything that wraps a page of the public site: the oak backdrop, the
 * navigation, the footer, the sticky booking prompt and the curtain wipe
 * between pages.
 *
 * This used to live directly in the root layout, which was fine while every
 * route on the site was a page a guest could see. The admin dashboard is not —
 * it needs the fonts, the stylesheet and the motion providers, and none of the
 * chrome — so the chrome moved down here, where it can be applied to the
 * `(site)` group and to the 404 without also being applied to `/admin`.
 *
 * It is a component rather than only a layout because `app/not-found.tsx` has
 * to sit at the app root to catch unmatched URLs, which puts it outside the
 * `(site)` group and so outside that group's layout. Rendering the shell here
 * keeps the 404 looking like part of the site instead of a bare page.
 */
export async function SiteShell({ children }: { children: React.ReactNode }) {
  const venue = await getVenue();
  const jsonLd = [personJsonLd(venue), restaurantJsonLd(venue)];
  return (
    <VenueProvider value={venue}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <Backdrop />
      <SkipLink />
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
      <StickyBookCta />
      <PageTransition />
    </VenueProvider>
  );
}
