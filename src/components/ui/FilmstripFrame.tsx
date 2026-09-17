"use client";

import Image from "next/image";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import type { ImageAsset } from "@/types/content";
import { cn } from "@/lib/cn";

const ease = [0.16, 1, 0.3, 1] as const;

type Props = {
  images: ImageAsset[];
  interval?: number;
  sizes?: string;
  className?: string;
};

/**
 * Fills its positioned parent with a slow, auto-advancing sequence of photos —
 * a film-reel crossfade with a continuous Ken Burns drift on each frame.
 */
export function FilmstripFrame({ images, interval = 2600, sizes = "(min-width: 768px) 50vw, 100vw", className }: Props) {
  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce || images.length < 2) return;
    const id = window.setInterval(() => setActive((a) => (a + 1) % images.length), interval);
    return () => window.clearInterval(id);
  }, [reduce, images.length, interval]);

  if (reduce) {
    return (
      <div className={cn("absolute inset-0", className)}>
        <Image src={images[0].src} alt={images[0].alt} fill sizes={sizes} quality={78} className="object-cover opacity-90" />
      </div>
    );
  }

  const frame = images[active];

  return (
    <div className={cn("absolute inset-0", className)}>
      <AnimatePresence initial={false}>
        <m.div
          key={frame.src}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1, ease }}
        >
          <m.div className="absolute inset-0" initial={{ scale: 1 }} animate={{ scale: 1.08 }} transition={{ duration: (interval + 1100) / 1000, ease: "linear" }}>
            <Image src={frame.src} alt={frame.alt} fill sizes={sizes} quality={78} className="object-cover opacity-90" />
          </m.div>
        </m.div>
      </AnimatePresence>

      {images.length > 1 && (
        <div aria-hidden className="absolute right-5 top-5 z-2 flex items-center gap-1.5">
          {images.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1 rounded-full transition-all duration-500 ease-luxe",
                i === active ? "w-5 bg-gold shadow-[0_0_8px_rgba(226,189,108,0.8)]" : "w-1.5 bg-fg/35",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
