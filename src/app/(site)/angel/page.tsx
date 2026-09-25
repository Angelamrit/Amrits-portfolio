import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { chef } from "@/data/chef";
import { getSignatureDishes } from "@/lib/content/dishes";
import { getMenus } from "@/lib/content/menus";
import { getVenue } from "@/lib/content/venue";
import { restaurant } from "@/data/restaurant";
import { seo } from "@/data/seo";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd } from "@/lib/seo/jsonld";
import { JsonLd } from "@/components/seo/JsonLd";
import { Badge, DietaryBadges } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CompareSlider } from "@/components/ui/CompareSlider";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading, Em } from "@/components/ui/Heading";
import { ImageFrame } from "@/components/ui/ImageFrame";
import { PageHero } from "@/components/ui/PageHero";
import { Prose } from "@/components/ui/Prose";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { StatRow } from "@/components/ui/Stat";

export const metadata: Metadata = buildMetadata({ seo: seo.angel, path: "/angel" });

export default async function AngelPage() {
  const [menus, signatureDishes, venue] = await Promise.all([getMenus(), getSignatureDishes(), getVenue()]);

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Angel Indian Restaurant", path: "/angel" }])} />
      <PageHero
        eyebrow="The Restaurant"
        title={
          <>
            Angel Indian Restaurant, <Em>Jackson Heights.</Em>
          </>
        }
        lead={restaurant.tagline}
        image={restaurant.heroImage}
        cinematicImage
        imageFocal="left"
      >
        <div className="flex flex-wrap gap-4">
          {venue.resyUrl && <Button href={venue.resyUrl}>Reserve via Resy</Button>}
          <Button href="/menus?menu=tasting" variant="glass">
            The tasting menu
          </Button>
        </div>
      </PageHero>

      {/* 01 The story */}
      <Section tone="base" className="lg:pt-48" orbs="subtle">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <Reveal>
                <Eyebrow>01 · The Story</Eyebrow>
                <Heading as="h2" size="md" className="mt-8">
                  Six burners, one tandoor, <Em>one fridge.</Em>
                </Heading>
                <p className="mt-6 font-display text-xl font-light italic text-gold-gradient">{restaurant.namesake}.</p>
              </Reveal>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              <Reveal>
                <Prose size="lead">
                  {restaurant.story.map((p) => (
                    <p key={p.slice(0, 24)} className="first:font-display first:text-display-sm first:font-light first:text-fg">
                      {p}
                    </p>
                  ))}
                </Prose>
              </Reveal>
              <Reveal delay={0.1}>
                <StatRow stats={restaurant.facts} glass className="mt-10 max-w-xl" />
              </Reveal>
              <Reveal delay={0.15}>
                <ul className="mt-8 flex flex-wrap gap-2">
                  {restaurant.features.map((f) => (
                    <li key={f}>
                      <Badge>{f}</Badge>
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
          </div>
        </Container>
      </Section>

      {/* 02 Two dining rooms */}
      <Section tone="raised" orbs="ember" divider>
        <Container>
          <div className="max-w-2xl">
            <Reveal>
              <Eyebrow>02 · The Dining Rooms</Eyebrow>
            </Reveal>
            <Reveal delay={0.1}>
              <Heading as="h2" size="lg" className="mt-8">
                The original room, <Em>and the new one.</Em>
              </Heading>
            </Reveal>
          </div>
          <Reveal delay={0.15} className="mt-14">
            <p className="eyebrow mb-4 text-[0.6rem] text-gold-light/80">Drag to compare · from six burners to a Bib Gourmand</p>
            <CompareSlider before={restaurant.thenNow.before} after={restaurant.thenNow.after} ratio="aspect-[16/9] md:aspect-[21/9]" sizes="(min-width: 1024px) 80vw, 100vw" />
          </Reveal>
          <RevealGroup className="mt-8 grid gap-6 lg:grid-cols-2">
            {restaurant.locations.map((loc, i) => (
              <RevealItem key={loc.name}>
                <SpotlightCard as="article" id={loc.kind} className="group relative h-full scroll-mt-28 overflow-hidden p-3" tilt={2}>
                  <div className="relative overflow-hidden rounded-[calc(var(--radius-frame)-0.25rem)]">
                    <ImageFrame image={loc.image} ratio="16/9" hover sheen reveal="curtain" rounded={false} sizes="(min-width: 1024px) 50vw, 100vw" />
                    <div aria-hidden className="absolute inset-0 z-[1] bg-gradient-to-t from-surface-2 via-transparent to-transparent" />
                    <Badge tone="solid" className="absolute left-4 top-4 z-[2]">
                      {loc.kind === "original" ? "Since October 2019" : "New upscale location"}
                    </Badge>
                  </div>
                  <div className="p-5 md:p-7">
                    <p className="eyebrow text-gold-light/90">{String(i + 1).padStart(2, "0")}</p>
                    <h3 className="mt-3 font-display text-display-sm font-light text-gold-gradient">{loc.name}</h3>
                    <p className="mt-4 text-sm leading-relaxed text-fg/65">{loc.description}</p>
                    <ul className="mt-6 space-y-2 text-sm text-fg/75">
                      {loc.highlights.map((h) => (
                        <li key={h} className="flex items-start gap-3">
                          <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-gold shadow-[0_0_8px_rgba(201,169,98,0.9)]" />
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                </SpotlightCard>
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </Section>

      {/* 03 What is served */}
      <Section tone="base" orbs="gold" pattern divider>
        <Container>
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between md:[&>*:last-child]:shrink-0">
            <div className="max-w-2xl">
              <Reveal>
                <Eyebrow>03 · On the Table</Eyebrow>
              </Reveal>
              <Reveal delay={0.1}>
                <Heading as="h2" size="lg" className="mt-8">
                  Street food to <Em>regional delicacies.</Em>
                </Heading>
              </Reveal>
            </div>
            <Reveal delay={0.2} className="flex flex-wrap gap-3">
              <Button href="/menus" variant="glass">
                Explore the menus
              </Button>
              {venue.menuUrl && (
                <Button href={venue.menuUrl} external>
                  Full menu at Angel
                </Button>
              )}
            </Reveal>
          </div>

          <div className="mt-16 grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-4">
              <Reveal>
                <Eyebrow rule={false}>Menus served at Angel</Eyebrow>
                <ul className="mt-6 space-y-3">
                  {menus.map((m) => (
                    <li key={m.slug}>
                      <Link
                        href={`/menus?menu=${m.slug}`}
                        className="group glass flex items-center justify-between gap-6 rounded-frame px-6 py-5 transition-all hover:border-gold/50 hover:shadow-glow"
                      >
                        <span>
                          <span className="block font-display text-display-sm font-light transition-colors group-hover:text-gold-light">{m.name}</span>
                          <span className="eyebrow mt-1 block text-[0.6rem] text-muted">
                            {m.courseLabel} · {m.venue}
                          </span>
                        </span>
                        <ArrowUpRight aria-hidden className="size-5 shrink-0 text-gold" strokeWidth={1.5} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
            <div className="lg:col-span-8">
              <Reveal>
                <Eyebrow rule={false}>Signature dishes</Eyebrow>
              </Reveal>
              <RevealGroup className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {signatureDishes.map((dish, i) => (
                  <RevealItem key={dish.id}>
                    <SpotlightCard as="article" className="group h-full overflow-hidden p-3" tilt={2}>
                      <ImageFrame image={dish.image} ratio="4/3" hover sheen reveal="curtain" sizes="(min-width: 1024px) 25vw, 50vw" />
                      <div className="p-3 pt-4">
                        <p className="eyebrow text-[0.6rem] text-muted">
                          {String(i + 1).padStart(2, "0")} · {dish.tagline}
                        </p>
                        <h3 className="mt-2 font-display text-xl font-normal transition-colors group-hover:text-gold-light">{dish.name}</h3>
                        <div className="mt-3">
                          <DietaryBadges tags={dish.tags} />
                        </div>
                      </div>
                    </SpotlightCard>
                  </RevealItem>
                ))}
              </RevealGroup>
            </div>
          </div>
        </Container>
      </Section>

      {/* 04 Recognition */}
      <Section tone="deep" orbs="gold" pattern divider grain>
        <Container>
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <Reveal>
                <Eyebrow>04 · Recognition</Eyebrow>
                <Heading as="h2" size="md" className="mt-8">
                  In the guide, <Em>and among peers.</Em>
                </Heading>
                <p className="mt-6 max-w-sm text-sm leading-relaxed text-fg/55">Only genuine, publicly documented recognition appears here.</p>
              </Reveal>
              <div className="mt-10 hidden lg:block">
                <ImageFrame image={restaurant.barImage} ratio="4/5" glow drift sheen reveal="curtain" sizes="30vw" className="max-w-sm" />
              </div>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              <RevealGroup className="grid gap-4">
                {chef.recognition.map((r) => (
                  <RevealItem key={r.title}>
                    <SpotlightCard className="grid gap-2 p-7 sm:grid-cols-[12rem_1fr] sm:gap-8" tilt={2}>
                      <p className="eyebrow">{r.issuer}</p>
                      <div>
                        <p className="font-display text-display-sm font-light text-gold-gradient">{r.title}</p>
                        {r.note && <p className="mt-2 text-sm text-fg/55">{r.note}</p>}
                      </div>
                    </SpotlightCard>
                  </RevealItem>
                ))}
              </RevealGroup>
              <Reveal delay={0.2}>
                <Button href="/press" variant="glass" className="mt-10">
                  Press &amp; awards
                </Button>
              </Reveal>
            </div>
          </div>
        </Container>
      </Section>

      {/* 05 Visit */}
      <Section tone="base" orbs="subtle" divider>
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-5">
              <Reveal>
                <Eyebrow>05 · Visit</Eyebrow>
                <Heading as="h2" size="lg" className="mt-8">
                  Dinner at <Em shimmer>Angel.</Em>
                </Heading>
                <p className="mt-8 max-w-md text-lead text-fg/70">
                  Chef Amrit is in the kitchen every night. Reserve a table and come taste it for yourself.
                </p>
              </Reveal>
            </div>
            <div className="lg:col-span-6 lg:col-start-7">
              <Reveal delay={0.1}>
                <div className="glass-strong border-gradient relative overflow-hidden rounded-[2rem] p-8 md:p-10">
                  <span aria-hidden className="orb orb-gold -right-[15%] -top-[40%] size-[60%] opacity-40" />
                  <dl className="relative grid gap-8 sm:grid-cols-2">
                    <div>
                      <dt className="eyebrow text-[0.6rem] text-muted">Address</dt>
                      <dd className="mt-2 text-sm leading-relaxed text-fg/80">
                        {venue.address.street}
                        <br />
                        {venue.address.city}, {venue.address.region} {venue.address.postal}
                      </dd>
                      {venue.mapsUrl && (
                        <dd className="mt-3">
                          <Button href={venue.mapsUrl} variant="link" external>
                            Open in Maps
                          </Button>
                        </dd>
                      )}
                    </div>
                    <div>
                      <dt className="eyebrow text-[0.6rem] text-muted">Service</dt>
                      <dd className="mt-2 text-sm leading-relaxed text-fg/80">{venue.hours}. New dining room with full bar.</dd>
                      <dd className="mt-3 flex flex-wrap gap-1.5">
                        {venue.notes.map((n) => (
                          <Badge key={n} className="px-2.5 py-1">
                            {n}
                          </Badge>
                        ))}
                      </dd>
                    </div>
                  </dl>
                  <div className="relative mt-10 flex flex-wrap gap-4">
                    {venue.resyUrl && <Button href={venue.resyUrl}>Reserve via Resy</Button>}
                    <Button href="/contact" variant="glass">
                      Get in touch
                    </Button>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </Container>
      </Section>

    </>
  );
}
