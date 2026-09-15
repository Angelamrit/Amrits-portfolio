"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { GalleryCategory, GalleryItem } from "@/types/content";
import { cn } from "@/lib/cn";

type Category = { value: GalleryCategory | "all"; label: string };

const ease = [0.16, 1, 0.3, 1] as const;

export function GalleryGrid({ items, categories }: { items: GalleryItem[]; categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const fromUrl = params.get("category");
  const validFromUrl = categories.find((c) => c.value === fromUrl)?.value;

  const [filter, setFilter] = useState<GalleryCategory | "all">(validFromUrl ?? "all");
  const [prevUrl, setPrevUrl] = useState(fromUrl);

  // Follow later ?category= changes (e.g. a second click in the header menu).
  if (fromUrl !== prevUrl) {
    setPrevUrl(fromUrl);
    setFilter(validFromUrl ?? "all");
  }

  const select = (value: GalleryCategory | "all") => {
    setFilter(value);
    router.replace(value === "all" ? pathname : `${pathname}?category=${value}`, { scroll: false });
  };

  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const reduce = useReducedMotion();
  const dialogRef = useRef<HTMLDialogElement>(null);

  const visible = filter === "all" ? items : items.filter((i) => i.category === filter);

  const close = useCallback(() => setOpenIndex(null), []);
  const step = useCallback(
    (dir: 1 | -1) => setOpenIndex((i) => (i === null ? null : (i + dir + visible.length) % visible.length)),
    [visible.length],
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (openIndex !== null && !dialog.open) dialog.showModal();
    if (openIndex === null && dialog.open) dialog.close();
  }, [openIndex]);

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [openIndex, step]);

  const current = openIndex !== null ? visible[openIndex] : null;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4">
        <div role="group" aria-label="Filter gallery" className="glass inline-flex max-w-full flex-wrap gap-1 rounded-[1.4rem] p-1.5 sm:rounded-pill">
          {categories.map((c) => {
            const selected = c.value === filter;
            return (
              <button
                key={c.value}
                type="button"
                aria-pressed={selected}
                onClick={() => select(c.value)}
                className={cn(
                  "relative rounded-pill px-4 py-2.5 font-sans text-[0.64rem] font-semibold uppercase tracking-[0.2em] transition-colors duration-300",
                  selected ? "text-charcoal" : "text-fg/65 hover:text-fg",
                )}
              >
                {selected && (
                  <m.span
                    layoutId="gallery-filter"
                    aria-hidden
                    className="absolute inset-0 rounded-pill bg-gradient-to-r from-gold-light via-gold to-gold-deep"
                    transition={{ type: "spring", stiffness: 320, damping: 32 }}
                  />
                )}
                <span className="relative">{c.label}</span>
              </button>
            );
          })}
        </div>
        <span className="ml-auto eyebrow text-muted">{visible.length} images</span>
      </div>

      <ul className="mt-10 columns-1 gap-4 sm:columns-2 lg:columns-3 [&>li]:mb-4 [&>li]:break-inside-avoid">
        <AnimatePresence initial={false}>
          {visible.map((item, i) => {
            const ratio = item.span === "wide" ? "aspect-[4/3]" : item.span === "tall" ? "aspect-[3/4]" : "aspect-square";
            return (
              <m.li
                key={item.id}
                layout={!reduce}
                initial={reduce ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease, delay: Math.min(i * 0.03, 0.4) }}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(i)}
                  className={cn(
                    "tone-dark group relative block w-full overflow-hidden rounded-frame bg-sand transition-shadow duration-500 hover:shadow-glow",
                    ratio,
                  )}
                  aria-label={`Open image: ${item.caption ?? item.image.alt}`}
                >
                  <Image
                    src={item.image.src}
                    alt={item.image.alt}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-[1400ms] ease-luxe group-hover:scale-[1.05]"
                  />
                  <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brown-deep/80 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  {item.caption && (
                    <span className="glass pointer-events-none absolute bottom-4 left-4 translate-y-2 rounded-pill px-4 py-2 eyebrow text-fg opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                      {item.caption}
                    </span>
                  )}
                </button>
              </m.li>
            );
          })}
        </AnimatePresence>
      </ul>

      <dialog
        ref={dialogRef}
        onClose={close}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
        className="tone-dark m-auto h-[100dvh] max-h-none w-screen max-w-none bg-brown-deep/90 p-0 text-fg backdrop:bg-brown-deep/90 backdrop:backdrop-blur-xl open:flex open:items-center open:justify-center"
        aria-label="Image viewer"
      >
        {current && (
          <div className="relative flex h-full w-full flex-col items-center justify-center px-4 py-16 sm:px-16">
            <div className="relative h-full w-full max-w-6xl overflow-hidden rounded-frame">
              <Image key={current.id} src={current.image.src} alt={current.image.alt} fill sizes="100vw" quality={85} className="object-contain" />
            </div>
            <p className="glass mt-4 rounded-pill px-5 py-2 eyebrow text-fg/80">
              {current.caption ?? current.image.alt} · {openIndex! + 1} / {visible.length}
            </p>
            <button type="button" onClick={close} aria-label="Close" className="glass absolute right-4 top-4 grid size-11 place-items-center rounded-full hover:border-gold">
              <X className="size-5" strokeWidth={1.25} />
            </button>
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous image"
              className="glass absolute left-2 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full hover:border-gold sm:left-4"
            >
              <ChevronLeft className="size-5" strokeWidth={1.25} />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next image"
              className="glass absolute right-2 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full hover:border-gold sm:right-4"
            >
              <ChevronRight className="size-5" strokeWidth={1.25} />
            </button>
          </div>
        )}
      </dialog>
    </div>
  );
}
