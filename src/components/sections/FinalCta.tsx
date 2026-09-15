import { images } from "@/data/images";
import { site } from "@/data/site";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading, Em } from "@/components/ui/Heading";
import { ImageFrame } from "@/components/ui/ImageFrame";
import { Orbs } from "@/components/ui/Orbs";
import { Reveal } from "@/components/ui/Reveal";

type Props = {
  eyebrow?: string;
  title?: React.ReactNode;
  body?: string;
};

export function FinalCta({
  eyebrow = "Plan your private dining experience",
  title = (
    <>
      Bring the chef <Em shimmer>to your table.</Em>
    </>
  ),
  body = "Private dinners, celebrations, corporate events and residencies, cooked by Chef Amrit and served with the care that earned Angel its Bib Gourmand.",
}: Props) {
  return (
    <section id="book" className="relative overflow-hidden bg-brown-deep tone-dark py-section">
      <ImageFrame image={images.tableCandles} ratio="fill" reveal="fade" vignette sizes="100vw" quality={65} imgClassName="opacity-35" />
      <div aria-hidden className="absolute inset-0 z-[1] bg-gradient-to-r from-brown-deep via-brown-deep/70 to-brown-deep/30" />
      <Orbs variant="gold" className="z-[1]" />
      <Container className="relative z-[2]">
        <Reveal>
          <div className="glass-strong border-gradient relative max-w-4xl overflow-hidden rounded-[2rem] p-8 md:p-14">
            <span aria-hidden className="orb orb-gold -right-[15%] -top-[40%] size-[60%] opacity-50" />
            <div className="relative">
              <Eyebrow>{eyebrow}</Eyebrow>
              <Heading as="h2" size="xl" className="mt-8">
                {title}
              </Heading>
              <p className="mt-8 max-w-xl text-lead text-fg/70">{body}</p>
              <div className="mt-12 flex flex-wrap gap-4">
                <Button href={site.cta.href}>Request a Private Experience</Button>
                {site.restaurant.resyUrl && (
                  <Button href={site.restaurant.resyUrl} variant="outline">
                    Reserve at Angel via Resy
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
