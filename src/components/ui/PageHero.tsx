import type { CSSProperties, ReactNode } from "react";
import type { ImageAsset } from "@/types/content";
import { cn } from "@/lib/cn";
import { Container } from "./Container";
import { Eyebrow } from "./Eyebrow";
import { Heading } from "./Heading";
import { ImageFrame } from "./ImageFrame";
import { Orbs } from "./Orbs";

type Props = {
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  image?: ImageAsset;
  /** Curtain reveal, a slow drift and a gold gleam on the hero photograph. */
  cinematicImage?: boolean;
  /** Which part of a wide photograph to keep in the tall hero crop. */
  imageFocal?: "center" | "top" | "bottom" | "left" | "right";
  /**
   * `natural` gives the frame the photograph's own proportions, so the whole of
   * it shows. The slow drift is left off then: it zooms in and would crop it again.
   */
  imageRatio?: "4/5" | "natural";
  tone?: "light" | "dark";
  children?: ReactNode;
  className?: string;
};

export function PageHero({ eyebrow, title, lead, image, cinematicImage = false, imageFocal = "center", imageRatio = "4/5", children, className }: Props) {
  return (
    <header className={cn("relative overflow-hidden surface-gold pt-36 pb-16 text-fg md:pt-44 md:pb-24", className)}>
      <Orbs variant="mixed" pattern />
      <Container className="relative z-[2]">
        <div className={cn("grid gap-12 lg:gap-16", image ? "lg:grid-cols-12 lg:items-end" : "")}>
          <div className={cn(image ? "lg:col-span-7" : "max-w-4xl")}>
            <div className="hero-in" style={{ "--hero-delay": "0.05s" } as CSSProperties}>
              <Eyebrow>{eyebrow}</Eyebrow>
            </div>
            <div className="hero-in" style={{ "--hero-delay": "0.12s" } as CSSProperties}>
              <Heading as="h1" size="lg" className="mt-8">
                {title}
              </Heading>
            </div>
            {lead && (
              <div className="hero-in" style={{ "--hero-delay": "0.2s" } as CSSProperties}>
                <p className="mt-8 max-w-xl text-lead text-fg/65">{lead}</p>
              </div>
            )}
            {children && (
              <div className="hero-in" style={{ "--hero-delay": "0.28s" } as CSSProperties}>
                <div className="mt-10">{children}</div>
              </div>
            )}
          </div>
          {image && (
            <div className="lg:col-span-5">
              <div className="relative mx-auto w-full max-w-sm sm:max-w-md lg:max-w-none">
                <span aria-hidden className="orb orb-gold -right-[20%] -top-[20%] size-[70%] opacity-60" />
                {/* It hangs below the copy, but by less than the header's own bottom padding
                    (md:pb-24): the header clips its overflow, and a deeper hang cut the
                    photograph's rounded foot and gold edge off flat. */}
                <ImageFrame
                  image={image}
                  ratio={imageRatio}
                  glow
                  reveal={cinematicImage ? "curtain" : "clip"}
                  drift={cinematicImage && imageRatio !== "natural"}
                  sheen={cinematicImage}
                  focal={imageFocal}
                  sizes="(min-width: 1024px) 40vw, (min-width: 640px) 28rem, 100vw"
                  priority
                  className="relative lg:-mb-20"
                />
              </div>
            </div>
          )}
        </div>
      </Container>
    </header>
  );
}
