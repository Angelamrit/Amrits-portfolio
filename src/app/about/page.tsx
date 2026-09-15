import type { Metadata } from "next";
import Link from "next/link";
import { chef } from "@/data/chef";
import { images } from "@/data/images";
import { buildMetadata } from "@/lib/seo/metadata";
import { Timeline } from "@/components/about/Timeline";
import { FinalCta } from "@/components/sections/FinalCta";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
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

export const metadata: Metadata = buildMetadata({
  title: "The Chef · Amrit Pal Singh",
  description:
    "From a mother's kitchen in Pathankot, Punjab, to a Michelin Bib Gourmand in Jackson Heights: the story, philosophy, training and recognition of Chef Amrit Pal Singh.",
  path: "/about",
});

/**
 * The About page reads top to bottom as a biography:
 *   01 The Story      who he is and where he comes from
 *   02 Philosophy     the rule he cooks by
 *   03 Milestones     the dated journey
 *   04 Training       where the craft was learned, and the kitchens he has led
 *   05 Recognition    what that journey has earned
 */
export default function AboutPage() {
  const own = chef.restaurants.filter((r) => r.role.startsWith("Owner"));
  const trainedAt = chef.restaurants.filter((r) => !r.role.startsWith("Owner"));

  return (
    <>
      <PageHero
        eyebrow="The Chef"
        title={
          <>
            A life built <Em>around the table.</Em>
          </>
        }
        lead={chef.positioning}
        image={chef.portrait}
      >
        <div className="flex flex-wrap gap-4">
          <Button href="/angel" variant="glass">
            His restaurant, Angel
          </Button>
          <Button href="/contact" variant="link">
            Book a private experience
          </Button>
        </div>
      </PageHero>

      {/* 01 Story */}
      <Section tone="base" className="lg:pt-48" orbs="subtle">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-3">
              <Reveal>
                <Eyebrow>01 · The Story</Eyebrow>
                <p className="mt-6 font-display text-2xl font-light italic text-gold-gradient">From Pathankot to “pride of India.”</p>
              </Reveal>
            </div>
            <div className="lg:col-span-7 lg:col-start-5">
              <Reveal>
                <Prose size="lead">
                  {chef.longBio.map((p) => (
                    <p key={p.slice(0, 24)} className="first:font-display first:text-display-sm first:font-light first:text-fg">
                      {p}
                    </p>
                  ))}
                </Prose>
              </Reveal>
              <Reveal delay={0.1}>
                <StatRow stats={chef.stats} glass className="mt-10 max-w-xl" />
              </Reveal>
            </div>
          </div>
        </Container>
      </Section>

      {/* 02 Philosophy */}
      <Section tone="deep" orbs="gold" pattern divider grain>
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-5">
              <ImageFrame image={images.chefPlating} ratio="4/5" glow sizes="(min-width: 1024px) 40vw, 100vw" />
            </div>
            <div className="lg:col-span-6 lg:col-start-7">
              <Reveal>
                <Eyebrow>02 · Philosophy</Eyebrow>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="mt-8 font-display text-display-lg font-light italic text-gold-gradient">“{chef.philosophy.quote}”</p>
              </Reveal>
              <Reveal delay={0.2}>
                <Prose className="mt-8">
                  {chef.philosophy.body.map((p) => (
                    <p key={p.slice(0, 24)}>{p}</p>
                  ))}
                </Prose>
              </Reveal>
              <Reveal delay={0.25}>
                <ul className="mt-8 flex flex-wrap gap-2">
                  {chef.specialties.map((s) => (
                    <li key={s}>
                      <Badge>{s}</Badge>
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
          </div>
        </Container>
      </Section>

      {/* 03 Milestones */}
      <Section tone="raised" orbs="gold" pattern divider>
        <Container>
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <Reveal>
                <Eyebrow>03 · Milestones</Eyebrow>
                <Heading as="h2" size="md" className="mt-8">
                  Pathankot to <Em>Jackson Heights.</Em>
                </Heading>
              </Reveal>
              <div className="mt-10 hidden lg:block">
                <ImageFrame image={images.chefCooking} ratio="4/5" glow sizes="30vw" className="max-w-sm" />
              </div>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              <Timeline entries={chef.timeline} />
            </div>
          </div>
        </Container>
      </Section>

      {/* 04 Training and career */}
      <Section tone="base" orbs="ember" divider>
        <Container>
          <div className="grid gap-16 lg:grid-cols-2 lg:gap-24">
            <div>
              <Reveal>
                <Eyebrow>04 · Training &amp; Education</Eyebrow>
                <Heading as="h2" size="md" className="mt-8">
                  Where the craft <Em>was learned.</Em>
                </Heading>
              </Reveal>
              <RevealGroup className="mt-10 space-y-3">
                {chef.training.map((t, i) => (
                  <RevealItem key={t.title}>
                    <SpotlightCard className="grid gap-2 p-6 sm:grid-cols-[3rem_10rem_1fr] sm:gap-6" tilt={2}>
                      <span className="font-display text-2xl text-gold-gradient">{String(i + 1).padStart(2, "0")}</span>
                      <h3 className="font-display text-xl font-normal">{t.title}</h3>
                      <p className="text-sm leading-relaxed text-fg/65">{t.body}</p>
                    </SpotlightCard>
                  </RevealItem>
                ))}
              </RevealGroup>
            </div>

            <div>
              <Reveal>
                <Eyebrow>Career</Eyebrow>
                <Heading as="h2" size="md" className="mt-8">
                  Kitchens he has <Em>led and learned in.</Em>
                </Heading>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="eyebrow mt-10 text-[0.6rem] text-muted">His own</p>
                <ul className="mt-4 divide-y divide-line rounded-frame glass px-6">
                  {own.map((r) => (
                    <li key={r.name} className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                      <div>
                        <Link href="/angel" className="font-display text-xl transition-colors hover:text-gold-light">
                          {r.name}
                        </Link>
                        {r.note && <p className="mt-1 text-sm text-fg/55">{r.note}</p>}
                      </div>
                      <p className="eyebrow shrink-0 text-muted">
                        {r.role} · {r.location}
                      </p>
                    </li>
                  ))}
                </ul>
              </Reveal>
              <Reveal delay={0.15}>
                <p className="eyebrow mt-8 text-[0.6rem] text-muted">Trained at</p>
                <ul className="mt-4 divide-y divide-line rounded-frame glass px-6">
                  {trainedAt.map((r) => (
                    <li key={r.name} className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                      <p className="font-display text-xl">{r.name}</p>
                      <p className="eyebrow shrink-0 text-muted">
                        {r.role} · {r.location}
                      </p>
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
          </div>
        </Container>
      </Section>

      {/* 05 Recognition */}
      <Section tone="raised" orbs="subtle" divider>
        <Container>
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <Reveal>
                <Eyebrow>05 · Recognition</Eyebrow>
                <Heading as="h2" size="md" className="mt-8">
                  Earned, <Em>not claimed.</Em>
                </Heading>
                <p className="mt-6 max-w-sm text-sm leading-relaxed text-fg/55">Only genuine, publicly documented recognition appears here.</p>
              </Reveal>
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
                <div className="mt-10 flex flex-wrap gap-4">
                  <Button href="/press" variant="glass">
                    Press &amp; awards
                  </Button>
                  <Button href="/angel" variant="link">
                    Next: the restaurant
                  </Button>
                </div>
              </Reveal>
            </div>
          </div>
        </Container>
      </Section>

      <FinalCta />
    </>
  );
}
