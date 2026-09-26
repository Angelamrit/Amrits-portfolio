import type { Metadata } from "next";
import { CalendarCheck, MapPin, Phone } from "lucide-react";
import { chef } from "@/data/chef";
import { images } from "@/data/images";
import { getVenue } from "@/lib/content/venue";
import { seo } from "@/data/seo";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd, contactPageJsonLd } from "@/lib/seo/jsonld";
import { JsonLd } from "@/components/seo/JsonLd";
import { ContactForm } from "@/components/contact/ContactForm";
import { Button } from "@/components/ui/Button";
import { CardHeader } from "@/components/ui/CardHeader";
import { Container } from "@/components/ui/Container";
import { Em } from "@/components/ui/Heading";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { StatRow } from "@/components/ui/Stat";

export const metadata: Metadata = buildMetadata({ seo: seo.contact, path: "/contact" });

export default async function ContactPage() {
  const venue = await getVenue();

  return (
    <>
      <JsonLd data={[breadcrumbJsonLd([{ name: "Contact", path: "/contact" }]), contactPageJsonLd("/contact")]} />
      <PageHero
        eyebrow="Contact"
        title={
          <>
            Reserve a table, <Em shimmer>or say hello.</Em>
          </>
        }
        lead="Chef Amrit cooks every night at Angel in Jackson Heights. He reads every message personally."
        image={images.angelDiningRoom}
        cinematicImage
      >
        <StatRow stats={chef.stats} glass className="max-w-xl" />
      </PageHero>

      <Section tone="base" className="lg:pt-48" orbs="subtle">
        <Container>
          <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-7">
              <Reveal>
                <ContactForm />
              </Reveal>
            </div>

            <aside className="order-first lg:order-none lg:col-span-5">
              <div className="space-y-4 lg:sticky lg:top-32">
                <Reveal delay={0.1}>
                  <SpotlightCard as="section" aria-labelledby="contact-reserve" className="group/card p-6 md:p-7">
                    <CardHeader id="contact-reserve" title="Reserve a table" icon={<CalendarCheck className="size-4" strokeWidth={1.5} />} />
                    <p className="mt-4 font-display text-2xl leading-tight">{venue.name}</p>
                    <p className="mt-2 text-sm text-fg/60">{venue.hours}</p>
                    <div className="mt-6 flex flex-wrap gap-3">
                      {venue.resyUrl && <Button href={venue.resyUrl}>Reserve via Resy</Button>}
                      {venue.menuUrl && (
                        <Button href={venue.menuUrl} variant="glass">
                          Full menu
                        </Button>
                      )}
                    </div>
                  </SpotlightCard>
                </Reveal>

                <Reveal delay={0.2}>
                  <SpotlightCard as="section" aria-labelledby="contact-visit" className="group/card p-6 md:p-7">
                    <CardHeader id="contact-visit" title="Visit" icon={<MapPin className="size-4" strokeWidth={1.5} />} />
                    <address className="mt-4 not-italic text-sm leading-relaxed text-fg/75">
                      {venue.address.street}
                      <br />
                      {venue.address.city}, {venue.address.region} {venue.address.postal}
                    </address>
                    {venue.mapsUrl && (
                      <div className="mt-5">
                        <Button href={venue.mapsUrl} variant="link">
                          Open in Maps
                        </Button>
                      </div>
                    )}
                  </SpotlightCard>
                </Reveal>

                {(venue.phone || venue.contactEmail) && (
                  <Reveal delay={0.3}>
                    <SpotlightCard as="section" aria-labelledby="contact-call" className="group/card p-6 md:p-7">
                      <CardHeader id="contact-call" title="Call or email" icon={<Phone className="size-4" strokeWidth={1.5} />} />
                      <div className="mt-4 flex flex-col gap-2 text-sm">
                        {venue.phone && (
                          <a href={`tel:${venue.phone.replace(/[^\d+]/g, "")}`} className="text-fg/80 transition-colors hover:text-accent">
                            {venue.phone}
                          </a>
                        )}
                        {venue.contactEmail && (
                          <a href={`mailto:${venue.contactEmail}`} className="text-fg/80 transition-colors hover:text-accent">
                            {venue.contactEmail}
                          </a>
                        )}
                      </div>
                    </SpotlightCard>
                  </Reveal>
                )}
              </div>
            </aside>
          </div>
        </Container>
      </Section>
    </>
  );
}
