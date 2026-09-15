"use client";

import Image from "next/image";
import { m, useInView, useReducedMotion } from "motion/react";
import { useRef } from "react";
import type { ImageAsset } from "@/types/content";
import { cn } from "@/lib/cn";

type Ratio = "3/4" | "4/5" | "1/1" | "4/3" | "3/2" | "16/9" | "21/9" | "fill";

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

type Props = {
  image: ImageAsset;
  ratio?: Ratio;
  reveal?: "clip" | "fade" | "none";
  vignette?: boolean;
  hover?: boolean;
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
      animate={
        reveal === "clip"
          ? { clipPath: shown ? "inset(0% 0% 0% 0%)" : "inset(0% 0% 100% 0%)" }
          : { opacity: shown ? 1 : 0 }
      }
      transition={{ duration: 1.4, ease }}
      style={animate ? undefined : { clipPath: "none", opacity: 1 }}
    >
      <m.div
        className="absolute inset-0"
        initial={false}
        animate={{ scale: shown ? 1 : reveal === "clip" ? 1.12 : 1.04 }}
        transition={{ duration: 1.6, ease }}
      >
        {img}
      </m.div>
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
