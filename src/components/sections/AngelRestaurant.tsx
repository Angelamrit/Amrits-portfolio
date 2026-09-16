import { restaurant } from "@/data/restaurant";
import { site } from "@/data/site";
import { Badge } from "@/components/ui/Badge";
import { CompareSlider } from "@/components/ui/CompareSlider";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading, Em } from "@/components/ui/Heading";
import { ImageFrame } from "@/components/ui/ImageFrame";
import { Medallion } from "@/components/ui/Medallion";
import { Orbs } from "@/components/ui/Orbs";
import { Parallax } from "@/components/ui/Parallax";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { StatRow } from "@/components/ui/Stat";

/**
 * Chapter 02: the chef's own restaurant, told over a full-bleed parallax
 * photograph of the dining room.
 */
export function AngelRestaurant() {
  return (
    <section id="angel" className="tone-dark relative scroll-mt-20 overflow-hidden surface-brown-deep py-section grain">
      <Parallax amount={80}>
        <ImageFrame image={restaurant.heroImage} ratio="fill" reveal="none" sizes="100vw" quality={65} imgClassName="opacity-45" />
      </Parallax>
      <div aria-hidden className="absolute inset-0 z-[1] bg-gradient-to-b from-brown-deep via-brown-deep/55 to-brown-deep" />
      <div aria-hidden className="absolute inset-0 z-[1] bg-gradient-to-r from-brown-deep/95 via-brown-deep/50 to-brown-deep/10" />
      <Orbs variant="gold" className="z-[1]" />
      <span aria-hidden className="hairline-center absolute inset-x-0 top-0 z-[2]" />

      <Container className="relative z-[2]">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <Reveal>
              <Eyebrow>02 · The Restaurant</Eyebrow>
            </Reveal>
            <Reveal delay={0.1}>
              <Heading as="h2" size="lg" className="mt-8">
                Angel Indian <Em shimmer>Restaurant.</Em>
              </Heading>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="mt-8 max-w-2xl text-lead text-fg/75">
                His own restaurant in Jackson Heights, Queens. Opened in October 2019, awarded a Michelin Bib Gourmand, and now expanded
                with a second, upscale dining room and a chef&rsquo;s tasting menu.
              </p>
            </Reveal>
          </div>
          <Reveal delay={0.25} className="hidden md:block">
            <Medallion text="Michelin Guide · Bib Gourmand · New York · " size={190} className="text-gold-light">
              <span className="block text-center font-display leading-none">
                <span className="block text-[0.5rem] uppercase tracking-[0.3em] text-fg/60">Michelin</span>
                <span className="mt-1 block text-lg text-gold-gradient">Bib Gourmand</span>
              </span>
            </Medallion>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-12">
          {/* Story card */}
          <Reveal className="lg:col-span-7">
            <div className="glass-strong border-gradient relative h-full overflow-hidden rounded-[2rem] p-7 md:p-10">
              <span aria-hidden className="orb orb-gold -right-[20%] -top-[40%] size-[60%] opacity-50" />
              <div className="relative">
                <p className="font-display text-display-sm font-light text-fg">{restaurant.intro}</p>
                <StatRow stats={restaurant.facts} className="mt-8" />
                <ul className="mt-8 flex flex-wrap gap-2">
                  {restaurant.features.map((f) => (
                    <li key={f}>
                      <Badge>{f}</Badge>
                    </li>
                  ))}
                </ul>
                <div className="mt-10 flex flex-wrap gap-4">
                  <Button href="/angel">Discover Angel</Button>
                  {site.restaurant.resyUrl && (
                    <Button href={site.restaurant.resyUrl} variant="outline">
                      Reserve via Resy
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Reveal>

          {/* Then and now */}
          <div className="lg:col-span-5">
            <Reveal delay={0.1}>
              <p className="eyebrow mb-4 text-[0.6rem] text-gold-light/80">Drag to compare · 2019 to today</p>
              <CompareSlider before={restaurant.thenNow.before} after={restaurant.thenNow.after} ratio="aspect-[4/3]" sizes="(min-width: 1024px) 40vw, 100vw" />
            </Reveal>
            <RevealGroup className="mt-4 grid gap-3 sm:grid-cols-2">
              {restaurant.locations.map((loc) => (
                <RevealItem key={loc.name}>
                  <SpotlightCard className="h-full p-5" tilt={2}>
                    <p className="eyebrow text-[0.55rem] text-muted">{loc.kind === "original" ? "The original room · 2019" : "The new dining room"}</p>
                    <h3 className="mt-2 font-display text-xl font-normal text-gold-gradient">{loc.name}</h3>
                    <ul className="mt-3 space-y-1 text-xs text-fg/70">
                      {loc.highlights.map((h) => (
                        <li key={h} className="flex items-center gap-2">
                          <span aria-hidden className="size-1 rounded-full bg-gold" />
                          {h}
                        </li>
                      ))}
                    </ul>
                  </SpotlightCard>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </div>
      </Container>
    </section>
  );
}
