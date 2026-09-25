import { images } from "@/data/images";
import { getVenue } from "@/lib/content/venue";
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

export async function FinalCta({
  eyebrow = "Dinner at Angel",
  title = (
    <>
      Come dine <Em shimmer>with the chef.</Em>
    </>
  ),
  body = "Chef Amrit cooks every night at Angel in Jackson Heights. Reserve a table and taste the cooking that earned its Bib Gourmand.",
}: Props) {
  const venue = await getVenue();

  return (
    <section id="reserve" className="relative overflow-hidden surface-brown-deep tone-dark py-section">
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
                {venue.resyUrl ? (
                  <Button href={venue.resyUrl}>Reserve a Table</Button>
                ) : (
                  <Button href={site.cta.href}>{site.cta.label}</Button>
                )}
                <Button href="/angel" variant="glass">
                  Visit Angel
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
