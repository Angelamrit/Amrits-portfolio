"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowUpRight, FileText } from "lucide-react";
import type { DietaryTag, ImageAsset } from "@/types/content";
import { cn } from "@/lib/cn";
import { Badge, DietaryBadges } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useVenue } from "@/components/layout/VenueContext";
import { CrossFade } from "@/components/ui/CrossFade";
import { useReducedMotion } from "@/lib/use-reduced-motion";

export type ResolvedCourse = {
  title: string;
  name: string;
  description?: string;
  tags: DietaryTag[];
  status: "confirmed" | "draft";
  image?: ImageAsset;
};

export type ResolvedMenu = {
  slug: string;
  name: string;
  kind: "tasting";
  courseLabel: string;
  courseCount: number;
  intro: string;
  notes: string[];
  venue: string;
  pdfUrl?: string;
  image: ImageAsset;
  courses: ResolvedCourse[];
};

const INTERVAL = 5200;
/** Matches Tailwind's `lg`: the side-by-side layout. Below it, the course list is an accordion. */
const WIDE = "(min-width: 1024px)";
const nn = (i: number) => String(i + 1).padStart(2, "0");

/**
 * Menus as a printed menu card beside a large dish image. Hover, focus or tap
 * any course and the image crossfades to that dish; it also auto-advances
 * with a gold progress line until the visitor interacts.
 *
 * Phones and tablets: the course list is an accordion instead. The large image
 * sat above the whole card there, so tapping a course further down changed a
 * picture that was already scrolled out of view; each course now opens its own
 * photograph directly beneath it and pushes the courses below it down.
 */
/*
 * Why two components: reading the query string with useSearchParams makes
 * Next.js leave the whole component out of the pre-built HTML and render it in
 * the browser, so visitors used to see an empty box until the JavaScript
 * arrived. The page now puts the View, with no query, in the Suspense fallback —
 * so the real content is in the static HTML from the first byte — and this
 * wrapper takes over once the query can be read.
 */
export function MenuSwitcher({ menus }: { menus: ResolvedMenu[] }) {
  const params = useSearchParams();
  return <MenuSwitcherView menus={menus} fromUrl={params.get("menu")} />;
}

