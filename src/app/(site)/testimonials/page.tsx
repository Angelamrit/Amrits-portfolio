import type { Metadata } from "next";
import { testimonials, voices } from "@/data/testimonials";
import { filterPlaceholders } from "@/lib/placeholders";
import { seo } from "@/data/seo";
import { buildMetadata } from "@/lib/seo/metadata";
import { FinalCta } from "@/components/sections/FinalCta";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Em } from "@/components/ui/Heading";
import { PageHero } from "@/components/ui/PageHero";
import { Quote } from "@/components/ui/Quote";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SpotlightCard } from "@/components/ui/SpotlightCard";

export const metadata: Metadata = buildMetadata({ seo: seo.testimonials, path: "/testimonials", noindex: true });

export default function TestimonialsPage() {
  const client = filterPlaceholders(testimonials);
  return (
    <>
      <PageHero
        eyebrow="Testimonials"
        title={
          <>
            In their <Em>own words.</Em>
          </>
        }
        lead="Only genuine feedback, shared with permission, appears here."
      />

      <Section tone="deep" orbs="gold" pattern grain>
        <Container>
          <div className="mx-auto max-w-4xl space-y-24">
            {voices.map((v) => (
              <Reveal key={v.id}>
                <Quote quote={v.quote} author={v.author} role={v.role} context={v.context} />
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      <Section tone="base" divider>
        <Container>
          {client.length > 0 ? (
            <ul className="grid gap-6 md:grid-cols-2">
              {client.map((t) => (
                <li key={t.id}>
                  <SpotlightCard className="p-8">
                    <Quote quote={t.quote} author={t.author} role={t.role} context={t.context} size="md" />
                  </SpotlightCard>
                </li>
              ))}
            </ul>
          ) : (
            <Reveal>
              <SpotlightCard className="p-8 md:p-12" tilt={1}>
                <Eyebrow>Guest testimonials</Eyebrow>
                <p className="mt-6 max-w-2xl font-display text-display-sm font-light text-fg/80">
                  Guest feedback will be published here as it is collected, with each guest&rsquo;s permission.
                </p>
              </SpotlightCard>
            </Reveal>
          )}
        </Container>
      </Section>

      <FinalCta />
    </>
  );
}
