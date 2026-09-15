import type { Metadata } from "next";
import { press } from "@/data/press";
import { images } from "@/data/images";
import { buildMetadata } from "@/lib/seo/metadata";
import { FinalCta } from "@/components/sections/FinalCta";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Em } from "@/components/ui/Heading";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SpotlightCard } from "@/components/ui/SpotlightCard";

export const metadata: Metadata = buildMetadata({
  title: "Press & Awards",
  description:
    "Michelin Guide, Bib Gourmand and recognition from Chef Vikas Khanna: genuine press and awards for Chef Amrit Pal Singh and Angel Indian Restaurant.",
  path: "/press",
});

const kindLabel: Record<(typeof press)[number]["kind"], string> = {
  award: "Award",
  listing: "Guide listing",
  quote: "Peer recognition",
  article: "Press",
};

export default function PressPage() {
  return (
    <>
      <PageHero
        eyebrow="Press & Awards"
        title={
          <>
            Recognised by the guide, <Em>and by his peers.</Em>
          </>
        }
        lead="Every item on this page is genuine and publicly documented. Nothing is added that cannot be verified."
        image={images.chefPlating}
      />

      <Section tone="base" className="lg:pt-48" orbs="gold" pattern>
        <Container>
          <RevealGroup className="grid gap-5">
            {press.map((item) => (
              <RevealItem key={item.id}>
                <SpotlightCard className="grid gap-4 p-7 md:grid-cols-12 md:gap-8 md:p-9" tilt={1.5}>
                  <div className="md:col-span-3">
                    <p className="eyebrow">{item.outlet}</p>
                    <div className="mt-3">
                      <Badge tone="gold">{kindLabel[item.kind]}</Badge>
                    </div>
                    {item.date && <p className="mt-3 text-xs text-muted">{item.date}</p>}
                  </div>
                  <div className="md:col-span-8 md:col-start-5">
                    <h2 className="font-display text-display-sm font-light text-gold-gradient">{item.headline}</h2>
                    {item.excerpt && <p className="mt-4 max-w-2xl leading-relaxed text-fg/70">{item.excerpt}</p>}
                    {item.url && (
                      <Button href={item.url} variant="link" className="mt-6">
                        Read more
                      </Button>
                    )}
                  </div>
                </SpotlightCard>
              </RevealItem>
            ))}
          </RevealGroup>

          <Reveal delay={0.2}>
            <div className="mt-16 max-w-xl">
              <Eyebrow>Press enquiries</Eyebrow>
              <p className="mt-4 text-sm leading-relaxed text-fg/65">
                For interviews, features and media requests, please use the contact form and note &ldquo;press&rdquo; in your message.
              </p>
              <Button href="/contact" variant="glass" className="mt-6">
                Contact
              </Button>
            </div>
          </Reveal>
        </Container>
      </Section>

      <FinalCta />
    </>
  );
}
