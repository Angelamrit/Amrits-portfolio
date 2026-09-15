"use client";

import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import type { Dish } from "@/types/content";
import { cn } from "@/lib/cn";
import { DietaryBadges } from "@/components/ui/Badge";

const ease = [0.16, 1, 0.3, 1] as const;
const INTERVAL = 5200;

/**
 * Interactive dish showcase: a list on one side, a large crossfading image on
 * the other. Hover, focus or tap a dish to feature it; it also auto-advances
 * with a progress line until the visitor interacts.
 */
export function DishShowcase({ dishes }: { dishes: Dish[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (paused || reduce) return;
    const t = window.setInterval(() => setActive((a) => (a + 1) % dishes.length), INTERVAL);
    return () => window.clearInterval(t);
  }, [paused, reduce, dishes.length]);

  const dish = dishes[active];
  const nn = (i: number) => String(i + 1).padStart(2, "0");

  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:gap-12" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {/* Featured image */}
      <div className="lg:order-2 lg:col-span-7">
        <div className="relative lg:sticky lg:top-28">
          <span aria-hidden className="orb orb-gold -right-[15%] -top-[20%] size-[70%] opacity-60" />
          <div className="glass-strong border-gradient relative overflow-hidden rounded-[2rem] p-3 shadow-glow-lg">
            <div className="tone-dark relative aspect-[4/3] overflow-hidden rounded-[1.25rem] bg-sand">
              <AnimatePresence initial={false}>
                <m.div
                  key={dish.id}
                  className="absolute inset-0"
                  initial={{ opacity: 0, scale: 1.06 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.9, ease }}
                >
                  <Image src={dish.image.src} alt={dish.image.alt} fill sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover" />
                </m.div>
              </AnimatePresence>
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-brown-deep/90 via-brown-deep/20 to-transparent" />
              <span aria-hidden className="pointer-events-none absolute right-5 top-1 hidden select-none font-display text-[6rem] leading-none text-outline-gold sm:block md:text-[9rem]">
                {nn(active)}
              </span>
              <AnimatePresence mode="wait" initial={false}>
                <m.div
                  key={`copy-${dish.id}`}
                  className="absolute inset-x-0 bottom-0 p-6 md:p-8"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.5, ease }}
                >
                  <p className="eyebrow text-gold-light">{dish.tagline}</p>
                  <h3 className="mt-2 font-display text-display-md font-light text-gold-gradient">{dish.name}</h3>
                  <p className="mt-3 max-w-lg text-sm leading-relaxed text-fg/80 md:text-base">{dish.description}</p>
                  <div className="mt-4">
                    <DietaryBadges tags={dish.tags} />
                  </div>
                </m.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Dish list */}
      <ol className="flex flex-col divide-y divide-line lg:order-1 lg:col-span-5" role="tablist" aria-label="Signature dishes">
        {dishes.map((d, i) => {
          const on = i === active;
          return (
            <li key={d.id}>
              <button
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setActive(i)}
                onFocus={() => setActive(i)}
                onMouseEnter={() => setActive(i)}
                className={cn(
                  "group relative flex w-full items-center gap-5 py-5 text-left transition-colors duration-500 md:py-6",
                  on ? "text-fg" : "text-fg/55 hover:text-fg",
                )}
              >
                <span className={cn("w-8 font-display text-2xl transition-colors duration-500", on ? "text-gold-gradient" : "text-fg/35")}>{nn(i)}</span>
                <span className="min-w-0 flex-1">
                  <span className={cn("block font-display text-display-sm font-light transition-transform duration-700 ease-luxe", on && "translate-x-2")}>{d.name}</span>
                  <span className="eyebrow mt-1.5 block text-[0.58rem] text-muted">{d.tagline}</span>
                </span>
                <span
                  className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-full border transition-all duration-500 ease-luxe",
                    on ? "border-accent bg-accent text-gold-light shadow-glow" : "border-line text-fg/40 group-hover:border-accent",
                  )}
                >
                  <ArrowUpRight aria-hidden className="size-4" strokeWidth={1.5} />
                </span>
                {on && !reduce && !paused && (
                  <m.span
                    key={`progress-${active}`}
                    aria-hidden
                    className="absolute bottom-0 left-0 h-px bg-accent"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: INTERVAL / 1000, ease: "linear" }}
                  />
                )}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
