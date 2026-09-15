import type { Experience } from "@/types/content";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { ImageFrame } from "@/components/ui/ImageFrame";
import { Reveal } from "@/components/ui/Reveal";
import { SpotlightCard } from "@/components/ui/SpotlightCard";

export function ExperienceSplit({ experience, index }: { experience: Experience; index: number }) {
  const flip = index % 2 === 1;
  return (
    <article id={experience.slug} className="relative scroll-mt-28 py-14 md:py-20">
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
          <div className={cn("relative lg:col-span-5", flip ? "lg:order-2 lg:col-start-8" : "lg:order-1")}>
            <span aria-hidden className="orb orb-gold -left-[20%] -top-[20%] size-[70%] opacity-50" />
            <ImageFrame image={experience.image} ratio="4/5" glow sizes="(min-width: 1024px) 40vw, 100vw" className="relative" />
            <span
              aria-hidden
              className="pointer-events-none absolute -bottom-6 -right-2 select-none font-display text-[6rem] leading-none text-outline-gold md:text-[8rem]"
            >
              {String(index + 1).padStart(2, "0")}
            </span>
          </div>
          <div className={cn("lg:col-span-6", flip ? "lg:order-1 lg:col-start-1" : "lg:order-2 lg:col-start-7")}>
            <Reveal>
              <p className="eyebrow">Experience {String(index + 1).padStart(2, "0")}</p>
              <h2 className="mt-4 font-display text-display-md font-light text-gold-gradient">{experience.name}</h2>
              <p className="mt-6 max-w-lg text-lead text-fg/70">{experience.description[0]}</p>
              <ul className="mt-6 flex flex-wrap gap-2" aria-label="Ideal for">
                {experience.guestRange && (
                  <li>
                    <Badge tone="gold">{experience.guestRange}</Badge>
                  </li>
                )}
                {experience.idealFor.map((i) => (
                  <li key={i}>
                    <Badge>{i}</Badge>
                  </li>
                ))}
              </ul>
              <SpotlightCard className="mt-8 p-6" tilt={2}>
                <p className="eyebrow text-[0.6rem] text-muted">Included</p>
                <ul className="mt-3 grid gap-2 text-sm text-fg/75 sm:grid-cols-2">
                  {experience.includes.map((inc) => (
                    <li key={inc} className="flex items-start gap-3">
                      <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-gold shadow-[0_0_8px_rgba(201,169,98,0.9)]" />
                      {inc}
                    </li>
                  ))}
                </ul>
              </SpotlightCard>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button href={`/contact?experience=${experience.slug}`}>Enquire</Button>
                <Button href={`/experiences/${experience.slug}`} variant="glass">
                  Details
                </Button>
              </div>
            </Reveal>
          </div>
        </div>
      </Container>
    </article>
  );
}
