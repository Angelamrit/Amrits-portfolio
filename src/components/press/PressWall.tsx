"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { ArrowUpRight, Award, Newspaper, PlayCircle, Quote as QuoteIcon, Star } from "lucide-react";
import type { PressItem } from "@/types/content";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";

const ease = [0.16, 1, 0.3, 1] as const;

export const kindLabel: Record<PressItem["kind"], string> = {
  award: "Award",
  listing: "Guide listing",
  quote: "Peer recognition",
  article: "Feature",
  video: "Film",
};

const kindIcon: Record<PressItem["kind"], typeof Award> = {
  award: Award,
  listing: Star,
  quote: QuoteIcon,
  article: Newspaper,
  video: PlayCircle,
};

type Filter = { value: "all" | PressItem["kind"]; label: string };

/**
 * The coverage wall: filterable, with the outlet set in a large serif and the
 * critic's own words pulled out. Flagship items get a wider, quieter card.
 */
export function PressWall({ items }: { items: PressItem[] }) {
  const [filter, setFilter] = useState<Filter["value"]>("all");

  const filters = useMemo<Filter[]>(() => {
    const present = new Set(items.map((i) => i.kind));
    const order: PressItem["kind"][] = ["award", "quote", "article", "listing", "video"];
    return [
      { value: "all", label: `All ${items.length}` },
      ...order.filter((k) => present.has(k)).map((k) => ({ value: k, label: kindLabel[k] })),
    ];
  }, [items]);

  const visible = filter === "all" ? items : items.filter((i) => i.kind === filter);

  /* sliding gold indicator under the filter pills */
  const listRef = useRef<HTMLDivElement>(null);
  const [ind, setInd] = useState({ left: 0, width: 0, ready: false });
  useEffect(() => {
    const measure = () => {
      const list = listRef.current;
      const target = list?.querySelector<HTMLElement>(`[data-filter="${filter}"]`);
      if (!list || !target) return;
      const lr = list.getBoundingClientRect();
      const tr = target.getBoundingClientRect();
      setInd({ left: tr.left - lr.left, width: tr.width, ready: true });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [filter]);

  return (
    <div>
      {/* filters */}
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div ref={listRef} className="glass relative inline-flex max-w-full flex-wrap gap-1 rounded-[1.4rem] p-1.5 sm:rounded-pill">
          <span
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-y-1.5 z-[1] hidden rounded-pill bg-gradient-to-r from-gold-light via-gold to-gold-deep shadow-[0_10px_30px_-10px_rgba(226,189,108,0.9)] transition-all duration-500 ease-luxe sm:block",
              ind.ready ? "opacity-100" : "opacity-0",
            )}
            style={{ left: ind.left, width: ind.width }}
          />
          {filters.map((f) => {
            const on = f.value === filter;
            return (
              <button
                key={f.value}
                type="button"
                data-filter={f.value}
                aria-pressed={on}
                onClick={() => setFilter(f.value)}
                className={cn(
                  "relative z-[2] rounded-pill px-5 py-3 font-sans text-[0.62rem] font-semibold uppercase tracking-[0.2em] transition-colors duration-500 ease-luxe",
                  on ? "text-charcoal" : "text-fg/65 hover:text-fg",
                  on && "bg-gradient-to-r from-gold-light via-gold to-gold-deep sm:bg-none",
                )}
              >
                {f.label}
              </button>
            );
          })}
        </div>
        <p className="eyebrow text-[0.55rem] text-muted">
          {visible.length} {visible.length === 1 ? "item" : "items"}
        </p>
      </div>

      {/* wall */}
      <ul className="mt-10 grid gap-4">
        {/* No `layout` prop: the app loads motion's `domAnimation` feature set, which excludes layout animations. */}
        <AnimatePresence initial={false}>
          {visible.map((item, i) => {
            const Icon = kindIcon[item.kind];
            const flagship = item.tier === "flagship";
            return (
              <m.li
                key={item.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.45, ease, delay: Math.min(i * 0.04, 0.24) }}
              >
                <article
                  className={cn(
                    "spotlight border-gradient group relative overflow-hidden rounded-[1.5rem] transition-all duration-700 ease-luxe hover:shadow-glow",
                    flagship ? "glass-strong p-7 md:p-10" : "glass p-6 md:p-8",
                  )}
                  onMouseMove={(e) => {
                    const r = e.currentTarget.getBoundingClientRect();
                    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
                    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
                  }}
                >
                  {flagship && <span aria-hidden className="orb orb-gold -right-[15%] -top-[60%] size-[45%] opacity-40" />}
                  {item.url && (
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 z-[4]" aria-label={`${item.outlet}: ${item.headline}`} />
                  )}

                  <div className="relative grid gap-5 md:grid-cols-12 md:gap-8">
                    {/* outlet */}
                    <div className="md:col-span-4 lg:col-span-3">
                      <div className="flex items-center gap-2.5">
                        <Icon aria-hidden className="size-4 shrink-0 text-gold" strokeWidth={1.5} />
                        <p className={cn("font-display leading-tight text-gold-gradient", flagship ? "text-2xl md:text-[1.75rem]" : "text-xl")}>{item.outlet}</p>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Badge tone={flagship ? "gold" : "dark"} className="px-2.5 py-1">
                          {kindLabel[item.kind]}
                        </Badge>
                        {item.date && <span className="eyebrow text-[0.5rem] text-muted">{item.date}</span>}
                      </div>
                    </div>

                    {/* copy */}
                    <div className="md:col-span-8 lg:col-span-8 lg:col-start-5">
                      <h3
                        className={cn(
                          "font-display font-light leading-snug text-fg transition-colors duration-300 group-hover:text-gold-light",
                          flagship ? "text-display-sm" : "text-xl md:text-2xl",
                        )}
                      >
                        {item.headline}
                      </h3>
                      {item.excerpt &&
                        (item.verbatim ? (
                          <blockquote className={cn("relative mt-4 border-l border-gold/40 pl-5 font-display italic leading-relaxed text-fg/80", flagship ? "text-xl md:text-2xl" : "text-lg")}>
                            &ldquo;{item.excerpt}&rdquo;
                          </blockquote>
                        ) : (
                          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-fg/65 md:text-[0.95rem]">{item.excerpt}</p>
                        ))}
                      {item.url && (
                        <span className="mt-5 inline-flex items-center gap-2 border-b border-gold/50 pb-1 font-sans text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-gold-light transition-colors duration-300 group-hover:border-gold group-hover:text-fg">
                          Read at {item.outlet}
                          <ArrowUpRight aria-hidden className="size-3.5 transition-transform duration-500 ease-luxe group-hover:-translate-y-0.5 group-hover:translate-x-0.5" strokeWidth={2} />
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              </m.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </div>
  );
}
