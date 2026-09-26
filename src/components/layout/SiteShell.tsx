import { siteGraph } from "@/lib/seo/jsonld";
import { JsonLd } from "@/components/seo/JsonLd";
import { PageEffects } from "./PageEffects";
import { getVenue } from "@/lib/content/venue";
import { VenueProvider } from "./VenueContext";
import { Backdrop } from "./Backdrop";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { SkipLink } from "./SkipLink";
import { NavigationSkeleton } from "./NavigationSkeleton";
import { ChatWidget } from "@/components/chat/ChatWidget";

/**
 * Everything that wraps a page of the public site: the oak backdrop, the
 * navigation and the footer. There is deliberately no transition between
 * pages: every route is pre-built and prefetched, so a link opens instantly,
 * and any animation placed in front of it would only add waiting.
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
/*
 * Shows whatever scroll-reveal content is already on the first screen as soon
 * as the HTML has been parsed — before React has loaded.
 *
 * Reveals are hidden in CSS until they are marked `data-shown`, and the React
 * side of that only runs after the page's JavaScript has arrived and hydrated:
 * on a phone that held headings on the first screen invisible for seconds.
 * This runs inline, after the stylesheets have applied, and marks only what is
 * in view; everything further down is left to the observer in PageEffects, so
 * it still reveals on scroll. It skips off-screen lazy sections without looking
 * inside them, because measuring inside one would force it to be rendered.
 */
const FIRST_SCREEN_REVEAL = `(function(){var h=window.innerHeight;document.querySelectorAll("[data-reveal],[data-reveal-group],[data-img-reveal]").forEach(function(e){var s=e.closest(".section-lazy");if(s&&s.getBoundingClientRect().top>h)return;var r=e.getBoundingClientRect();if(r.top<h*0.92&&r.bottom>0)e.setAttribute("data-shown","")})})();`;

export async function SiteShell({ children }: { children: React.ReactNode }) {
  const venue = await getVenue();
  return (
    <VenueProvider value={venue}>
      <JsonLd data={siteGraph(venue)} />
      <Backdrop />
      <SkipLink />
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      {/* Must stay directly after <main>: see FIRST_SCREEN_REVEAL. */}
      <script dangerouslySetInnerHTML={{ __html: FIRST_SCREEN_REVEAL }} />
      <Footer />
      {/* The assistant belongs to the public site, so it mounts here rather than
          in the root layout — which is what keeps it off /admin. */}
      <ChatWidget />
      <PageEffects />
      <NavigationSkeleton />
    </VenueProvider>
  );
}
