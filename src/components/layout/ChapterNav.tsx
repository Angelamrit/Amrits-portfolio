"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

export type Chapter = { id: string; label: string };

/** Matches Tailwind's `xl`, the breakpoint the rail is shown from (`hidden xl:block`). */
const WIDE = "(min-width: 80rem)";

/**
 * Fixed chapter rail for long story pages: shows "02 / 08", highlights the
 * chapter in view and jumps to any chapter on click. Labels slide out on hover
 * so the rail stays slim and never covers the content column.
 *
 * Nothing here runs per scroll event. The rail used to decide whether to show
 * itself in a scroll listener that read `scrollY` and `innerHeight` on every
 * event, and each of those reads forces the browser to finish any pending
 * style and layout work there and then — on a phone that was the single
 * largest cost of scrolling the home page, around 7ms of every scroll event,
 * for a rail the phone never shows. Both decisions are now made by
 * IntersectionObservers, which the browser answers off the main thread, and
 * nothing at all is set up below the breakpoint the rail appears at.
 */
export function ChapterNav({ chapters }: { chapters: Chapter[] }) {
  const [active, setActive] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const wide = window.matchMedia(WIDE);
    let stop: (() => void) | null = null;

    const start = () => {
      if (stop) return;
      const els = chapters.map((c) => document.getElementById(c.id)).filter((el): el is HTMLElement => el !== null);
      const current = new IntersectionObserver(
        (entries) => {
          for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
        },
        { rootMargin: "-35% 0px -55% 0px" },
      );
      els.forEach((el) => current.observe(el));

      // The rail appears once the opening screen has scrolled away: while the
      // hero still reaches below the top 40% of the viewport it stays hidden.
      // Without a hero the first chapter stands in for it.
      const opening = document.getElementById("hero") ?? els[0];
      const gate = new IntersectionObserver(
        (entries) => {
          for (const e of entries) setVisible(!e.isIntersecting);
        },
        { rootMargin: "-40% 0px 0px 0px" },
      );
      if (opening) gate.observe(opening);

      stop = () => {
        current.disconnect();
        gate.disconnect();
        stop = null;
      };
    };

    const sync = () => {
      if (wide.matches) start();
      else stop?.();
    };
    sync();
    wide.addEventListener("change", sync);
    return () => {
      wide.removeEventListener("change", sync);
      stop?.();
    };
  }, [chapters]);

  const idx = Math.max(
    0,
    chapters.findIndex((c) => c.id === active),
  );

  return (
    <nav
      aria-label="Chapters"
      className={cn(
        "group/nav tone-dark fixed right-4 top-1/2 z-[60] hidden -translate-y-1/2 transition-[transform,opacity] duration-700 ease-luxe xl:block",
        visible ? "translate-x-0 opacity-100" : "pointer-events-none translate-x-6 opacity-0",
      )}
    >
      <div className="glass w-11 rounded-pill px-0 py-4">
        <p className="mb-4 text-center font-display leading-none">
          <span className="block text-lg text-gold-gradient">{String(idx + 1).padStart(2, "0")}</span>
          <span className="mt-1 block text-[0.5rem] tracking-[0.15em] text-fg/50">/{String(chapters.length).padStart(2, "0")}</span>
        </p>
        <ul className="flex flex-col items-center gap-3">
          {chapters.map((c) => {
            const on = c.id === active;
            return (
              <li key={c.id} className="relative">
                <a href={`#${c.id}`} className="group/dot grid size-5 place-items-center" aria-current={on ? "true" : undefined} aria-label={c.label}>
                  <span
                    className={cn(
                      "block rounded-full transition-all duration-500 ease-luxe",
                      on
                        ? "h-5 w-1.5 bg-gradient-to-b from-gold-light to-gold shadow-[0_0_12px_rgba(226,189,108,0.9)]"
                        : "size-1.5 bg-fg/35 group-hover/dot:bg-gold",
                    )}
                  />
                  <span
                    aria-hidden
                    className={cn(
                      "glass pointer-events-none absolute right-full top-1/2 mr-3 -translate-y-1/2 whitespace-nowrap rounded-pill px-3 py-1.5 eyebrow text-[0.55rem] transition-all duration-500 ease-luxe",
                      "translate-x-2 opacity-0 group-hover/nav:translate-x-0 group-hover/nav:opacity-100",
                      on ? "text-gold-light" : "text-fg/70",
                    )}
                  >
                    {c.label}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
