"use client";

import Image from "next/image";
import { m, useInView, useReducedMotion } from "motion/react";
import { useRef } from "react";
import type { ImageAsset } from "@/types/content";
import { cn } from "@/lib/cn";

type Ratio = "3/4" | "4/5" | "1/1" | "4/3" | "3/2" | "16/9" | "21/9" | "fill";
type Focal = "center" | "top" | "bottom" | "left" | "right";

const ratios: Record<Ratio, string> = {
  "3/4": "aspect-[3/4]",
  "4/5": "aspect-[4/5]",
  "1/1": "aspect-square",
  "4/3": "aspect-[4/3]",
  "3/2": "aspect-[3/2]",
  "16/9": "aspect-video",
  "21/9": "aspect-[21/9]",
  fill: "absolute inset-0",
};

const focals: Record<Focal, string> = {
  center: "object-center",
  top: "object-top",
  bottom: "object-bottom",
  left: "object-left",
  right: "object-right",
};

type Props = {
  image: ImageAsset;
  ratio?: Ratio;
  /** `curtain` is `clip` with a gold light bar riding the reveal edge. */
  reveal?: "clip" | "fade" | "curtain" | "none";
  vignette?: boolean;
  hover?: boolean;
  /** Premium hover: a gold gleam sweeps across the photo and the frame edge lights up. */
  sheen?: boolean;
  /** Continuous, very slow Ken Burns drift. Not for use together with `hover`. */
  drift?: boolean;
  /** Which part of the photo survives a tight crop. */
  focal?: Focal;
  /** Gold gradient border + glow, rounded corners. */
  glow?: boolean;
  rounded?: boolean;
  priority?: boolean;
  sizes?: string;
  caption?: string;
  className?: string;
  imgClassName?: string;
  quality?: number;
};

const ease = [0.16, 1, 0.3, 1] as const;

export function ImageFrame({
  image,
  ratio = "4/5",
  reveal = "clip",
  vignette = false,
  hover = false,
  sheen = false,
  drift = false,
  focal = "center",
  glow = false,
  rounded = true,
  priority = false,
  sizes = "(min-width: 1024px) 50vw, 100vw",
  caption,
  className,
  imgClassName,
  quality = 78,
}: Props) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  const animate = reveal !== "none" && !reduce;
  const shown = !animate || inView;
  const isFill = ratio === "fill";
  const clips = reveal === "clip" || reveal === "curtain";

  const img = (
    <Image
      src={image.src}
      alt={image.alt}
      fill
      priority={priority}
      sizes={sizes}
      quality={quality}
      className={cn(
        "object-cover",
        focals[focal],
        drift && "animate-kenburns",
        hover && "transition-transform duration-[1400ms] ease-luxe group-hover:scale-[1.05]",
        imgClassName,
      )}
    />
  );

  const frame = (
    <m.div
      className={cn(
        "group relative h-full w-full overflow-hidden bg-sand",
        rounded && !isFill && "rounded-frame",
        ratios[ratio],
        vignette && "vignette",
      )}
      initial={false}
      animate={clips ? { clipPath: shown ? "inset(0% 0% 0% 0%)" : "inset(0% 0% 100% 0%)" } : { opacity: shown ? 1 : 0 }}
      transition={{ duration: 1.4, ease }}
      style={animate ? undefined : { clipPath: "none", opacity: 1 }}
    >
      <m.div
        className="absolute inset-0"
        initial={false}
        animate={{ scale: shown ? 1 : clips ? 1.12 : 1.04 }}
        transition={{ duration: 1.6, ease }}
      >
        {img}
      </m.div>

      {/* The reveal edge: a gold filament that travels down with the curtain. */}
      {reveal === "curtain" && animate && (
        <m.div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[3]"
          initial={false}
          animate={{ y: shown ? "100%" : "0%", opacity: shown ? 0 : 1 }}
          transition={{ y: { duration: 1.4, ease }, opacity: { duration: 0.4, delay: shown ? 1.1 : 0 } }}
        >
          <span className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-gold-light to-transparent shadow-[0_0_30px_6px_rgba(240,217,160,0.5)]" />
        </m.div>
      )}

      {sheen && (
        <>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[2] rounded-[inherit] border border-gold-light/0 transition-colors duration-700 ease-luxe group-hover:border-gold-light/45"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -inset-y-[25%] -left-[65%] z-[2] w-[45%] -skew-x-[18deg] bg-gradient-to-r from-transparent via-gold-light/30 to-transparent opacity-0 transition-all duration-[1100ms] ease-luxe group-hover:left-[120%] group-hover:opacity-100"
          />
        </>
      )}
    </m.div>
  );

  const wrapped = (
    <div
      ref={ref}
      className={cn(
        isFill ? "absolute inset-0" : "relative",
        glow && !isFill && "rounded-frame border-gradient shadow-glow-lg",
        className,
      )}
    >
      {frame}
    </div>
  );

  if (!caption) return wrapped;

  return (
    <figure className="space-y-3">
      {wrapped}
      <figcaption className="eyebrow text-muted">{caption}</figcaption>
    </figure>
  );
}
