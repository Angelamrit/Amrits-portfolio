import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { experiences } from "@/data/experiences";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading, Em } from "@/components/ui/Heading";
import { ImageFrame } from "@/components/ui/ImageFrame";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SpotlightCard } from "@/components/ui/SpotlightCard";

/* Bento layout: 6 columns */
const layout = [
  "md:col-span-4 aspect-[4/3] md:aspect-[16/8]",
  "md:col-span-2 aspect-[4/3] md:aspect-auto",
  "md:col-span-2 aspect-[4/3]",
  "md:col-span-2 aspect-[4/3]",
  "md:col-span-2 aspect-[4/3]",
  "md:col-span-6 aspect-[4/3] md:aspect-[21/6]",
];

export function ExperiencesGrid() {
  return (
    <Section id="experiences" tone="raised" orbs="ember" divider className="scroll-mt-20">
      <Container>
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <Reveal>
              <Eyebrow>04 · Private Experiences</Eyebrow>
            </Reveal>
            <Reveal delay={0.1}>
              <Heading as="h2" size="lg" className="mt-8">
                Six ways to book <Em shimmer>Chef Amrit.</Em>
              </Heading>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="mt-8 max-w-xl text-lead text-fg/65">
                Beyond the restaurant, he brings the kitchen of Angel to you: from an intimate dinner at home to a wedding, a corporate
                evening or a residency on a villa or yacht.
              </p>
            </Reveal>
          </div>
          <Reveal delay={0.2}>
            <Button href="/experiences" variant="glass">
              View all experiences
            </Button>
          </Reveal>
        </div>

        <RevealGroup className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-6">
          {experiences.map((exp, i) => (
            <RevealItem key={exp.slug} className={cn("relative", layout[i])}>
              <SpotlightCard as="article" glass={false} tilt={3} className="tone-dark group relative h-full overflow-hidden bg-surface-2">
                <Link href={`/experiences/${exp.slug}`} className="absolute inset-0 z-[4]" aria-label={exp.name} />
                <ImageFrame image={exp.image} ratio="fill" reveal="none" hover sizes="(min-width: 768px) 50vw, 100vw" imgClassName="opacity-90" />
                <div aria-hidden className="absolute inset-0 z-[1] bg-gradient-to-t from-brown-deep via-brown-deep/40 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 z-[2] flex items-end justify-between gap-4 p-6 md:p-7">
                  <div>
                    <p className="eyebrow text-gold-light/90">
                      {String(i + 1).padStart(2, "0")}
                      {exp.guestRange && <span className="ml-3 text-fg/60">{exp.guestRange}</span>}
                    </p>
                    <h3 className="mt-2 font-display text-display-sm font-light text-fg transition-colors duration-300 group-hover:text-gold-light">
                      {exp.name}
                    </h3>
                    <p className="mt-2 max-w-md text-sm leading-relaxed text-fg/70">{exp.short}</p>
                  </div>
                  <span className="glass grid size-11 shrink-0 place-items-center rounded-full text-gold-light transition-all duration-500 ease-luxe group-hover:bg-gold group-hover:text-charcoal">
                    <ArrowUpRight aria-hidden className="size-4" strokeWidth={1.5} />
                  </span>
                </div>
              </SpotlightCard>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </Section>
  );
}
