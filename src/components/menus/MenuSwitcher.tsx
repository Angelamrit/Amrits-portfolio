"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, m } from "motion/react";
import type { DietaryTag, ImageAsset } from "@/types/content";
import { cn } from "@/lib/cn";
import { Badge, DietaryBadges } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ImageFrame } from "@/components/ui/ImageFrame";
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
  const fromUrl = params.get("menu");
  const validFromUrl = menus.find((m) => m.slug === fromUrl)?.slug;
  const [active, setActive] = useState(validFromUrl ?? menus[0].slug);
  const [prevUrl, setPrevUrl] = useState(fromUrl);

  if (fromUrl !== prevUrl) {
    setPrevUrl(fromUrl);
    if (validFromUrl) setActive(validFromUrl);
  }

  const select = (slug: string) => {
    setActive(slug);
    router.replace(`${pathname}?menu=${slug}`, { scroll: false });
  };

  const menu = menus.find((m) => m.slug === active) ?? menus[0];

  return (
    <div>
      <div role="tablist" aria-label="Menus" className="glass inline-flex max-w-full flex-wrap gap-1 rounded-[1.4rem] p-1.5 sm:rounded-pill">
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
            <div className="lg:sticky lg:top-32">
              <div className="relative">
                <span aria-hidden className="orb orb-gold -left-[20%] -top-[20%] size-[70%] opacity-50" />
                <ImageFrame image={menu.image} ratio="4/5" reveal="fade" glow sizes="(min-width: 1024px) 33vw, 100vw" className="relative" />
                <Badge tone="solid" className="absolute left-4 top-4 z-[3]">
                  {menu.courseLabel}
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

          <ol className="space-y-3 lg:col-span-8">
            {menu.courses.map((course, i) => (
              <li key={`${menu.slug}-${i}`}>
                <SpotlightCard className={cn("grid gap-4 p-4 sm:grid-cols-[5.5rem_1fr] sm:gap-6 md:p-5", course.status === "draft" && "opacity-80")} tilt={2}>
                  <div className="relative aspect-square w-[5.5rem] overflow-hidden rounded-xl bg-sand sm:w-auto">
                    {course.image ? (
                      <Image src={course.image.src} alt={course.image.alt} fill sizes="120px" className="object-cover" />
                    ) : (
                      <div className="grid h-full place-items-center font-display text-3xl text-gold-gradient">?</div>
                    )}
                    <span className="absolute left-1.5 top-1.5 rounded-md bg-brown-deep/80 px-1.5 py-0.5 font-display text-sm text-gold-light backdrop-blur">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="eyebrow text-[0.6rem] text-muted">{course.title}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-3">
                      <h3 className={cn("font-display text-display-sm font-light", course.status === "draft" ? "italic text-fg/60" : "text-fg")}>
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
                </SpotlightCard>
              </li>
            ))}
          </ol>
        </m.div>
      </AnimatePresence>
    </div>
  );
}
