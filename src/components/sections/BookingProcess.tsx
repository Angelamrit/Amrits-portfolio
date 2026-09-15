import { process } from "@/data/process";
import { cn } from "@/lib/cn";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading, Em } from "@/components/ui/Heading";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SpotlightCard } from "@/components/ui/SpotlightCard";

export function BookingProcess({ compact = false }: { compact?: boolean }) {
  const steps = (
    <div className="relative">
      {/* connecting line */}
      <span aria-hidden className="absolute left-5 top-0 h-full w-px bg-gradient-to-b from-accent/60 via-accent/20 to-transparent md:left-0 md:top-5 md:h-px md:w-full md:bg-gradient-to-r" />
      <RevealGroup className={cn("grid gap-8", "md:grid-cols-5 md:gap-5")}>
        {process.map((step) => (
          <RevealItem key={step.step} className="relative pl-14 md:pl-0 md:pt-12">
            <span className="absolute left-[0.85rem] top-1 grid size-[1.35rem] place-items-center md:left-[-0.2rem] md:top-[0.95rem]">
              <span aria-hidden className="absolute inset-0 rounded-full bg-accent/40 blur-[6px] animate-pulse-glow" />
              <span className="relative size-2.5 rounded-full bg-gradient-to-br from-gold-light to-gold shadow-[0_0_14px_rgba(226,189,108,1)] ring-1 ring-accent/40" />
            </span>
            {compact ? (
              <div>
                <span className="font-display text-2xl text-gold-gradient">{String(step.step).padStart(2, "0")}</span>
                <h3 className="mt-2 font-display text-xl font-normal">{step.title}</h3>
              </div>
            ) : (
              <SpotlightCard className="h-full p-6" tilt={2}>
                <span className="font-display text-display-sm text-gold-gradient">{String(step.step).padStart(2, "0")}</span>
                <h3 className="mt-3 font-display text-2xl font-normal">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-fg/65">{step.body}</p>
              </SpotlightCard>
            )}
          </RevealItem>
        ))}
      </RevealGroup>
    </div>
  );

  if (compact) return steps;

  return (
    <Section id="process" tone="base" orbs="gold" pattern divider className="scroll-mt-20">
      <Container>
        <div className="max-w-2xl">
          <Reveal>
            <Eyebrow>08 · How it works</Eyebrow>
          </Reveal>
          <Reveal delay={0.1}>
            <Heading as="h2" size="lg" className="mt-8">
              Booking takes <Em shimmer>five simple steps.</Em>
            </Heading>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-8 max-w-xl text-lead text-fg/65">From the first call to the last cup of chai, here is exactly what happens once you enquire.</p>
          </Reveal>
        </div>
        <div className="mt-16">{steps}</div>
      </Container>
    </Section>
  );
}
