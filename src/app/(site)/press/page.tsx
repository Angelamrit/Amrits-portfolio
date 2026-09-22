import type { Metadata } from "next";
import { Award, Beer, GlassWater, Mail, Martini, Wine } from "lucide-react";
import { barLaunch, press, pressOutlets, pressStats } from "@/data/press";
import { images } from "@/data/images";
import { buildMetadata } from "@/lib/seo/metadata";
import { PressWall } from "@/components/press/PressWall";
import { FinalCta } from "@/components/sections/FinalCta";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading, Em } from "@/components/ui/Heading";
import { ImageFrame } from "@/components/ui/ImageFrame";
import { Medallion } from "@/components/ui/Medallion";
import { Orbs } from "@/components/ui/Orbs";
import { Parallax } from "@/components/ui/Parallax";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { StatRow } from "@/components/ui/Stat";
import { getVenue } from "@/lib/content/venue";

export const metadata: Metadata = buildMetadata({
  title: "Press & Recognition",
  description:
    "The MICHELIN Guide, The Infatuation, Time Out New York, Resy, Hell Gate and Culinary Backstreets on Chef Amrit Pal Singh and Angel Indian Restaurant. Every item verified at the source.",
  path: "/press",
});

const michelin = press.find((p) => p.id === "michelin-bib-gourmand");
const khanna = press.find((p) => p.id === "michelin-vikas-khanna");
const wall = press.filter((p) => p.id !== "michelin-bib-gourmand" && p.id !== "michelin-vikas-khanna");

const barIcon = { wine: Wine, cocktails: Martini, beer: Beer, mocktails: GlassWater } as const;

