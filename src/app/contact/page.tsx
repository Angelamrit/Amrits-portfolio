import type { Metadata } from "next";
import { Suspense } from "react";
import { buildMetadata } from "@/lib/seo/metadata";
import { BookingWizard } from "@/components/contact/BookingWizard";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading, Em } from "@/components/ui/Heading";
import { Orbs } from "@/components/ui/Orbs";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = buildMetadata({
  title: "Contact & Booking",
  description: "Request a private dining experience, event or consultation with Chef Amrit Pal Singh of Angel Indian Restaurant, Jackson Heights.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <section className="relative overflow-hidden bg-bg pt-36 pb-section md:pt-44">
      <Orbs variant="mixed" pattern />
      <Container className="relative z-[2]">
        <div className="max-w-3xl">
          <Reveal>
            <Eyebrow>Contact / Book</Eyebrow>
            <Heading as="h1" size="lg" className="mt-8">
              Let&rsquo;s plan something <Em shimmer>memorable.</Em>
            </Heading>
            <p className="mt-8 max-w-xl text-lead text-fg/70">
              Seven quick questions, one at a time. Your answers build a first menu suggestion as you go, and Chef Amrit reads every enquiry personally.
            </p>
          </Reveal>
        </div>
        <div className="mt-14">
          <Suspense fallback={<div className="h-96" aria-busy="true" />}>
            <BookingWizard />
          </Suspense>
        </div>
      </Container>
    </section>
  );
}
