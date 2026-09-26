import Image from "next/image";
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
  // The reveal is CSS (see "Image reveals" in globals.css), started by the
  // shared observer in PageEffects; reduced motion is handled there too. A
  // priority image is above the fold and usually the page's largest paint, so
  // it is never held back behind a reveal — it shows from the first frame.
  const animate = reveal !== "none" && !priority;
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
        focals[focal],
        drift && "animate-kenburns",
        hover && "transition-transform duration-[1400ms] ease-luxe group-hover:scale-[1.05]",
        imgClassName,
      )}
    />
  );

  const frame = (
    <div
      data-img-reveal={animate ? reveal : undefined}
      suppressHydrationWarning
      className={cn(
        "group relative h-full w-full overflow-hidden bg-sand",
        rounded && !isFill && "rounded-frame",
        ratios[ratio],
        vignette && "vignette",
      )}
    >
      <div className="img-reveal-scale absolute inset-0">{img}</div>

      {/* The reveal edge: a gold filament that travels down with the curtain. */}
      {reveal === "curtain" && animate && (
        <div aria-hidden className="img-reveal-filament pointer-events-none absolute inset-0 z-[3]">
          <span className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-gold-light to-transparent shadow-[0_0_30px_6px_rgba(240,217,160,0.5)]" />
        </div>
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
    </div>
  );

  const wrapped = (
    <div
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
