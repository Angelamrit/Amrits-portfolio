import { getSignatureDishes } from "@/lib/content/dishes";
import { getVenue } from "@/lib/content/venue";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading, Em } from "@/components/ui/Heading";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { DishShowcase } from "./DishShowcase";

/** Chapter 03: the five plates that built Angel's name, as an interactive showcase. */
export async function SignatureDishes() {
  const [signatureDishes, venue] = await Promise.all([getSignatureDishes(), getVenue()]);
  return (
    <Section id="signature-dishes" tone="base" orbs="gold" pattern divider className="scroll-mt-20">
      <Container>
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between md:[&>*:last-child]:shrink-0">
          <div className="max-w-3xl">
            <Reveal>
              <Eyebrow>03 · Signature Dishes</Eyebrow>
            </Reveal>
            <Reveal delay={0.1}>
              <Heading as="h2" size="lg" className="mt-8">
                Five plates that <Em shimmer>built Angel&rsquo;s name.</Em>
              </Heading>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="mt-8 max-w-xl text-lead text-fg/65">
                Predominantly vegetarian and 100% Halal, from Indian street food to slow-cooked tradition. Hover or tap a dish to see it.
              </p>
            </Reveal>
          </div>
          {venue.menuUrl && (
            <Reveal delay={0.25}>
              <Button href={venue.menuUrl} external>
                Full menu at Angel
              </Button>
            </Reveal>
          )}
        </div>

        <Reveal delay={0.2} className="mt-16">
          <DishShowcase dishes={signatureDishes} />
        </Reveal>
      </Container>
    </Section>
  );
}
