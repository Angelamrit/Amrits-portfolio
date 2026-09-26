"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { PageSkeleton } from "./PageSkeleton";

/** A navigation that lands sooner than this never shows the skeleton at all. */
const SHOW_AFTER_MS = 120;
/** A navigation that never lands (a dropped connection) must not leave it up for good. */
const GIVE_UP_AFTER_MS = 12_000;

/**
 * Covers the page with a skeleton while the next one is on its way, instead of
 * leaving a frozen page or an empty screen.
 *
 * Deliberately not a `loading.tsx`. A route-level loading file wraps every page
 * in a Suspense boundary, and React then writes the fallback into the
 * pre-built HTML ahead of the page itself and swaps the real content in
 * afterwards — every first visit would paint the skeleton, then jump, and the
 * main photograph would arrive late. This only ever appears after a click,
 * never in the HTML, and never holds a navigation back: prefetched pages open
 * well inside `SHOW_AFTER_MS`, so it is only seen when there is a real wait.
 *
 * It sits under the header (z-80), so the navigation stays usable throughout.
 */
export function NavigationSkeleton() {
  const pathname = usePathname();
  // The page a navigation set off from. The skeleton shows only while we are
  // still on it, so it goes the moment the new page renders, and a timer that
  // fires after a quick navigation has already landed cannot raise it again.
  const [leaving, setLeaving] = useState<string | null>(null);
  const showTimer = useRef<number | undefined>(undefined);
  const giveUpTimer = useRef<number | undefined>(undefined);

  // Forget it once we have moved on, or returning to that page later would
  // find the skeleton waiting there.
  const [shownPath, setShownPath] = useState(pathname);
  if (shownPath !== pathname) {
    setShownPath(pathname);
    setLeaving(null);
  }

  useEffect(() => {
    const clear = () => {
      window.clearTimeout(showTimer.current);
      window.clearTimeout(giveUpTimer.current);
      setLeaving(null);
    };

    const onClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest?.("a[href]");
      if (!(link instanceof HTMLAnchorElement)) return;
      if (link.hasAttribute("download") || (link.target && link.target !== "_self")) return;

      const url = new URL(link.href, location.href);
      if (url.origin !== location.origin) return;
      // Same page (a hash or a filter in the query), the dashboard, or a file.
      if (url.pathname === location.pathname) return;
      if (/^\/(admin|api)(\/|$)/.test(url.pathname) || /\.[a-z0-9]+$/i.test(url.pathname)) return;

      window.clearTimeout(showTimer.current);
      window.clearTimeout(giveUpTimer.current);
      const from = location.pathname;
      showTimer.current = window.setTimeout(() => setLeaving(from), SHOW_AFTER_MS);
      giveUpTimer.current = window.setTimeout(clear, GIVE_UP_AFTER_MS);
    };

    // Coming back to this page out of the back/forward cache must not find it still up.
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) clear();
    };

    document.addEventListener("click", onClick);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("pageshow", onPageShow);
      clear();
    };
  }, []);

  if (leaving !== pathname) return null;
  return (
    <div className="backdrop-oak fixed inset-0 z-[75] overflow-hidden">
      <PageSkeleton />
    </div>
  );
}
