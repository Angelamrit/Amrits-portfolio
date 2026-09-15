"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { ArrowUpRight, FileText } from "lucide-react";
import type { DietaryTag, ImageAsset } from "@/types/content";
import { cn } from "@/lib/cn";
import { Badge, DietaryBadges } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

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
  kind: "tasting" | "specialties" | "event";
  courseLabel: string;
  courseCount: number;
  intro: string;
  notes: string[];
  venue: string;
  pdfUrl?: string;
  image: ImageAsset;
  courses: ResolvedCourse[];
};

const ease = [0.16, 1, 0.3, 1] as const;
const INTERVAL = 5200;
const nn = (i: number) => String(i + 1).padStart(2, "0");

const enquiryHref = (kind: ResolvedMenu["kind"]) => (kind === "tasting" ? "/contact?experience=tasting-menu" : "/contact?experience=private-dining");

/**
 * Menus as a printed menu card beside a large dish image. Hover, focus or tap
 * any course and the image crossfades to that dish; it also auto-advances
 * with a gold progress line until the visitor interacts.
 */
export function MenuSwitcher({ menus }: { menus: ResolvedMenu[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const fromUrl = params.get("menu");
  const validFromUrl = menus.find((mn) => mn.slug === fromUrl)?.slug;

  const [active, setActive] = useState(validFromUrl ?? menus[0].slug);
  const [prevUrl, setPrevUrl] = useState(fromUrl);
  const [course, setCourse] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();

  // Follow later ?menu= changes (e.g. the hero tiles or the header menu).
  if (fromUrl !== prevUrl) {
    setPrevUrl(fromUrl);
    if (validFromUrl) {
      setActive(validFromUrl);
      setCourse(0);
    }
  }

  const select = (slug: string) => {
    if (slug === active) return;
    setActive(slug);
    setCourse(0);
    router.replace(`${pathname}?menu=${slug}`, { scroll: false });
  };

  const menu = menus.find((mn) => mn.slug === active) ?? menus[0];
  const current = menu.courses[Math.min(course, menu.courses.length - 1)];
  const image = current.image ?? menu.image;

  /* auto-advance through the courses */
  useEffect(() => {
    if (paused || reduce) return;
    const t = window.setInterval(() => setCourse((c) => (c + 1) % menu.courses.length), INTERVAL);
    return () => window.clearInterval(t);
  }, [paused, reduce, menu.courses.length, active]);

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

  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {/* ---------- menu tabs ---------- */}
      <div ref={tabsRef} role="tablist" aria-label="Menus" className="glass relative grid gap-1 rounded-[1.6rem] p-1.5 sm:grid-cols-3 sm:rounded-pill">
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

      {/* ---------- menu body ---------- */}
      <AnimatePresence mode="wait">
        <m.div
          key={menu.slug}
          role="tabpanel"
          id={`panel-${menu.slug}`}
          aria-labelledby={`tab-${menu.slug}`}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5, ease }}
          className="mt-12 grid gap-10 lg:grid-cols-12 lg:gap-14"
        >
          {/* dish showcase */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-32">
              <div className="glass-strong border-gradient relative overflow-hidden rounded-[2rem] p-3 shadow-glow-lg">
                <span aria-hidden className="orb orb-gold -right-[20%] -top-[25%] size-[70%] opacity-50" />
                <div className="tone-dark relative aspect-[4/5] overflow-hidden rounded-[1.25rem] bg-sand">
                  <AnimatePresence initial={false}>
                    <m.div
                      key={`${menu.slug}-${image.src}`}
                      className="absolute inset-0"
                      initial={{ opacity: 0, scale: 1.06 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.9, ease }}
                    >
                      <Image src={image.src} alt={image.alt} fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
                    </m.div>
                  </AnimatePresence>
                  <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-brown-deep/95 via-brown-deep/25 to-transparent" />
                  <Badge tone="solid" className="absolute left-4 top-4 z-[2]">
                    {menu.courseLabel}
                  </Badge>
                  <span aria-hidden className="pointer-events-none absolute right-4 top-0 hidden select-none font-display text-[7rem] leading-none text-outline-gold sm:block md:text-[9rem]">
                    {nn(course)}
                  </span>
                  <AnimatePresence mode="wait" initial={false}>
                    <m.div
                      key={`copy-${menu.slug}-${course}`}
                      className="absolute inset-x-0 bottom-0 p-6 md:p-7"
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.45, ease }}
                    >
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
                    </m.div>
                  </AnimatePresence>
                </div>
              </div>

              <dl className="mt-4 grid grid-cols-3 gap-3">
                {[
                  { k: "Courses", v: String(menu.courseCount) },
                  { k: "Kitchen", v: "100% Halal" },
                  { k: "Style", v: menu.kind === "tasting" ? "Tasting" : menu.kind === "specialties" ? "Family style" : "Bespoke" },
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
                    const draft = c.status === "draft";
                    return (
                      <li key={`${menu.slug}-${i}`}>
                        <button
                          type="button"
                          onMouseEnter={() => setCourse(i)}
                          onFocus={() => setCourse(i)}
                          onClick={() => setCourse(i)}
                          aria-pressed={on}
                          className={cn(
                            "group relative grid w-full grid-cols-[2.25rem_1fr] items-center gap-4 py-4 pl-3 text-left transition-colors duration-500 ease-luxe sm:grid-cols-[2.75rem_1fr_auto] md:py-5",
                            on ? "text-fg" : "text-fg/60 hover:text-fg",
                          )}
                        >
                          <span
                            aria-hidden
                            className={cn(
                              "absolute inset-y-3 left-0 w-0.5 rounded-full bg-gradient-to-b from-gold-light to-gold shadow-[0_0_12px_rgba(226,189,108,0.9)] transition-opacity duration-500",
                              on ? "opacity-100" : "opacity-0",
                            )}
                          />
                          <span className={cn("font-display text-2xl leading-none transition-colors duration-500", on ? "text-gold-gradient" : "text-fg/35")}>{nn(i)}</span>
                          <span className="min-w-0">
                            <span className="eyebrow block text-[0.52rem] text-muted">{c.title}</span>
                            <span className="mt-1 flex items-baseline gap-3">
                              <span
                                className={cn(
                                  "font-display text-xl leading-tight transition-transform duration-500 ease-luxe md:text-2xl",
                                  on && "translate-x-1",
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
                          <span className="hidden items-center gap-3 sm:flex">
                            <DietaryBadges tags={c.tags} />
                            <span
                              className={cn(
                                "grid size-9 shrink-0 place-items-center rounded-full border transition-all duration-500 ease-luxe",
                                on ? "border-accent bg-accent text-gold-light shadow-glow" : "border-line text-fg/40 group-hover:border-accent",
                              )}
                            >
                              <ArrowUpRight aria-hidden className="size-4" strokeWidth={1.5} />
                            </span>
                          </span>
                          {on && !reduce && !paused && (
                            <m.span
                              key={`progress-${menu.slug}-${course}`}
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

                <footer className="mt-8 flex flex-col gap-5 border-t border-line pt-7 sm:flex-row sm:items-center sm:justify-between">
                  <p className="max-w-xs text-xs leading-relaxed text-muted">
                    {menu.kind === "event" ? "Fully customisable around your guests, the season and your setting." : "Menus change with the season and the market."}
                  </p>
                  <div className="flex flex-wrap items-center gap-4">
                    {menu.pdfUrl && (
                      <Button href={menu.pdfUrl} variant="link" external icon={false}>
                        <FileText aria-hidden className="mr-2 inline size-3.5" strokeWidth={1.5} />
                        Menu PDF
                      </Button>
                    )}
                    <Button href={enquiryHref(menu.kind)} size="sm">
                      {menu.kind === "tasting" ? "Enquire about the tasting menu" : "Request this menu"}
                    </Button>
                  </div>
                </footer>
              </div>
            </article>
          </div>
        </m.div>
      </AnimatePresence>
    </div>
  );
}