export function MenuSwitcherView({ menus, fromUrl }: { menus: ResolvedMenu[]; fromUrl: string | null }) {
  const venue = useVenue();
  const router = useRouter();
  const pathname = usePathname();
  const validFromUrl = menus.find((mn) => mn.slug === fromUrl)?.slug;

  const [active, setActive] = useState(validFromUrl ?? menus[0].slug);
  const [prevUrl, setPrevUrl] = useState(fromUrl);
  const [course, setCourse] = useState(0);
  const [open, setOpen] = useState<number | null>(0);
  /** The panel that is sliding shut, kept rendered until its transition ends. */
  const [closing, setClosing] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();
  const items = useRef<(HTMLLIElement | null)[]>([]);

  // Follow later ?menu= changes (e.g. the hero tiles or the header menu).
  if (fromUrl !== prevUrl) {
    setPrevUrl(fromUrl);
    if (validFromUrl) {
      setActive(validFromUrl);
      setCourse(0);
      setOpen(0);
    }
  }

  const select = (slug: string) => {
    if (slug === active) return;
    setActive(slug);
    setCourse(0);
    setOpen(0);
    router.replace(`${pathname}?menu=${slug}`, { scroll: false });
  };

  const menu = menus.find((mn) => mn.slug === active) ?? menus[0];
  const current = menu.courses[Math.min(course, menu.courses.length - 1)];
  const image = current.image ?? menu.image;

  /* auto-advance through the courses */
  useEffect(() => {
    // Only the wide layout auto-advances: on the accordion it would open and
    // close panels under the reader's thumb.
    if (paused || reduce || !window.matchMedia(WIDE).matches) return;
    const t = window.setInterval(() => setCourse((c) => (c + 1) % menu.courses.length), INTERVAL);
    return () => window.clearInterval(t);
  }, [paused, reduce, menu.courses.length, active]);

  useEffect(() => {
    if (closing === null) return;
    const t = window.setTimeout(() => setClosing(null), 520);
    return () => window.clearTimeout(t);
  }, [closing]);

  const toggle = (i: number) => {
    setCourse(i);
    if (window.matchMedia(WIDE).matches) return;
    const opening = open !== i;
    setClosing(open);
    setOpen(opening ? i : null);
    if (!opening) return;
    // A panel closing above this one pulls it upwards; once the heights have
    // settled, bring the tapped course and its photograph into view.
    window.setTimeout(
      () => items.current[i]?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" }),
      reduce ? 0 : 520,
    );
  };

  /* sliding gold indicator under the menu tabs */
  const tabsRef = useRef<HTMLDivElement>(null);
  const [ind, setInd] = useState({ left: 0, width: 0, ready: false });
  useEffect(() => {
    const measure = () => {
      const list = tabsRef.current;
      const target = list?.querySelector<HTMLElement>(`[data-tab="${active}"]`);
      if (!list || !target) return;
      const lr = list.getBoundingClientRect();
      const tr = target.getBoundingClientRect();
      setInd({ left: tr.left - lr.left, width: tr.width, ready: true });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [active]);

  const tabbed = menus.length > 1;

  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {/* ---------- menu tabs ----------
          Only when there is a choice to make: with a single menu the bar would
          be one wide gold slab repeating the name the card below already shows. */}
      {tabbed && (
        <div ref={tabsRef} role="tablist" aria-label="Menus" className="glass relative grid gap-1 rounded-[1.6rem] p-1.5 sm:grid-cols-2 sm:rounded-pill">
          <span
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-y-1.5 z-[1] hidden rounded-pill bg-gradient-to-r from-gold-light via-gold to-gold-deep shadow-[0_10px_30px_-10px_rgba(226,189,108,0.9)] transition-all duration-500 ease-luxe sm:block",
              ind.ready ? "opacity-100" : "opacity-0",
            )}
            style={{ left: ind.left, width: ind.width }}
          />
          {menus.map((mn, i) => {
            const selected = mn.slug === active;
            return (
              <button
                key={mn.slug}
                role="tab"
                type="button"
                id={`tab-${mn.slug}`}
                data-tab={mn.slug}
                aria-selected={selected}
                aria-controls={`panel-${mn.slug}`}
                onClick={() => select(mn.slug)}
                className={cn(
                  "relative z-[2] flex items-center gap-4 rounded-pill px-5 py-3.5 text-left transition-colors duration-500 ease-luxe",
                  selected ? "text-charcoal" : "text-fg/70 hover:text-fg",
                  selected && "bg-gradient-to-r from-gold-light via-gold to-gold-deep sm:bg-none",
                )}
              >
                <span className={cn("font-display text-2xl leading-none", selected ? "text-charcoal" : "text-gold-gradient")}>{nn(i)}</span>
                <span className="min-w-0">
                  <span className="block truncate font-display text-lg leading-tight">{mn.name}</span>
                  <span className={cn("eyebrow mt-1 block truncate text-[0.5rem]", selected ? "text-charcoal/70" : "text-muted")}>
                    {mn.courseLabel} · {mn.venue}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ---------- menu body ---------- */}
      <div
          key={menu.slug}
          role={tabbed ? "tabpanel" : undefined}
          id={`panel-${menu.slug}`}
          aria-labelledby={tabbed ? `tab-${menu.slug}` : undefined}
          className={cn("enter grid gap-10 lg:grid-cols-12 lg:gap-14", tabbed && "mt-12")}
        >
          {/* dish showcase */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-32">
              {/* The large photograph is the laptop layout only; below lg each course opens its own. */}
              <div className="glass-strong border-gradient relative hidden overflow-hidden rounded-[2rem] p-3 shadow-glow-lg lg:block">
                <span aria-hidden className="orb orb-gold -right-[20%] -top-[25%] size-[70%] opacity-50" />
                <div className="tone-dark relative aspect-[4/5] overflow-hidden rounded-[1.25rem] bg-sand">
                  <CrossFade id={`${menu.slug}-${image.src}`} className="absolute inset-0">
                    <Image src={image.src} alt={image.alt} fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
                  </CrossFade>
                  <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-brown-deep/95 via-brown-deep/25 to-transparent" />
                  <Badge tone="solid" className="absolute left-4 top-4 z-[2]">
                    {menu.courseLabel}
                  </Badge>
                  <span aria-hidden className="pointer-events-none absolute right-4 top-0 hidden select-none font-display text-[7rem] leading-none text-outline-gold sm:block md:text-[9rem]">
                    {nn(course)}
                  </span>
                  <CrossFade id={`copy-${menu.slug}-${course}`} variant="rise" duration={200} className="absolute inset-0">
                    <div className="absolute inset-x-0 bottom-0 p-6 md:p-7">
                      <p className="eyebrow text-[0.58rem] text-gold-light">
                        Course {nn(course)} · {current.title}
                      </p>
                      <p className={cn("mt-2 font-display text-display-sm font-light", current.status === "draft" ? "italic text-fg/80" : "text-gold-gradient")}>{current.name}</p>
                      {current.description && <p className="mt-2 max-w-sm text-sm leading-relaxed text-fg/75">{current.description}</p>}
                      {current.tags.length > 0 && (
                        <div className="mt-3">
                          <DietaryBadges tags={current.tags} />
                        </div>
                      )}
                    </div>
                  </CrossFade>
                </div>
              </div>

              <dl className="grid grid-cols-3 gap-3 lg:mt-4">
                {[
                  { k: "Courses", v: String(menu.courseCount) },
                  { k: "Kitchen", v: "100% Halal" },
                  { k: "Style", v: "Tasting" },
                ].map((f) => (
                  <div key={f.k} className="glass rounded-frame px-4 py-3.5">
                    <dt className="eyebrow text-[0.5rem] text-muted">{f.k}</dt>
                    <dd className="mt-1.5 font-display text-lg leading-none text-gold-gradient md:text-xl">{f.v}</dd>
                  </div>
                ))}
              </dl>

              <ul className="mt-4 space-y-1.5 text-xs text-muted">
                {menu.notes.map((n) => (
                  <li key={n} className="flex gap-2">
                    <span aria-hidden className="mt-1.5 size-1 shrink-0 rounded-full bg-gold shadow-[0_0_8px_rgba(226,189,108,0.9)]" />
                    {n}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* printed menu card */}
          <div className="lg:col-span-7">
            <article className="glass-strong border-gradient relative overflow-hidden rounded-[2rem] p-6 md:p-10">
              <span aria-hidden className="orb orb-gold -left-[25%] -top-[30%] size-[55%] opacity-35" />
              <span aria-hidden className="orb orb-ember -bottom-[30%] -right-[20%] size-[55%] opacity-40" />
              <div className="relative">
                <header className="text-center">
                  <p className="eyebrow text-[0.58rem] text-gold-light/80">{menu.venue}</p>
                  <h2 className="mt-4 font-display text-display-md font-light text-gold-gradient">{menu.name}</h2>
                  <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-fg/65">{menu.intro}</p>
                  <div aria-hidden className="mt-7 flex items-center justify-center gap-3">
                    <span className="hairline-center block h-px w-20" />
                    <span className="size-1.5 rotate-45 bg-gold shadow-[0_0_12px_rgba(226,189,108,0.9)]" />
                    <span className="hairline-center block h-px w-20" />
                  </div>
                </header>

                <ol className="mt-6 divide-y divide-line" aria-label={`${menu.name} courses`}>
                  {menu.courses.map((c, i) => {
                    const on = i === course;
                    const expanded = open === i;
                    const draft = c.status === "draft";
                    const photo = c.image ?? menu.image;
                    const panelId = `course-panel-${menu.slug}-${i}`;
                    return (
                      <li
                        key={`${menu.slug}-${i}`}
                        ref={(el) => {
                          items.current[i] = el;
                        }}
                        className="scroll-mt-24"
                      >
                        <button
                          type="button"
                          onMouseEnter={() => setCourse(i)}
                          onFocus={() => setCourse(i)}
                          onClick={() => toggle(i)}
                          aria-expanded={expanded}
                          aria-controls={panelId}
                          className={cn(
                            "group relative grid w-full grid-cols-[2.25rem_1fr_auto] items-center gap-4 py-4 pl-3 text-left transition-colors duration-500 ease-luxe sm:grid-cols-[2.75rem_1fr_auto] md:py-5",
                            // Wide layout follows the hover-driven `course`; the accordion follows `open`.
                            on ? "lg:text-fg" : "lg:text-fg/60 lg:hover:text-fg",
                            expanded ? "max-lg:text-fg" : "max-lg:text-fg/70",
                          )}
                        >
                          <span
                            aria-hidden
                            className={cn(
                              "absolute inset-y-3 left-0 w-0.5 rounded-full bg-gradient-to-b from-gold-light to-gold shadow-[0_0_12px_rgba(226,189,108,0.9)] transition-opacity duration-500",
                              on ? "lg:opacity-100" : "lg:opacity-0",
                              expanded ? "max-lg:opacity-100" : "max-lg:opacity-0",
                            )}
                          />
                          <span
                            className={cn(
                              "font-display text-2xl leading-none transition-colors duration-500",
                              on ? "lg:text-gold-gradient" : "lg:text-fg/35",
                              expanded ? "max-lg:text-gold-gradient" : "max-lg:text-fg/35",
                            )}
                          >
                            {nn(i)}
                          </span>
                          <span className="min-w-0">
                            <span className="eyebrow block text-[0.52rem] text-muted">{c.title}</span>
                            <span className="mt-1 flex items-baseline gap-3">
                              <span
                                className={cn(
                                  "font-display text-xl leading-tight transition-transform duration-500 ease-luxe md:text-2xl",
                                  on && "lg:translate-x-1",
                                  draft && "italic text-fg/60",
                                )}
                              >
                                {c.name}
                              </span>
                              <span aria-hidden className="hidden min-w-6 flex-1 border-b border-dotted border-fg/20 sm:block" />
                            </span>
                            {draft && (
                              <Badge tone="gold" className="mt-2">
                                To be confirmed with Chef
                              </Badge>
                            )}
                          </span>
                          <span className="flex items-center gap-3">
                            <span className="hidden sm:block">
                              <DietaryBadges tags={c.tags} />
                            </span>
                            <span
                              className={cn(
                                "grid size-9 shrink-0 place-items-center rounded-full border transition-all duration-500 ease-luxe",
                                on ? "lg:border-accent lg:bg-accent lg:text-gold-light lg:shadow-glow" : "lg:border-line lg:text-fg/40 lg:group-hover:border-accent",
                                expanded
                                  ? "max-lg:rotate-90 max-lg:border-accent max-lg:bg-accent max-lg:text-gold-light max-lg:shadow-glow"
                                  : "max-lg:border-line max-lg:text-fg/50",
                              )}
                            >
                              <ArrowUpRight aria-hidden className="size-4" strokeWidth={1.5} />
                            </span>
                          </span>
                          {on && !reduce && !paused && (
                            <span
                              key={`progress-${menu.slug}-${course}`}
                              aria-hidden
                              className="progress-run absolute bottom-0 left-0 hidden h-px bg-accent lg:block"
                              style={{ "--progress-duration": `${INTERVAL / 1000}s` } as CSSProperties}
                            />
                          )}
                        </button>

                        <div id={panelId} className="accordion lg:hidden" data-open={expanded || undefined}>
                          <div>
                            {(expanded || closing === i) && (
                              <div className="pb-5">
                                <div className="border-gradient tone-dark overflow-hidden rounded-[1.5rem] bg-brown-deep/60 p-2 shadow-glow-lg">
                                  <div className="relative aspect-[4/3] overflow-hidden rounded-[1.1rem] bg-sand">
                                    <Image src={photo.src} alt={photo.alt} fill sizes="(min-width: 640px) 80vw, 100vw" className="object-cover" />
                                    <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-brown-deep/70 via-transparent to-transparent" />
                                    <span aria-hidden className="pointer-events-none absolute right-4 top-1 select-none font-display text-[5rem] leading-none text-outline-gold sm:text-[7rem]">
                                      {nn(i)}
                                    </span>
                                  </div>
                                  <div className="px-4 pb-4 pt-5 sm:px-6 sm:pb-6">
                                    <p className="eyebrow text-[0.58rem] text-gold-light">
                                      Course {nn(i)} · {c.title}
                                    </p>
                                    <p className={cn("mt-2 font-display text-display-sm font-light", draft ? "italic text-fg/80" : "text-gold-gradient")}>{c.name}</p>
                                    {c.description && <p className="mt-3 text-sm leading-relaxed text-fg/80 sm:text-base">{c.description}</p>}
                                    {c.tags.length > 0 && (
                                      <div className="mt-4">
                                        <DietaryBadges tags={c.tags} />
                                      </div>
                                    )}
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

                <footer className="mt-8 flex flex-col gap-5 border-t border-line pt-7 sm:flex-row sm:items-center sm:justify-between">
                  <p className="max-w-xs text-xs leading-relaxed text-muted">
                    Menus change with the season and the market.
                  </p>
                  <div className="flex flex-wrap items-center gap-4">
                    {menu.pdfUrl && (
                      <Button href={menu.pdfUrl} variant="link" external icon={false}>
                        <FileText aria-hidden className="mr-2 inline size-3.5" strokeWidth={1.5} />
                        Menu PDF
                      </Button>
                    )}
                    <Button href={venue.resyUrl ?? "/contact"} size="sm">
                      Reserve a Table
                    </Button>
                  </div>
                </footer>
              </div>
            </article>
          </div>
      </div>
    </div>
  );
}
