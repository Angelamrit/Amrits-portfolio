import { chef } from "@/data/chef";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading, Em } from "@/components/ui/Heading";
import { ImageFrame } from "@/components/ui/ImageFrame";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { StatRow } from "@/components/ui/Stat";

export function MeetTheChef() {
  return (
    <Section id="meet-the-chef" tone="base" orbs="gold" pattern className="scroll-mt-20">
      <Container>
        {/* Chapter header: plain and self-explanatory */}
        <div className="max-w-3xl">
          <Reveal>
            <Eyebrow>01 · Meet the Chef</Eyebrow>
          </Reveal>
          <Reveal delay={0.1}>
            <Heading as="h2" size="lg" className="mt-8">
              Meet Chef <Em shimmer>Amrit Pal Singh.</Em>
            </Heading>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-8 max-w-2xl text-lead text-fg/70">
              Owner and head chef of Angel Indian Restaurant in Jackson Heights, Queens. Born in India, trained in Australia and in two of
              New York&rsquo;s most acclaimed Indian kitchens, and recognised by the Michelin Guide.
            </p>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-16 lg:grid-cols-12 lg:gap-20">
          {/* Portrait */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto w-full max-w-sm sm:max-w-md lg:max-w-none lg:sticky lg:top-32">
              <span aria-hidden className="pointer-events-none absolute -left-6 -top-20 select-none font-display text-[11rem] leading-none text-outline-gold md:-left-10 md:text-[15rem]">
                01
              </span>
              <span aria-hidden className="orb orb-gold -left-[20%] -top-[10%] size-[80%] opacity-60" />
              <ImageFrame image={chef.portrait} ratio="4/5" glow sizes="(min-width: 1024px) 40vw, (min-width: 640px) 28rem, 100vw" className="relative" />

              <Reveal delay={0.3} className="absolute -right-4 top-8 md:-right-8">
                <div className="glass-strong rounded-2xl px-5 py-4 shadow-glow">
                  <p className="eyebrow text-[0.55rem]">Michelin Guide</p>
                  <p className="mt-1 font-display text-2xl leading-none text-gold-gradient">Bib Gourmand</p>
                </div>
              </Reveal>
              <Reveal delay={0.45} className="absolute -left-4 bottom-10 md:-left-8">
                <div className="glass-strong rounded-2xl px-5 py-4">
                  <p className="eyebrow text-[0.55rem]">Est. October 2019</p>
                  <p className="mt-1 font-display text-xl leading-none">Angel Indian Restaurant</p>
                </div>
              </Reveal>
              <Reveal delay={0.55} className="absolute -bottom-6 right-6">
                <p className="font-display text-3xl italic text-gold-gradient">“{chef.philosophy.quote}”</p>
              </Reveal>
            </div>
          </div>

          {/* Story, stats, journey */}
          <div className="lg:col-span-7">
            <Reveal>
              <p className="text-lead text-fg/75">{chef.shortBio}</p>
            </Reveal>
            <Reveal delay={0.1}>
              <StatRow stats={chef.stats} glass className="mt-10" />
            </Reveal>

            <Reveal delay={0.15}>
              <Eyebrow className="mt-14">The journey, in five stops</Eyebrow>
            </Reveal>
            <RevealGroup className="relative mt-8 grid gap-6 sm:grid-cols-5 sm:gap-4">
              <span aria-hidden className="absolute left-[0.45rem] top-0 h-full w-px bg-gradient-to-b from-accent/70 via-accent/30 to-transparent sm:left-0 sm:top-[0.45rem] sm:h-px sm:w-full sm:bg-gradient-to-r" />
              {chef.timeline.map((t, i) => (
                <RevealItem key={t.title} className="relative pl-8 sm:pl-0 sm:pt-7">
                  <span className="absolute left-0 top-1 grid size-[1.1rem] place-items-center sm:-top-[0.1rem]">
                    <span aria-hidden className="absolute inset-0 rounded-full bg-accent/40 blur-[5px] animate-pulse-glow" />
                    <span className="relative size-2 rounded-full bg-gradient-to-br from-gold-light to-gold shadow-[0_0_12px_rgba(226,189,108,1)] ring-1 ring-accent/40" />
                  </span>
                  <p className="eyebrow text-[0.58rem]">
                    {String(i + 1).padStart(2, "0")} · {t.year}
                  </p>
                  <p className="mt-2 font-display text-lg leading-tight md:text-xl">{t.title}</p>
                </RevealItem>
              ))}
            </RevealGroup>

            <Reveal delay={0.3}>
              <div className="mt-12 flex flex-wrap gap-4">
                <Button href="/about" variant="glass">
                  Read the full story
                </Button>
                <Button href="#angel" variant="link">
                  Next: his restaurant, Angel
                </Button>
              </div>
            </Reveal>
          </div>
        </div>
      </Container>
    </Section>
  );
}
