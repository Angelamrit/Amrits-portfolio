import type { Metadata } from "next";
import { process } from "@/data/process";
import { site } from "@/data/site";
import { ThankYouVideo } from "@/components/contact/ThankYouVideo";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading, Em } from "@/components/ui/Heading";
import { Orbs } from "@/components/ui/Orbs";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { SpotlightCard } from "@/components/ui/SpotlightCard";

export const metadata: Metadata = {
  title: "Thank you",
  description: "A personal message from Chef Amrit Pal Singh after your enquiry.",
  robots: { index: false, follow: false },
};

/** Linked from the enquiry auto-reply email: the chef's video message and what happens next. */
export default function ThankYouPage() {
  return (
    <section className="relative overflow-hidden bg-bg pt-36 pb-section md:pt-44">
      <Orbs variant="mixed" pattern />
      <Container className="relative z-[2]">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-16">
          <div className="lg:col-span-5">
            <Reveal>
              <Eyebrow>{site.thankYou.headline}</Eyebrow>
              <Heading as="h1" size="lg" className="mt-8">
                Thank you for <Em shimmer>your enquiry.</Em>
              </Heading>
              <p className="mt-8 max-w-md text-lead text-fg/70">{site.thankYou.message}</p>
              <p className="mt-6 font-display text-2xl italic text-gold-gradient">— Chef Amrit Pal Singh</p>
            </Reveal>
          </div>
          <div className="lg:col-span-7">
            <Reveal delay={0.15}>
              <ThankYouVideo />
            </Reveal>
          </div>
        </div>

        <div className="mt-20">
          <Reveal>
            <Eyebrow>What happens next</Eyebrow>
          </Reveal>
          <RevealGroup className="mt-8 grid gap-4 md:grid-cols-5">
            {process.map((s) => (
              <RevealItem key={s.step}>
                <SpotlightCard className="h-full p-6" tilt={2}>
                  <span className="font-display text-display-sm text-gold-gradient">{String(s.step).padStart(2, "0")}</span>
                  <h2 className="mt-3 font-display text-xl font-normal">{s.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-fg/65">{s.body}</p>
                </SpotlightCard>
              </RevealItem>
            ))}
          </RevealGroup>
          <Reveal delay={0.2}>
            <div className="mt-10 flex flex-wrap gap-4">
              <Button href="/experiences" variant="glass">
                Explore the experiences
              </Button>
              <Button href="/angel" variant="link">
                About Angel
              </Button>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
