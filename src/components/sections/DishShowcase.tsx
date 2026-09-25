"use client";

import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Dish } from "@/types/content";
import { cn } from "@/lib/cn";
import { DietaryBadges } from "@/components/ui/Badge";
import { CrossFade } from "@/components/ui/CrossFade";
import { useReducedMotion } from "@/lib/use-reduced-motion";

const INTERVAL = 5200;
/** Matches Tailwind's `lg`: the side-by-side layout. Below it, the list is an accordion. */
const WIDE = "(min-width: 1024px)";

/**
 * Interactive dish showcase.
 *
 * Laptop and up: a list on one side, a large crossfading image on the other.
 * Hover, focus or tap a dish to feature it; it also auto-advances with a
 * progress line until the visitor interacts.
 *
 * Phones and tablets: an accordion. The side image sat above the whole list
 * there, so tapping a dish near the bottom changed a picture that was already
 * scrolled out of view. Instead each dish opens its own photograph directly
 * underneath it and pushes the dishes below it down.
 */
export function DishShowcase({ dishes }: { dishes: Dish[] }) {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState<number | null>(0);
  /** The panel that is sliding shut, kept rendered until its transition ends. */
  const [closing, setClosing] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();
  const items = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    // Only the wide layout auto-advances: on the accordion it would open and
    // close panels under the reader's thumb.
    if (paused || reduce || !window.matchMedia(WIDE).matches) return;
    const t = window.setInterval(() => setActive((a) => (a + 1) % dishes.length), INTERVAL);
    return () => window.clearInterval(t);
  }, [paused, reduce, dishes.length]);

  useEffect(() => {
    if (closing === null) return;
    const t = window.setTimeout(() => setClosing(null), 520);
    return () => window.clearTimeout(t);
  }, [closing]);

  const toggle = (i: number) => {
    setActive(i);
    if (window.matchMedia(WIDE).matches) return;
    const opening = open !== i;
    setClosing(open);
    setOpen(opening ? i : null);
    if (!opening) return;
    // A panel closing above this one pulls it upwards; once the heights have
    // settled, bring the tapped dish and its photograph into view.
    window.setTimeout(
      () => items.current[i]?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" }),
      reduce ? 0 : 520,
    );
  };

  const dish = dishes[active];
  const nn = (i: number) => String(i + 1).padStart(2, "0");

  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:gap-12" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {/* Featured image — laptop and up */}
      <div className="hidden lg:order-2 lg:col-span-7 lg:block">
        <div className="relative lg:sticky lg:top-28">
          <span aria-hidden className="orb orb-gold -right-[15%] -top-[20%] size-[70%] opacity-60" />
          <div className="glass-strong border-gradient relative overflow-hidden rounded-[2rem] p-3 shadow-glow-lg">
            <div className="tone-dark relative aspect-[4/3] overflow-hidden rounded-[1.25rem] bg-sand">
              <CrossFade id={dish.id} className="absolute inset-0">
                <Image src={dish.image.src} alt={dish.image.alt} fill sizes="55vw" className="object-cover" />
              </CrossFade>
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-brown-deep/90 via-brown-deep/20 to-transparent" />
              <span aria-hidden className="pointer-events-none absolute right-5 top-1 select-none font-display text-[9rem] leading-none text-outline-gold">
                {nn(active)}
              </span>
              <CrossFade id={`copy-${dish.id}`} variant="rise" duration={200} className="absolute inset-0">
                <div className="absolute inset-x-0 bottom-0 p-8">
                  <p className="eyebrow text-gold-light">{dish.tagline}</p>
                  <h3 className="mt-2 font-display text-display-md font-light text-gold-gradient">{dish.name}</h3>
                  <p className="mt-3 max-w-lg text-base leading-relaxed text-fg/80">{dish.description}</p>
                  <div className="mt-4">
                    <DietaryBadges tags={dish.tags} />
                  </div>
                </div>
              </CrossFade>
            </div>
          </div>
        </div>
      </div>

      {/* Dish list — an accordion below lg */}
      <ol className="flex flex-col divide-y divide-line lg:order-1 lg:col-span-5" aria-label="Signature dishes">
        {dishes.map((d, i) => {
          const on = i === active;
          const expanded = open === i;
          const panelId = `dish-panel-${d.id}`;
          return (
            <li
              key={d.id}
              ref={(el) => {
                items.current[i] = el;
              }}
              className="scroll-mt-24"
            >
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => toggle(i)}
                onFocus={() => setActive(i)}
                onMouseEnter={() => setActive(i)}
                className={cn(
                  "group relative flex w-full items-center gap-5 py-5 text-left transition-colors duration-500 md:py-6",
                  // Wide layout follows the hover-driven `active`; the accordion follows `open`.
                  on ? "lg:text-fg" : "lg:text-fg/55 lg:hover:text-fg",
                  expanded ? "max-lg:text-fg" : "max-lg:text-fg/70",
                )}
              >
                <span
                  className={cn(
                    "w-8 font-display text-2xl transition-colors duration-500",
                    on ? "lg:text-gold-gradient" : "lg:text-fg/35",
                    expanded ? "max-lg:text-gold-gradient" : "max-lg:text-fg/35",
                  )}
                >
                  {nn(i)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cn("block font-display text-display-sm font-light transition-transform duration-700 ease-luxe", on && "lg:translate-x-2")}>
                    {d.name}
                  </span>
                  <span className="eyebrow mt-1.5 block text-[0.58rem] text-muted">{d.tagline}</span>
                </span>
                <span
                  className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-full border transition-all duration-500 ease-luxe",
                    on ? "lg:border-accent lg:bg-accent lg:text-gold-light lg:shadow-glow" : "lg:border-line lg:text-fg/40 lg:group-hover:border-accent",
                    expanded
                      ? "max-lg:rotate-90 max-lg:border-accent max-lg:bg-accent max-lg:text-gold-light max-lg:shadow-glow"
                      : "max-lg:border-line max-lg:text-fg/50",
                  )}
                >
                  <ArrowUpRight aria-hidden className="size-4" strokeWidth={1.5} />
                </span>
                {on && !reduce && !paused && (
                  <span
                    key={`progress-${active}`}
                    aria-hidden
                    className="progress-run absolute bottom-0 left-0 hidden h-px bg-accent lg:block"
                    style={{ "--progress-duration": `${INTERVAL / 1000}s` } as CSSProperties}
                  />
                )}
              </button>

              <div id={panelId} className="accordion lg:hidden" data-open={expanded || undefined}>
                <div>
                  {(expanded || closing === i) && (
                    <div className="pb-6">
                      <div className="glass-strong border-gradient tone-dark overflow-hidden rounded-[1.5rem] p-2 shadow-glow-lg">
                        <div className="relative aspect-[4/3] overflow-hidden rounded-[1.1rem] bg-sand">
                          <Image src={d.image.src} alt={d.image.alt} fill sizes="(min-width: 640px) 90vw, 100vw" className="object-cover" />
                          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-brown-deep/70 via-transparent to-transparent" />
                          <span aria-hidden className="pointer-events-none absolute right-4 top-1 select-none font-display text-[5rem] leading-none text-outline-gold sm:text-[7rem]">
                            {nn(i)}
                          </span>
                        </div>
                        <div className="px-4 pb-4 pt-5 sm:px-6 sm:pb-6">
                          <p className="eyebrow text-gold-light">{d.tagline}</p>
                          <p className="mt-2 font-display text-display-sm font-light text-gold-gradient">{d.name}</p>
                          <p className="mt-3 text-sm leading-relaxed text-fg/80 sm:text-base">{d.description}</p>
                          <div className="mt-4">
                            <DietaryBadges tags={d.tags} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
