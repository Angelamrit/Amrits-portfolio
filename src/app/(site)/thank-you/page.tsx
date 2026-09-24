import type { Metadata } from "next";
import { site } from "@/data/site";
import { ThankYouVideo } from "@/components/contact/ThankYouVideo";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading, Em } from "@/components/ui/Heading";
import { Orbs } from "@/components/ui/Orbs";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: { absolute: `Thank You | ${site.name}` },
  description: "A personal message from Chef Amrit Pal Singh.",
  robots: { index: false, follow: false },
};

/** Linked from the contact-form auto-reply email: the chef's video message. */
export default function ThankYouPage() {
  return (
    <section className="relative overflow-hidden surface-gold pt-36 pb-section md:pt-44">
      <Orbs variant="mixed" pattern />
      <Container className="relative z-[2]">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-16">
          <div className="lg:col-span-5">
            <Reveal>
              <Eyebrow>{site.thankYou.headline}</Eyebrow>
              <Heading as="h1" size="lg" className="mt-8">
                Thank you for <Em shimmer>your message.</Em>
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

        <Reveal delay={0.2}>
          <div className="mt-16 flex flex-wrap gap-4">
            <Button href="/menus">Explore the Menu</Button>
            <Button href="/angel" variant="glass">
              Visit Angel
            </Button>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
