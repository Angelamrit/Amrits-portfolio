import type { Metadata } from "next";
import { Suspense } from "react";
import { chef } from "@/data/chef";
import { images } from "@/data/images";
import { buildMetadata } from "@/lib/seo/metadata";
import { BookingWizard } from "@/components/contact/BookingWizard";
import { Container } from "@/components/ui/Container";
import { Em } from "@/components/ui/Heading";
import { PageHero } from "@/components/ui/PageHero";
import { Section } from "@/components/ui/Section";
import { StatRow } from "@/components/ui/Stat";

export const metadata: Metadata = buildMetadata({
  title: "Contact & Booking",
  description: "Request a private dining experience, event or consultation with Chef Amrit Pal Singh of Angel Indian Restaurant, Jackson Heights.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact / Book"
        title={
          <>
            Let&rsquo;s plan something <Em shimmer>memorable.</Em>
          </>
        }
        lead="Seven quick questions, one at a time. Chef Amrit reads every enquiry personally and replies within two working days."
        image={images.tableCandles}
        cinematicImage
      >
        <StatRow stats={chef.stats} glass className="max-w-xl" />
      </PageHero>

      <Section tone="base" className="lg:pt-48" orbs="subtle">
        <Container>
          <Suspense fallback={<div className="h-96" aria-busy="true" />}>
            <BookingWizard />
          </Suspense>
        </Container>
      </Section>
    </>
  );
}
