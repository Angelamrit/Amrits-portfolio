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
  tone?: "light" | "dark";
  children?: ReactNode;
  className?: string;
};

export function PageHero({ eyebrow, title, lead, image, children, className }: Props) {
  return (
    <header className={cn("relative overflow-hidden bg-bg pt-36 pb-16 text-fg md:pt-44 md:pb-24", className)}>
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
              <div className="relative">
                <span aria-hidden className="orb orb-gold -right-[20%] -top-[20%] size-[70%] opacity-60" />
                <ImageFrame image={image} ratio="4/5" glow sizes="(min-width: 1024px) 40vw, 100vw" priority className="relative lg:-mb-32" />
              </div>
            </div>
          )}
        </div>
      </Container>
    </header>
  );
}
