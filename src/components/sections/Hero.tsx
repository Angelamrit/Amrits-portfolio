import { chef } from "@/data/chef";
import { site } from "@/data/site";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Embers } from "@/components/ui/Embers";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ImageFrame } from "@/components/ui/ImageFrame";
import { Medallion } from "@/components/ui/Medallion";
import { Reveal } from "@/components/ui/Reveal";

const credentials = [
  { label: "Michelin Guide", value: "Bib Gourmand" },
  { label: "Owner & Head Chef", value: "Angel Indian Restaurant" },
  { label: "Jackson Heights, Queens", value: "Since October 2019" },
];

export function Hero() {
  return (
    <section id="hero" className="relative flex min-h-[100svh] items-end overflow-hidden bg-brown-deep tone-dark grain" aria-label="Introduction">
      {/* The hero photograph stays exactly as it is; only a very slow cinematic drift is added. */}
      <ImageFrame
        image={chef.heroImage}
        ratio="fill"
        reveal="fade"
        vignette
        priority
        sizes="100vw"
        quality={72}
        imgClassName="opacity-80 animate-kenburns motion-reduce:animate-none"
      />
      <div aria-hidden className="absolute inset-0 z-[1] bg-gradient-to-r from-charcoal/75 via-charcoal/25 to-transparent" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 z-[1] h-1/2 bg-gradient-to-t from-brown-deep/90 to-transparent" />
      <Embers />

      <Container className="relative z-[2] w-full pb-10 pt-40 md:pb-14">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <Reveal delay={0.2}>
              <Eyebrow className="text-gold-light">Owner &amp; Head Chef · Angel Indian Restaurant · Michelin Bib Gourmand</Eyebrow>
            </Reveal>
            <Reveal delay={0.35}>
              <h1 className="mt-8 font-display text-display-xl font-light leading-[0.92] tracking-[-0.02em] text-fg">
                Amrit
                <br />
                Pal Singh
              </h1>
            </Reveal>
            <Reveal delay={0.5}>
              <p className="mt-8 max-w-xl font-display text-display-sm font-light italic text-shimmer">{chef.positioning}</p>
            </Reveal>
            <Reveal delay={0.6}>
              <p className="mt-5 max-w-lg text-sm leading-relaxed text-fg/65 md:text-base">
                Private dining, events and residencies by the chef behind one of New York&rsquo;s most celebrated Indian kitchens. {chef.location}.
              </p>
            </Reveal>
            <Reveal delay={0.7}>
              <div className="mt-10 flex flex-wrap gap-4">
                <Button href={site.cta.href} tone="dark">
                  Book a Private Experience
                </Button>
                <Button href="/experiences" tone="dark" variant="outline">
                  Explore My Work
                </Button>
              </div>
            </Reveal>
          </div>

          <div className="hidden lg:col-span-4 lg:flex lg:flex-col lg:items-end lg:gap-10">
            <Reveal delay={0.8}>
              <Medallion text="Michelin Bib Gourmand · Angel · Est. 2019 · " size={176} className="text-gold-light">
                <span className="font-display text-5xl font-light leading-none text-gold-gradient">A</span>
              </Medallion>
            </Reveal>
            <Reveal delay={0.9}>
              <div className="flex flex-col items-center gap-4">
                <span className="eyebrow text-[0.55rem] text-fg/50 [writing-mode:vertical-rl]">Scroll</span>
                <span aria-hidden className="block h-16 w-px overflow-hidden bg-fg/15">
                  <span className="block h-full w-full origin-top bg-gold animate-scroll-cue" />
                </span>
              </div>
            </Reveal>
          </div>
        </div>

        <Reveal delay={0.95}>
          <ul className="mt-12 grid gap-3 border-t border-fg/10 pt-6 sm:grid-cols-3">
            {credentials.map((c) => (
              <li key={c.label} className="glass rounded-2xl px-5 py-4 transition-all duration-500 hover:border-gold/60 hover:shadow-glow">
                <p className="eyebrow text-[0.55rem] text-fg/55">{c.label}</p>
                <p className="mt-1.5 font-display text-xl leading-none text-gold-gradient md:text-2xl">{c.value}</p>
              </li>
            ))}
          </ul>
        </Reveal>
      </Container>
    </section>
  );
}
