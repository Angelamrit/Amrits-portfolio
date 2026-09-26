"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * The site's visit counter.
 *
 * One `POST /api/track` per page a guest opens, sent once the browser is idle.
 * It sends only the path, the referring site and the viewport width — no
 * identifier of any kind, and nothing is stored in the browser.
 *
 * Because the site navigates client-side, there is no fresh document load to
 * hook: the effect re-runs on every pathname change, which is what makes a
 * move from `/` to `/menus` count as a second page rather than disappearing.
 *
 * Two details that look like omissions and are not.
 *
 * The scheduled send is deliberately *not* cancelled when the effect is torn
 * down. Cancelling is the reflex, and it is wrong twice over here. In
 * development React mounts every effect twice, so a cleanup that cancels the
 * first send and a guard that suppresses the second records nothing at all —
 * which is exactly what happened before this comment existed. And in
 * production, tearing down is what a guest navigating away looks like, so
 * cancelling would discard precisely the visits that are hardest to measure.
 * `sendBeacon` and `keepalive` exist so a request outlives the page that
 * started it; there is nothing to clean up.
 *
 * The duplicate guard therefore lives in module scope rather than in a ref.
 * A ref belongs to one mounted instance, and this component is remounted
 * during an ordinary page load: `Providers` renders its children bare until it
 * has decided whether to enable smooth scrolling, then re-renders them inside
 * `<ReactLenis>`, and swapping the wrapping element unmounts and remounts
 * everything below it. A ref is wiped by that and every page was counted
 * twice; a module-level record is not.
 */

/**
 * Long enough to absorb a remount plus the idle callback's own jitter, which
 * was measured at up to ~1.8s on an image-heavy page. Short enough that
 * genuinely returning to a page later still counts. Re-opening the same page
 * inside this window is treated as one view, which is also the honest reading
 * of it.
 */
const DUPLICATE_WINDOW_MS = 4_000;

let lastSent: { path: string; at: number } | null = null;

export function PageViewBeacon() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;

    const send = () => {
      if (lastSent && lastSent.path === pathname && Date.now() - lastSent.at < DUPLICATE_WINDOW_MS) return;
      lastSent = { path: pathname, at: Date.now() };

      const body = JSON.stringify({
        path: pathname,
        // Only the first page of a visit has an external referrer; after that
        // `document.referrer` is this site, which the server files as internal.
        referrer: document.referrer || "",
        width: window.innerWidth,
      });

      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon?.("/api/track", blob)) return;

      // `keepalive` so the request still completes if the guest navigates away
      // in the same moment. Failures are ignored on purpose: a missed count is
      // not worth an error in a guest's console.
      void fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {});
    };

    // Sent once the browser is idle, so the beacon never competes with the
    // photography for bandwidth on the first paint.
    if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(send, { timeout: 1_500 });
    else window.setTimeout(send, 300);
  }, [pathname]);

  return null;
}
