import { voices, testimonials } from "@/data/testimonials";
import { filterPlaceholders } from "@/lib/placeholders";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading, Em } from "@/components/ui/Heading";
import { Quote } from "@/components/ui/Quote";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SpotlightCard } from "@/components/ui/SpotlightCard";

const credentials = [
  { label: "The Infatuation", value: "8.6", note: "Reviewed, August 2024" },
  { label: "Michelin", value: "Bib Gourmand", note: "Angel Indian Restaurant" },
  { label: "Vikas Khanna", value: "“Pride of India”", note: "At the new room's opening, 2025" },
];

export function Voices() {
  const lead = voices[0];
  const clientQuotes = filterPlaceholders(testimonials);

  return (
    <Section id="recognition" tone="deep" orbs="gold" pattern divider grain className="scroll-mt-20">
      <Container>
        <Reveal>
          <Eyebrow align="center">07 · Recognition</Eyebrow>
        </Reveal>
        <Reveal delay={0.1}>
          <Heading as="h2" size="lg" className="mx-auto mt-8 max-w-3xl text-center">
            Recognised by the Michelin Guide, <Em shimmer>and by his peers.</Em>
          </Heading>
        </Reveal>
        <Reveal delay={0.15}>
          <div className="mx-auto mt-12 max-w-5xl text-center">
            <Quote quote={lead.quote} author={lead.author} role={lead.role} context={lead.context} className="[&_figcaption]:items-center" />
          </div>
        </Reveal>

        <RevealGroup className="mt-20 grid gap-4 md:grid-cols-3">
          {credentials.map((c) => (
            <RevealItem key={c.label + c.value}>
              <SpotlightCard className="p-8 text-center" tilt={3}>
                <p className="eyebrow">{c.label}</p>
                <p className="mt-4 font-display text-display-md font-light text-gold-gradient">{c.value}</p>
                <p className="mt-2 text-sm text-fg/55">{c.note}</p>
              </SpotlightCard>
            </RevealItem>
          ))}
        </RevealGroup>

        {clientQuotes.length > 0 && (
          <ul className="mt-16 grid gap-6 md:grid-cols-2">
            {clientQuotes.map((t) => (
              <li key={t.id}>
                <SpotlightCard className="p-8">
                  <Quote quote={t.quote} author={t.author} role={t.role} size="md" />
                </SpotlightCard>
              </li>
            ))}
          </ul>
        )}

        <Reveal delay={0.25} className="mt-14 text-center">
          <Button href="/press" variant="glass">
            Press &amp; awards
          </Button>
        </Reveal>
      </Container>
    </Section>
  );
}
