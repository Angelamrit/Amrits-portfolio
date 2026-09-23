"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { m } from "motion/react";
import { cn } from "@/lib/cn";

export type MegaItem = {
  href: string;
  name: string;
  blurb: string;
  meta?: string;
  src: string;
  alt: string;
};

export type MegaPanelData = {
  /** The nav href this panel belongs to. */
  key: string;
  eyebrow: string;
  title: string;
  accent: string;
  blurb: string;
  cta: string;
  ctaHref: string;
  items: MegaItem[];
  /** Small print under the intro column. */
  note?: string;
};

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * Full-width dropdown with imagery, shown under the header for nav items that
 * have children. Presentational only: open/close is owned by the header.
 */
export function MegaMenu({ panel, onNavigate }: { panel: MegaPanelData; onNavigate: () => void }) {
  return (
    <m.div
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4, ease }}
      className="tone-dark absolute inset-x-0 top-full px-5 pt-3 sm:px-8 lg:px-12"
    >
      <div className="glass-strong border-gradient relative mx-auto max-w-wide overflow-hidden rounded-[1.75rem] p-5 shadow-frame md:p-7">
        <span aria-hidden className="orb orb-gold -right-[12%] -top-[60%] size-[45%] opacity-40" />
        <div className="relative grid gap-7 lg:grid-cols-12 lg:gap-9">
          {/* intro */}
          <div className="lg:col-span-3">
            <p className="eyebrow text-[0.55rem] text-gold-light/80">{panel.eyebrow}</p>
            <p className="mt-4 font-display text-display-sm font-light leading-tight">
              {panel.title} <span className="italic text-gold-gradient">{panel.accent}</span>
            </p>
            <p className="mt-4 text-sm leading-relaxed text-fg/60">{panel.blurb}</p>
            <Link
              href={panel.ctaHref}
              onClick={onNavigate}
              className="group mt-6 inline-flex items-center gap-2 border-b border-gold/60 pb-1 font-sans text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-gold-light transition-colors hover:border-gold hover:text-fg"
            >
              {panel.cta}
              <ArrowUpRight aria-hidden className="size-3.5 transition-transform duration-500 ease-luxe group-hover:-translate-y-0.5 group-hover:translate-x-0.5" strokeWidth={2} />
            </Link>
            {panel.note && <p className="mt-6 border-t border-line pt-4 text-[0.7rem] leading-relaxed text-fg/45">{panel.note}</p>}
          </div>

          {/* cards */}
          <ul
            className={cn(
              "grid gap-3 lg:col-span-9",
              panel.items.length > 4 ? "sm:grid-cols-2 xl:grid-cols-3" : "sm:grid-cols-2 xl:grid-cols-3",
            )}
          >
            {/*
              Keyed by href *and* name: several cards can legitimately share a
              destination — both Angel dining rooms link to /angel — so the href
              alone is a destination, not an identity, and duplicates it.
            */}
            {panel.items.map((item, i) => (
              <li key={`${item.href}::${item.name}`}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className="group relative flex h-full items-center gap-4 overflow-hidden rounded-frame border border-fg/8 bg-fg/[0.03] p-2.5 transition-all duration-500 ease-luxe hover:border-gold/45 hover:bg-fg/[0.06] hover:shadow-glow"
                >
                  <span className="relative block size-16 shrink-0 overflow-hidden rounded-xl bg-sand">
                    <Image
                      src={item.src}
                      alt={item.alt}
                      fill
                      sizes="72px"
                      className="object-cover transition-transform duration-[1200ms] ease-luxe group-hover:scale-[1.12]"
                    />
                    <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-brown-deep/70 to-transparent" />
                    <span aria-hidden className="absolute bottom-1 left-1.5 font-display text-[0.7rem] leading-none text-gold-light/90">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-[1.05rem] leading-tight transition-colors duration-300 group-hover:text-gold-light">
                      {item.name}
                    </span>
                    <span className="mt-1 block line-clamp-2 text-[0.76rem] leading-relaxed text-fg/55">{item.blurb}</span>
                    {item.meta && <span className="eyebrow mt-1.5 block text-[0.5rem] text-gold/70">{item.meta}</span>}
                  </span>
                  <span
                    aria-hidden
                    className="grid size-7 shrink-0 place-items-center rounded-full border border-fg/12 text-fg/40 transition-all duration-500 ease-luxe group-hover:border-gold group-hover:bg-gold group-hover:text-charcoal"
                  >
                    <ArrowUpRight className="size-3.5" strokeWidth={2} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </m.div>
  );
}
