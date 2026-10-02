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
import { ChatLauncher } from "@/components/chat/ChatLauncher";

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
 * Every scroll reveal on the site, run by this one inline script.
 *
 * Reveals are hidden in CSS until they are marked `data-shown`. That used to
 * be split in two: an inline script showed what was already on the first
 * screen, and the observer that revealed everything else lived in a React
 * component, so it only started once the page's JavaScript had arrived and
 * hydrated. On a phone that is a second or more, and a visitor who scrolls
 * straight away met blank space where the next section should have been.
 * Now the whole thing runs here, the moment the HTML has been parsed, with no
 * bundle to wait for; and because it is this small it costs nothing to inline.
 *
 * What it does, in order:
 *  - shows whatever is already in view at once, before the first paint;
 *  - reveals the rest as it scrolls in (`show`), with items inside a lazy
 *    section only watched once that section is near (`near`), because
 *    measuring inside a skipped section would force the browser to render it;
 *  - numbers the items of each group, for the stagger;
 *  - opens a photograph's frame only once its picture is there to open onto —
 *    a frame that wiped open onto an empty box, with the photo popping in
 *    later, was what made the pictures feel slow — waiting at most 900ms, after
 *    which the frame opens onto the blurred placeholder instead;
 *  - starts the gallery strips' pictures downloading a screen early
 *    (`data-eager-near`), at low priority, so they are in place when the strip
 *    scrolls in rather than popping up tile by tile as it moves;
 *  - watches for content added later (client-side navigation, menus, the dish
 *    accordion), so nothing has to register itself.
 *
 * React is told to expect the attributes this adds (`suppressHydrationWarning`
 * on the elements that carry them), and with reduced motion the CSS shows
 * everything regardless.
 */
const REVEAL = `(function(){var S="[data-reveal]:not([data-shown]),[data-reveal-group]:not([data-shown]),[data-img-reveal]:not([data-shown])",d=document;function all(){d.querySelectorAll(S).forEach(function(e){e.setAttribute("data-shown","")})}if(!("IntersectionObserver"in window)){all();return}function reveal(e){if(e.__r)return;e.__r=1;if(e.hasAttribute("data-img-reveal")){var i=e.querySelector("img");if(i&&!(i.complete&&i.naturalWidth>0)){var t,go=function(){clearTimeout(t);e.setAttribute("data-shown","")};i.addEventListener("load",go,{once:true});i.addEventListener("error",go,{once:true});t=setTimeout(go,900);return}}e.setAttribute("data-shown","")}var show=new IntersectionObserver(function(es){for(var k=0;k<es.length;k++)if(es[k].isIntersecting){show.unobserve(es[k].target);reveal(es[k].target)}},{rootMargin:"0px 0px -8% 0px"});var waiting=new Map,near=new IntersectionObserver(function(es){for(var k=0;k<es.length;k++){var e=es[k];if(!e.isIntersecting)continue;near.unobserve(e.target);e.target.querySelectorAll("img[data-eager-near]").forEach(function(i){i.fetchPriority="low";i.loading="eager"});var l=waiting.get(e.target);waiting.delete(e.target);if(l)l.forEach(function(x){show.observe(x)})}},{rootMargin:"100% 0px 100% 0px"});function watch(e){if(e.hasAttribute("data-reveal-group"))e.querySelectorAll("[data-reveal-item]").forEach(function(it,k){it.style.setProperty("--reveal-i",String(k))});var s=e.closest(".section-lazy");if(!s){show.observe(e);return}var l=waiting.get(s);if(l)l.push(e);else{waiting.set(s,[e]);near.observe(s)}}function scan(r){if(r.nodeType===1&&r.matches(S))watch(r);r.querySelectorAll(S).forEach(watch)}var h=window.innerHeight;d.querySelectorAll(S).forEach(function(e){var s=e.closest(".section-lazy");if(s&&s.getBoundingClientRect().top>h)return;var r=e.getBoundingClientRect();if(r.top<h*0.92&&r.bottom>0)reveal(e)});scan(d);new MutationObserver(function(rs){for(var k=0;k<rs.length;k++)rs[k].addedNodes.forEach(function(n){if(n.nodeType===1)scan(n)})}).observe(d.body,{childList:true,subtree:true})})();`;

/*
 * Marks a lazy section `data-skipped` while the browser is skipping it.
 *
 * `content-visibility: auto` stops an off-screen section being drawn, but not
 * the animations inside it, and because nothing in it is drawn they cannot be
 * handed to the compositor either. The footer's embers and map pulses and the
 * gallery strips were being restyled on every frame while nobody could see
 * them. The flag lets CSS pause them (see `.section-lazy[data-skipped]`).
 *
 * The browser reports the change itself, so this costs nothing per frame. It
 * runs before anything is drawn, because the first report comes with the first
 * frame; a browser that never reports simply leaves everything running.
 */
const PAUSE_OFFSCREEN = `document.addEventListener("contentvisibilityautostatechange",function(e){e.target.toggleAttribute("data-skipped",e.skipped)},true);`;

/*
 * Marks a lazy section `data-skipped` while the browser is skipping it.
 *
 * `content-visibility: auto` stops an off-screen section being drawn, but not
 * the animations inside it, and because nothing in it is drawn they cannot be
 * handed to the compositor either. The footer's embers and map pulses and the
 * gallery strips were being restyled on every frame while nobody could see
 * them. The flag lets CSS pause them (see `.section-lazy[data-skipped]`).
 *
 * The browser reports the change itself, so this costs nothing per frame. It
 * runs before anything is drawn, because the first report comes with the first
 * frame; a browser that never reports simply leaves everything running.
 */
const PAUSE_OFFSCREEN = `document.addEventListener("contentvisibilityautostatechange",function(e){e.target.toggleAttribute("data-skipped",e.skipped)},true);`;

export async function SiteShell({ children }: { children: React.ReactNode }) {
  const venue = await getVenue();
  return (
    <VenueProvider value={venue}>
      {/* First in the shell, ahead of anything that can be drawn: see PAUSE_OFFSCREEN. */}
      <script dangerouslySetInnerHTML={{ __html: PAUSE_OFFSCREEN }} />
      <JsonLd data={siteGraph(venue)} />
      <Backdrop />
      <SkipLink />
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      {/* Must stay directly after <main>: see REVEAL. */}
      <script dangerouslySetInnerHTML={{ __html: REVEAL }} />
      <Footer />
      {/* The assistant belongs to the public site, so it mounts here rather than
          in the root layout — which is what keeps it off /admin. */}
      <ChatLauncher />
      <PageEffects />
      <NavigationSkeleton />
    </VenueProvider>
  );
}
