import type { ReactNode } from "react";
import type { ImageAsset } from "@/types/content";
import { cn } from "@/lib/cn";
import { Container } from "./Container";
import { Eyebrow } from "./Eyebrow";
import { Heading } from "./Heading";
import { ImageFrame } from "./ImageFrame";
import { Orbs } from "./Orbs";
import { Reveal } from "./Reveal";

type Props = {
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  image?: ImageAsset;
  /** Curtain reveal, a slow drift and a gold gleam on the hero photograph. */
  cinematicImage?: boolean;
  /** Which part of a wide photograph to keep in the tall hero crop. */
  imageFocal?: "center" | "top" | "bottom" | "left" | "right";
  tone?: "light" | "dark";
  children?: ReactNode;
  className?: string;
};

export function PageHero({ eyebrow, title, lead, image, cinematicImage = false, imageFocal = "center", children, className }: Props) {
  return (
    <header className={cn("relative overflow-hidden surface-gold pt-36 pb-16 text-fg md:pt-44 md:pb-24", className)}>
      <Orbs variant="mixed" pattern />
      <Container className="relative z-[2]">
        <div className={cn("grid gap-12 lg:gap-16", image ? "lg:grid-cols-12 lg:items-end" : "")}>
          <div className={cn(image ? "lg:col-span-7" : "max-w-4xl")}>
            <Reveal>
              <Eyebrow>{eyebrow}</Eyebrow>
            </Reveal>
            <Reveal delay={0.1}>
              <Heading as="h1" size="lg" className="mt-8">
                {title}
              </Heading>
            </Reveal>
            {lead && (
              <Reveal delay={0.2}>
                <p className="mt-8 max-w-xl text-lead text-fg/65">{lead}</p>
              </Reveal>
            )}
            {children && (
              <Reveal delay={0.3}>
                <div className="mt-10">{children}</div>
              </Reveal>
            )}
          </div>
          {image && (
            <div className="lg:col-span-5">
              <div className="relative mx-auto w-full max-w-sm sm:max-w-md lg:max-w-none">
                <span aria-hidden className="orb orb-gold -right-[20%] -top-[20%] size-[70%] opacity-60" />
                <ImageFrame
                  image={image}
                  ratio="4/5"
                  glow
                  reveal={cinematicImage ? "curtain" : "clip"}
                  drift={cinematicImage}
                  sheen={cinematicImage}
                  focal={imageFocal}
                  sizes="(min-width: 1024px) 40vw, (min-width: 640px) 28rem, 100vw"
                  priority
                  className="relative lg:-mb-32"
                />
              </div>
            </div>
          )}
        </div>
      </Container>
    </header>
  );
}
