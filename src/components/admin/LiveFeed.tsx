"use client";

import { useEffect, useState } from "react";
import { Monitor, Smartphone, Tablet } from "lucide-react";
import { countryName, relativeTime } from "./format";
import { PanelEmpty } from "./Panel";

/**
 * The last handful of visits, newest first.
 *
 * The one panel on the dashboard that shows individual rows rather than
 * totals, and the reason it is safe to is that a row holds nothing about a
 * person: a page, a referring site, a device class and a country. There is no
 * identifier to click through, because none was ever recorded.
 *
 * `now` arrives from the server so the first paint matches what was rendered
 * there — computing "4 min ago" independently on both sides is the classic way
 * to get a hydration mismatch on a timestamp.
 */

export type Visit = { at: number; path: string; referrer: string; device: "mobile" | "tablet" | "desktop"; country?: string };

const icons = { mobile: Smartphone, tablet: Tablet, desktop: Monitor } as const;

export function LiveFeed({ visits, now }: { visits: Visit[]; now: number }) {
  const [clock, setClock] = useState(now);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  if (visits.length === 0) {
    return <PanelEmpty>No visits yet. Open the site in another tab and this fills up.</PanelEmpty>;
  }

  return (
    <ul className="flex flex-col">
      {visits.map((visit, index) => {
        const Icon = icons[visit.device];
        return (
          <li
            key={`${visit.at}-${index}`}
            className="flex items-center gap-3 border-b border-fg/6 py-2.5 last:border-b-0"
          >
            <Icon aria-hidden className="size-3.5 shrink-0 text-fg/30" strokeWidth={1.6} />
            <span className="min-w-0 flex-1 truncate font-sans text-[0.82rem] text-fg/85">{visit.path}</span>
            {visit.country && (
              <span className="hidden shrink-0 text-[0.7rem] text-fg/40 sm:inline">{countryName(visit.country)}</span>
            )}
            <span className="hidden shrink-0 truncate text-[0.7rem] text-fg/35 md:inline md:max-w-[9rem]">
              {visit.referrer === "direct" ? "direct" : visit.referrer}
            </span>
            <time
              dateTime={new Date(visit.at).toISOString()}
              className="shrink-0 text-[0.7rem] tnum text-fg/45"
            >
              {relativeTime(visit.at, clock)}
            </time>
          </li>
        );
      })}
    </ul>
  );
}