export default async function PressPage() {
  const venue = await getVenue();

  return (
    <>
      {/* ---------- cinematic hero ---------- */}
      <section className="tone-dark relative overflow-hidden bg-brown-deep pt-40 pb-16 grain md:pt-48 md:pb-20">
        <Parallax amount={70}>
          <ImageFrame image={images.chefPlating} ratio="fill" reveal="none" sizes="100vw" quality={65} imgClassName="opacity-40" />
        </Parallax>
        <div aria-hidden className="absolute inset-0 z-[1] bg-gradient-to-b from-brown-deep/90 via-brown-deep/55 to-brown-deep" />
        <div aria-hidden className="absolute inset-0 z-[1] bg-gradient-to-r from-brown-deep/95 via-brown-deep/45 to-transparent" />
        <Orbs variant="gold" className="z-[1]" />

        <Container className="relative z-[2]">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              <Reveal>
                <Eyebrow>Press &amp; Recognition</Eyebrow>
              </Reveal>
              <Reveal delay={0.1}>
                <Heading as="h1" size="xl" className="mt-8">
                  What the critics <Em shimmer>actually wrote.</Em>
                </Heading>
              </Reveal>
              <Reveal delay={0.2}>
                <p className="mt-8 max-w-2xl text-lead text-fg/75">
                  The MICHELIN Guide, Bon App&eacute;tit, The Infatuation, Time Out New York, Resy and Hell Gate have all sat down at Angel.
                  Every line on this page was read at its source before it was printed here, and nothing is claimed that cannot be opened
                  and checked.
                </p>
              </Reveal>
              <Reveal delay={0.3}>
                <StatRow stats={pressStats} glass className="mt-10 max-w-xl" />
              </Reveal>
            </div>
            <Reveal delay={0.35} className="hidden lg:col-span-4 lg:flex lg:justify-end">
              <Medallion text="MICHELIN Guide · Bib Gourmand · New York · " size={200} className="text-gold-light">
                <span className="block text-center font-display leading-none">
                  <span className="block text-[0.5rem] uppercase tracking-[0.3em] text-fg/60">Bib Gourmand</span>
                  <span className="mt-1 block text-3xl text-gold-gradient">2021</span>
                </span>
              </Medallion>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ---------- restaurant news: the bar launch ---------- */}
      <Section tone="raised" orbs="gold" pattern divider>
        <Container>
          <div className="max-w-2xl">
            <Reveal>
              <Eyebrow>Restaurant News · {barLaunch.date}</Eyebrow>
              <Heading as="h2" size="lg" className="mt-8">
                The bar is <Em shimmer>open.</Em>
              </Heading>
              <p className="mt-6 text-sm leading-relaxed text-fg/65">
                A full bar joins the kitchen — wine, cocktails and beer built to sit alongside Chef Amrit&rsquo;s menu, not compete with it.
              </p>
            </Reveal>
          </div>

          {/* The quote and the four offerings share one row, so the cards line
              up with the quote card rather than floating beside the heading. */}
          <div className="mt-12 grid gap-6 lg:grid-cols-12 lg:gap-8">
            <div className="flex flex-col lg:col-span-5">
              <Reveal delay={0.1} className="flex-1">
                <blockquote className="glass border-gradient relative flex h-full flex-col justify-center rounded-[1.5rem] p-7">
                  <span aria-hidden className="pointer-events-none block font-display text-4xl leading-none text-gold-gradient opacity-40">
                    &ldquo;
                  </span>
                  <p className="mt-2 font-display text-xl leading-snug text-fg/85 italic">{barLaunch.quote}</p>
                  <cite className="mt-4 block text-[0.65rem] font-semibold tracking-[0.15em] text-gold-light not-italic uppercase">
                    Chef Amrit Pal Singh
                  </cite>
                </blockquote>
              </Reveal>
              <Reveal delay={0.15}>
                {venue.resyUrl && (
                  <Button href={venue.resyUrl} external className="mt-6">
                    Reserve a table
                  </Button>
                )}
              </Reveal>
            </div>

            <RevealGroup delay={0.15} className="grid grid-cols-2 gap-3 lg:col-span-7">
              {barLaunch.offerings.map((o) => {
                const Icon = barIcon[o.kind];
                return (
                  <RevealItem key={o.kind}>
                    <SpotlightCard className="h-full p-4 md:p-5" tilt={2}>
                      <span aria-hidden className="orb orb-gold -right-[35%] -top-[45%] size-[50%] opacity-20" />
                      <div className="relative">
                        <span className="grid size-8 place-items-center rounded-full border border-gold/40 bg-gold/10">
                          <Icon aria-hidden className="size-3.5 text-gold" strokeWidth={1.5} />
                        </span>
                        <p className="mt-3 font-display text-base text-fg">{o.label}</p>
                        <p className="mt-1.5 text-xs leading-relaxed text-fg/60">{o.blurb}</p>
                      </div>
                    </SpotlightCard>
                  </RevealItem>
                );
              })}
            </RevealGroup>
          </div>
        </Container>
      </Section>

      {/* ---------- the award ---------- */}
      {michelin && (
        <Section tone="base" orbs="gold" pattern>
          <Container>
            <div className="grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-14">
              <div className="lg:col-span-5">
                <Reveal>
                  <Eyebrow>The Award</Eyebrow>
                  <Heading as="h2" size="lg" className="mt-8">
                    A Bib Gourmand, <Em>New York 2021.</Em>
                  </Heading>
                  <p className="mt-8 max-w-md text-lead text-fg/65">
                    The MICHELIN Guide&rsquo;s Bib Gourmand recognises restaurants serving exceptional food at remarkable value. Angel was
                    awarded one in the 2021 New York selection, for the original room on 37th Road, and the inspectors wrote this.
                  </p>
                  <div className="mt-10 flex flex-wrap gap-4">
                    {michelin.url && (
                      <Button href={michelin.url} external>
                        Read the MICHELIN entry
                      </Button>
                    )}
                    <Button href="/angel" variant="glass">
                      About Angel
                    </Button>
                  </div>
                </Reveal>
              </div>

              <Reveal delay={0.15} className="lg:col-span-7">
                <figure className="glass-strong border-gradient relative overflow-hidden rounded-[2rem] p-8 shadow-glow-lg md:p-12">
                  <span aria-hidden className="orb orb-gold -right-[15%] -top-[45%] size-[55%] opacity-50" />
                  <div className="relative">
                    <div className="flex items-center gap-3">
                      <Award aria-hidden className="size-5 text-gold" strokeWidth={1.5} />
                      <p className="eyebrow text-[0.58rem] text-gold-light">MICHELIN Guide · {michelin.date}</p>
                    </div>
                    <blockquote className="mt-7">
                      <span aria-hidden className="pointer-events-none block font-display text-[5rem] leading-[0.5] text-gold-gradient opacity-40">&ldquo;</span>
                      <p className="mt-4 font-display text-display-sm font-light italic leading-snug text-fg md:text-display-md">{michelin.excerpt}</p>
                    </blockquote>
                    <figcaption className="mt-8 border-t border-line pt-6">
                      <p className="eyebrow text-[0.55rem] text-muted">The MICHELIN Guide inspectors, on Angel Indian Restaurant</p>
                    </figcaption>
                  </div>
                </figure>
              </Reveal>
            </div>
          </Container>
        </Section>
      )}

      {/* ---------- peer recognition ---------- */}
      {khanna && (
        <Section tone="deep" orbs="gold" pattern divider grain>
          <Container>
            <div className="mx-auto max-w-4xl text-center">
              <Reveal>
                <Eyebrow align="center">Peer recognition</Eyebrow>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="mt-10 font-display text-display-md font-light italic leading-tight text-gold-gradient md:text-display-lg">
                  &ldquo;{khanna.excerpt}&rdquo;
                </p>
              </Reveal>
              <Reveal delay={0.2}>
                <p className="eyebrow mt-10 text-gold-light">Chef Vikas Khanna</p>
                <p className="mt-2 text-sm text-fg/60">Michelin-starred chef, author and restaurateur</p>
                <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-fg/45">
                  Naming his favourite New York restaurants for the MICHELIN Guide, May 2025.
                </p>
                {khanna.url && (
                  <Button href={khanna.url} variant="glass" external className="mt-8">
                    Read it at the MICHELIN Guide
                  </Button>
                )}
              </Reveal>
            </div>
          </Container>
        </Section>
      )}

      {/* ---------- the coverage wall ---------- */}
      <Section tone="base" orbs="ember" divider>
        <Container>
          <div className="mb-10 max-w-3xl">
            <Reveal>
              <Eyebrow>The Coverage</Eyebrow>
            </Reveal>
            <Reveal delay={0.1}>
              <Heading as="h2" size="lg" className="mt-8">
                Read it <Em shimmer>in their words.</Em>
              </Heading>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="mt-8 text-lead text-fg/65">
                Every card opens the original article. Filter by awards, reviews, guide listings or film.
              </p>
            </Reveal>
          </div>
          <Reveal delay={0.15}>
            <PressWall items={wall} />
          </Reveal>
        </Container>
      </Section>

      {/* ---------- as featured in ---------- */}
      <Section tone="raised" padding="tight" orbs="subtle" divider>
        <Container>
          <Reveal>
            <Eyebrow align="center">As featured in</Eyebrow>
          </Reveal>
          <RevealGroup className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {pressOutlets.map((outlet) => (
              <RevealItem key={outlet}>
                <div className="glass grid h-full place-items-center rounded-frame px-4 py-6 text-center transition-all duration-500 ease-luxe hover:border-gold/60 hover:shadow-glow">
                  <span className="font-display text-lg leading-tight text-fg/80 transition-colors duration-300 md:text-xl">{outlet}</span>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </Section>

      {/* ---------- press enquiries ---------- */}
      <Section tone="base" orbs="gold" divider>
        <Container>
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-5">
              <Reveal>
                <Eyebrow>Press enquiries</Eyebrow>
                <Heading as="h2" size="md" className="mt-8">
                  For interviews <Em>and features.</Em>
                </Heading>
                <p className="mt-6 max-w-md text-sm leading-relaxed text-fg/65">
                  Chef Amrit is available for interviews, features, demonstrations and photography. Use the contact form and note
                  &ldquo;press&rdquo; in your message, and the team will come back within two working days.
                </p>
              </Reveal>
            </div>
            <Reveal delay={0.1} className="lg:col-span-7">
              <SpotlightCard className="p-8 md:p-10" tilt={2}>
                <div className="flex items-center gap-3">
                  <Mail aria-hidden className="size-5 text-gold" strokeWidth={1.5} />
                  <p className="eyebrow text-[0.58rem] text-gold-light">Media kit, on request</p>
                </div>
                <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                  {["Chef biography and headshots", "High-resolution dish photography", "Restaurant history and fact sheet", "Interview availability"].map((x) => (
                    <li key={x} className="flex items-start gap-3 text-sm text-fg/75">
                      <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-gold shadow-[0_0_8px_rgba(201,169,98,0.9)]" />
                      {x}
                    </li>
                  ))}
                </ul>
                <div className="mt-9 flex flex-wrap items-center gap-4">
                  <Button href="/contact">Contact for press</Button>
                  <Badge tone="gold">Replies within two working days</Badge>
                </div>
              </SpotlightCard>
            </Reveal>
          </div>
        </Container>
      </Section>

      <FinalCta />
    </>
  );
}
