"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * How many people are on the site right now, refreshed on its own.
 *
 * A dashboard that only tells the truth at the moment it was opened is a
 * screenshot. This asks the server for a fresh render every minute — a Next.js
 * refresh, so the whole page updates in place without the scroll position
 * moving or a form losing what was typed into it.
 *
 * It backs off entirely while the tab is hidden. A dashboard left open on a
 * second monitor overnight should not be polling a thousand times by morning.
 */
export function LivePulse({ count }: { count: number }) {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState !== "visible") return;
      setRefreshing(true);
      router.refresh();
      window.setTimeout(() => setRefreshing(false), 900);
    };

    const timer = window.setInterval(tick, 60_000);
    // Coming back to the tab should show current numbers, not minute-old ones.
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [router]);

  return (
    <span
      className="glass flex shrink-0 items-center gap-2.5 rounded-pill px-4 py-2.5"
      title="Visitors active in the last five minutes. Updates every minute."
    >
      <span aria-hidden className="live-dot" />
      <span className="font-sans text-[0.78rem] tnum text-fg/85">
        <strong className="font-semibold text-gold-light">{count}</strong> reading now
      </span>
      <span
        aria-hidden
        className={`size-1 rounded-pill bg-gold transition-opacity duration-500 ${refreshing ? "opacity-70" : "opacity-0"}`}
      />
    </span>
  );
}
