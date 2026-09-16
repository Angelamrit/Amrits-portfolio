"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, type PointerEvent as ReactPointerEvent } from "react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import type { DietaryTag, ImageAsset } from "@/types/content";
import { cn } from "@/lib/cn";
import { Badge, DietaryBadges } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SpotlightCard } from "@/components/ui/SpotlightCard";

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
  courseLabel: string;
  intro: string;
  notes: string[];
  venue: string;
  pdfUrl?: string;
  image: ImageAsset;
  courses: ResolvedCourse[];
};

const ease = [0.16, 1, 0.3, 1] as const;

export function MenuSwitcher({ menus }: { menus: ResolvedMenu[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const reduce = useReducedMotion();
  const fromUrl = params.get("menu");
  const validFromUrl = menus.find((m) => m.slug === fromUrl)?.slug;
  const [active, setActive] = useState(validFromUrl ?? menus[0].slug);
  const [prevUrl, setPrevUrl] = useState(fromUrl);

  /** The course whose dish is on show: pointer hover (desktop) or a tap (touch). */
  const [hovered, setHovered] = useState<number | null>(null);
  const [pinned, setPinned] = useState<number | null>(null);

  const clearCourse = () => {
    setHovered(null);
    setPinned(null);
  };

  if (fromUrl !== prevUrl) {
    setPrevUrl(fromUrl);
    if (validFromUrl) {
      setActive(validFromUrl);
      clearCourse();
    }
  }

  const select = (slug: string) => {
    setActive(slug);
    clearCourse();
    router.replace(`${pathname}?menu=${slug}`, { scroll: false });
  };

  const menu = menus.find((m) => m.slug === active) ?? menus[0];

  const shownIndex = hovered ?? pinned;
  const shownCourse = shownIndex !== null ? menu.courses[shownIndex] : undefined;
  const dish = shownCourse?.image;
  const frame = dish ?? menu.image;
  const badge = dish && shownIndex !== null ? `Course ${String(shownIndex + 1).padStart(2, "0")}` : menu.courseLabel;

  return (
    <div>
      <div role="tablist" aria-label="Menu" className="glass inline-flex max-w-full flex-wrap gap-1 rounded-[1.4rem] p-1.5 sm:rounded-pill">
        {menus.map((mn) => {
          const selected = mn.slug === active;
          return (
            <button
              key={mn.slug}
              role="tab"
              type="button"
              id={`tab-${mn.slug}`}
              aria-selected={selected}
              aria-controls={`panel-${mn.slug}`}
              onClick={() => select(mn.slug)}
              className={cn(
                "relative rounded-pill px-5 py-3 font-sans text-[0.68rem] font-semibold uppercase tracking-[0.2em] transition-colors duration-300",
                selected ? "text-charcoal" : "text-fg/65 hover:text-fg",
              )}
            >
              {selected && (
                <m.span
                  layoutId="menu-tab"
                  aria-hidden
                  className="absolute inset-0 rounded-pill bg-gradient-to-r from-gold-light via-gold to-gold-deep shadow-[0_10px_30px_-10px_rgba(201,169,98,0.8)]"
                  transition={{ type: "spring", stiffness: 320, damping: 32 }}
                />
              )}
              <span className="relative">{mn.name}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <m.div
          key={menu.slug}
          role="tabpanel"
          id={`panel-${menu.slug}`}
          aria-labelledby={`tab-${menu.slug}`}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5, ease }}
          className="mt-12 grid gap-10 lg:grid-cols-12 lg:gap-14"
        >
          <div className="lg:col-span-4">
            <div className="mx-auto w-full max-w-sm sm:max-w-md lg:max-w-none lg:sticky lg:top-32">
              <div className="relative">
                <span aria-hidden className="orb orb-gold -left-[20%] -top-[20%] size-[70%] opacity-50" />

                {/* The frame beside the courses: the menu photograph, or the dish being pointed at. */}
                <div className="border-gradient relative aspect-[4/5] overflow-hidden rounded-frame bg-sand shadow-glow-lg">
                  <AnimatePresence initial={false}>
                    <m.div
                      key={frame.src}
                      className="absolute inset-0"
                      initial={{ opacity: 0, scale: reduce ? 1 : 1.08 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1 }}
                      transition={{ duration: 0.7, ease }}
                    >
                      <Image
                        src={frame.src}
                        alt={frame.alt}
                        fill
                        sizes="(min-width: 1024px) 33vw, 100vw"
                        quality={78}
                        className="object-cover"
                      />
                      {!reduce && (
                        <m.span
                          aria-hidden
                          className="pointer-events-none absolute inset-y-0 w-1/3 -skew-x-[18deg] bg-gradient-to-r from-transparent via-gold-light/35 to-transparent"
                          initial={{ left: "-45%" }}
                          animate={{ left: "125%" }}
                          transition={{ duration: 0.95, ease }}
                        />
                      )}
                    </m.div>
                  </AnimatePresence>

                  <AnimatePresence>
                    {dish && shownCourse && (
                      <m.figcaption
                        key="dish-caption"
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 12 }}
                        transition={{ duration: 0.45, ease }}
                        className="absolute inset-x-0 bottom-0 z-[2] bg-gradient-to-t from-brown-deep via-brown-deep/75 to-transparent p-5 pt-20"
                      >
                        <p className="eyebrow text-[0.55rem] text-gold-light/80">{shownCourse.title}</p>
                        <p className="mt-1.5 font-display text-display-sm font-light text-gold-light">{shownCourse.name}</p>
                      </m.figcaption>
                    )}
                  </AnimatePresence>
                </div>

                <Badge tone="solid" className="absolute left-4 top-4 z-[3]">
                  <AnimatePresence mode="wait" initial={false}>
                    <m.span
                      key={badge}
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.25, ease }}
                      className="block"
                    >
                      {badge}
                    </m.span>
                  </AnimatePresence>
                </Badge>
              </div>
              <p className="eyebrow mt-6 text-[0.6rem] text-gold">{menu.venue}</p>
              <p className="mt-3 text-sm leading-relaxed text-fg/70">{menu.intro}</p>
              <ul className="mt-5 space-y-1.5 text-xs text-muted">
                {menu.notes.map((n) => (
                  <li key={n} className="flex gap-2">
                    <span aria-hidden className="mt-1.5 size-1 shrink-0 rounded-full bg-gold" />
                    {n}
                  </li>
                ))}
              </ul>
              {menu.pdfUrl && (
                <Button href={menu.pdfUrl} variant="link" className="mt-6" external>
                  Download full menu PDF
                </Button>
              )}
            </div>
          </div>

          <div className="lg:col-span-8">
            <p className="eyebrow mb-4 flex items-center gap-2 text-[0.6rem] text-gold-light/80">
              <span aria-hidden className="size-1 rounded-full bg-gold shadow-[0_0_8px_rgba(226,189,108,0.9)]" />
              Tap a course to see the dish
            </p>
            <ol className="space-y-3">
              {menu.courses.map((course, i) => {
                const hasImage = Boolean(course.image);
                const lit = shownIndex === i && hasImage;
                const open = pinned === i && hasImage;

                const onEnter = (e: ReactPointerEvent<HTMLButtonElement>) => {
                  if (e.pointerType === "mouse") setHovered(i);
                };
                const onLeave = (e: ReactPointerEvent<HTMLButtonElement>) => {
                  if (e.pointerType === "mouse") setHovered((h) => (h === i ? null : h));
                };

                return (
                  <li key={`${menu.slug}-${i}`}>
                    <SpotlightCard
                      className={cn(
                        "group relative overflow-hidden transition-all duration-500 ease-luxe",
                        course.status === "draft" && "opacity-80",
                        lit && "border-gold/60 shadow-glow",
                      )}
                      tilt={2}
                    >
                      <div className="relative grid gap-4 p-4 sm:grid-cols-[5.5rem_1fr] sm:gap-6 md:p-5">
                        <div className="relative aspect-square w-[5.5rem] overflow-hidden rounded-xl bg-sand sm:w-auto">
                          {course.image ? (
                            <Image
                              src={course.image.src}
                              alt={course.image.alt}
                              fill
                              sizes="120px"
                              className={cn(
                                "object-cover transition-transform duration-[1200ms] ease-luxe",
                                lit ? "scale-[1.12]" : "group-hover:scale-[1.06]",
                              )}
                            />
                          ) : (
                            <div className="grid h-full place-items-center font-display text-3xl text-gold-gradient">?</div>
                          )}
                          <span className="absolute left-1.5 top-1.5 z-[2] rounded-md bg-brown-deep/80 px-1.5 py-0.5 font-display text-sm text-gold-light backdrop-blur">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          {hasImage && (
                            <span
                              aria-hidden
                              className={cn(
                                "pointer-events-none absolute inset-0 rounded-xl border transition-colors duration-500 ease-luxe",
                                lit ? "border-gold-light/70" : "border-transparent",
                              )}
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="eyebrow text-[0.6rem] text-muted">{course.title}</p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-3">
                            <h3
                              className={cn(
                                "font-display text-display-sm font-light transition-colors duration-500",
                                course.status === "draft" ? "italic text-fg/60" : lit ? "text-gold-light" : "text-fg",
                              )}
                            >
                              {course.name}
                            </h3>
                            {course.status === "draft" && <Badge tone="gold">To be confirmed with Chef</Badge>}
                          </div>
                          {course.description && <p className="mt-2 max-w-lg text-sm leading-relaxed text-fg/65">{course.description}</p>}
                          {course.tags.length > 0 && (
                            <div className="mt-3">
                              <DietaryBadges tags={course.tags} />
                            </div>
                          )}
                        </div>

                        {hasImage && (
                          <button
                            type="button"
                            aria-pressed={open}
                            aria-label={`Show a photograph of ${course.name}`}
                            onClick={() => setPinned((p) => (p === i ? null : i))}
                            onPointerEnter={onEnter}
                            onPointerLeave={onLeave}
                            onFocus={() => setHovered(i)}
                            onBlur={() => setHovered((h) => (h === i ? null : h))}
                            className="absolute inset-0 z-[4] cursor-pointer"
                          />
                        )}
                      </div>

                      {/* Below lg the frame above has scrolled away, so the dish opens in place. */}
                      <AnimatePresence initial={false}>
                        {open && course.image && (
                          <m.div
                            key="inline-dish"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.5, ease }}
                            className="overflow-hidden lg:hidden"
                          >
                            <div className="relative m-4 mt-0 aspect-[16/10] overflow-hidden rounded-xl bg-sand md:m-5 md:mt-0">
                              <Image
                                src={course.image.src}
                                alt={course.image.alt}
                                fill
                                sizes="(min-width: 640px) 60vw, 92vw"
                                quality={78}
                                className="object-cover"
                              />
                              <div
                                aria-hidden
                                className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-brown-deep/90 to-transparent p-4 pt-12"
                              />
                              <p className="absolute inset-x-0 bottom-0 p-4 font-display text-xl font-light text-gold-light">
                                {course.name}
                              </p>
                            </div>
                          </m.div>
                        )}
                      </AnimatePresence>
                    </SpotlightCard>
                  </li>
                );
              })}
            </ol>
          </div>
        </m.div>
      </AnimatePresence>
    </div>
  );
}
