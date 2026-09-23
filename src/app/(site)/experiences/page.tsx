import type { Metadata } from "next";
import { experiences } from "@/data/experiences";
import { restaurant } from "@/data/restaurant";
import { buildMetadata } from "@/lib/seo/metadata";
import { ExperienceSplit } from "@/components/experiences/ExperienceSplit";
import { BookingProcess } from "@/components/sections/BookingProcess";
import { FinalCta } from "@/components/sections/FinalCta";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Heading, Em } from "@/components/ui/Heading";
import { ImageFrame } from "@/components/ui/ImageFrame";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { getVenue } from "@/lib/content/venue";

export const metadata: Metadata = buildMetadata({
  title: "Private Experiences",
  description:
    "Private dining, dinner parties, corporate events, weddings, villa and yacht residencies and a weekly personal chef service, cooked by Chef Amrit Pal Singh of Angel Indian Restaurant.",
  path: "/experiences",
});

/**
 * Experiences are ordered from the most intimate to the most involved:
 * private dining → dinner parties → corporate → weddings → residencies → weekly chef.
 * The restaurant itself is cross-linked at the end, not mixed into the list.
 */
export default async function ExperiencesPage() {
  const venue = await getVenue();
  const upscale = restaurant.locations.find((l) => l.kind === "upscale") ?? restaurant.locations[0];

  return (
    <>
      <PageHero
        eyebrow="Private Experiences"
        title={
          <>
            The kitchen of Angel, <Em>wherever you gather.</Em>
          </>
        }
        lead="Six ways to bring Chef Amrit to your own table, from an intimate dinner at home to a multi-day residency. Every experience begins with a conversation; choose the occasion and Chef designs the rest."
      >
        <nav aria-label="Experiences on this page" className="flex flex-wrap gap-2">
          {experiences.map((e, i) => (
            <a
              key={e.slug}
              href={`#${e.slug}`}
              className="glass rounded-pill px-4 py-2 eyebrow text-fg/70 transition-colors hover:border-gold/60 hover:text-gold-light"
            >
              <span className="mr-2 text-gold/70">{String(i + 1).padStart(2, "0")}</span>
              {e.name}
            </a>
          ))}
        </nav>
      </PageHero>

      <Section tone="base" padding="tight" orbs="subtle" pattern>
        {experiences.map((exp, i) => (
          <ExperienceSplit key={exp.slug} experience={exp} index={i} />
        ))}
      </Section>

      {/* Or dine at the restaurant */}
      <Section tone="raised" padding="tight" orbs="gold" divider>
        <Container>
          <div className="glass-strong border-gradient relative overflow-hidden rounded-[2rem] p-4 md:p-6">
            <div className="grid items-center gap-8 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <ImageFrame image={upscale.image} ratio="4/3" sizes="(min-width: 1024px) 40vw, 100vw" />
              </div>
              <div className="p-2 md:p-6 lg:col-span-7">
                <Reveal>
                  <Badge tone="solid">Or visit the restaurant</Badge>
                  <Heading as="h2" size="md" className="mt-6">
                    Prefer a table <Em>at Angel?</Em>
                  </Heading>
                  <p className="mt-6 max-w-xl text-fg/65">{upscale.description}</p>
                  <div className="mt-8 flex flex-wrap gap-4">
                    <Button href="/angel">About Angel</Button>
                    {venue.resyUrl && (
                      <Button href={venue.resyUrl} variant="outline">
                        Reserve via Resy
                      </Button>
                    )}
                  </div>
                </Reveal>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <BookingProcess />
      <FinalCta />
    </>
  );
}
