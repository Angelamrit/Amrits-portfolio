import { chef } from "@/data/chef";
import { site } from "@/data/site";
import { getVenue } from "@/lib/content/venue";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Embers } from "@/components/ui/Embers";
import { ImageFrame } from "@/components/ui/ImageFrame";
import type { CSSProperties } from "react";

const credentials = [
  { label: "Michelin Guide", value: "Bib Gourmand" },
  { label: "Owner & Head Chef", value: "Angel Indian Restaurant" },
  { label: "Jackson Heights, Queens", value: "Since October 2019" },
];

export async function Hero() {
  const venue = await getVenue();
  return (
    <section id="hero" className="relative flex min-h-[100svh] items-end overflow-hidden surface-brown-deep tone-dark grain" aria-label="Introduction">
      {/* The hero is the first thing anyone sees, so nothing in it waits for JavaScript:
          the photograph is visible from the first frame (it is the page's largest paint),
          and the text rises in with a CSS animation that starts the moment the page paints.
          The hero photograph stays exactly as it is; only a very slow cinematic drift is added.
          It is landscape, so on an upright screen (phones, iPads held portrait) filling the
          whole section would crop most of it away. There it runs edge to edge at its own
          proportions, just under the header, so the whole photograph is visible, and fades
          into the brown under the name — the same full-bleed look as the desktop hero.
          Landscape screens keep the desktop layout. */}
      <div className="absolute inset-0 portrait:top-[4.75rem] portrait:bottom-auto portrait:aspect-[1453/1082] portrait:w-full">
        <ImageFrame
          image={chef.heroImage}
          ratio="fill"
          reveal="none"
          vignette
          priority
          sizes="100vw"
          quality={72}
          imgClassName="opacity-80 animate-kenburns motion-reduce:animate-none portrait:animate-none portrait:opacity-90"
        />
        <div aria-hidden className="absolute inset-x-0 bottom-0 z-[1] hidden h-1/4 bg-gradient-to-t from-brown-deep to-transparent portrait:block" />
      </div>
      <div aria-hidden className="absolute inset-0 z-[1] bg-gradient-to-r from-charcoal/75 via-charcoal/25 to-transparent portrait:hidden" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 z-[1] h-1/2 bg-gradient-to-t from-brown-deep/90 to-transparent" />
      <Embers />

      <Container className="relative z-[2] w-full pb-10 pt-32 md:pb-14 lg:pt-40 portrait:pt-[calc(4.75rem+74.5vw-1.5rem)]">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <div className="hero-in" style={{ "--hero-delay": "0.05s" } as CSSProperties}>
              <h1 className="font-display text-display-lg font-light leading-[0.95] tracking-[-0.015em] text-fg">
                Amrit
                <br />
                <em className="font-normal italic text-gold-gradient">Pal Singh</em>
              </h1>
              <span aria-hidden className="mt-7 block h-px w-24 bg-gradient-to-r from-gold-light via-gold to-transparent" />
            </div>
            <div className="hero-in" style={{ "--hero-delay": "0.15s" } as CSSProperties}>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button href={venue.resyUrl ?? site.cta.href} tone="dark" size="sm">
                  {site.cta.label}
                </Button>
                <Button href="/menus" tone="dark" variant="glass" size="sm">
                  Explore the Menu
                </Button>
              </div>
            </div>
          </div>

          <div className="hidden lg:col-span-4 lg:flex lg:flex-col lg:items-end lg:gap-10">
            <div className="hero-in" style={{ "--hero-delay": "0.3s" } as CSSProperties}>
              <div className="flex flex-col items-center gap-4">
                <span className="eyebrow text-[0.55rem] text-fg/50 [writing-mode:vertical-rl]">Scroll</span>
                <span aria-hidden className="block h-16 w-px overflow-hidden bg-fg/15">
                  <span className="block h-full w-full origin-top bg-gold animate-scroll-cue" />
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="hero-in" style={{ "--hero-delay": "0.3s" } as CSSProperties}>
          <ul className="mt-12 grid gap-3 border-t border-fg/10 pt-6 sm:grid-cols-3">
            {credentials.map((c) => (
              <li key={c.label} className="glass rounded-2xl px-5 py-4 transition-all duration-500 hover:border-gold/60 hover:shadow-glow">
                <p className="eyebrow text-[0.55rem] text-fg/55">{c.label}</p>
                <p className="mt-1.5 font-display text-xl leading-none text-gold-gradient md:text-2xl">{c.value}</p>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
