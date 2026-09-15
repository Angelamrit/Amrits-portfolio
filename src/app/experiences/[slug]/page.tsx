import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { experiences, experienceBySlug } from "@/data/experiences";
import { menus } from "@/data/menus";
import { galleryByCategory } from "@/data/gallery";
import { buildMetadata } from "@/lib/seo/metadata";
import { BookingProcess } from "@/components/sections/BookingProcess";
import { FinalCta } from "@/components/sections/FinalCta";
import { Accordion } from "@/components/ui/Accordion";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading, Em } from "@/components/ui/Heading";
import { ImageFrame } from "@/components/ui/ImageFrame";
import { PageHero } from "@/components/ui/PageHero";
import { Prose } from "@/components/ui/Prose";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SpotlightCard } from "@/components/ui/SpotlightCard";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return experiences.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const exp = experienceBySlug(slug);
  if (!exp) return {};
  return buildMetadata({ title: exp.name, description: exp.short, path: `/experiences/${exp.slug}`, image: exp.image.src });
}

export default async function ExperienceDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const exp = experienceBySlug(slug);
  if (!exp) notFound();

  const galleryCategory = exp.slug === "private-dining" || exp.slug === "personal-chef" ? "private-dining" : "events";
  const strip = galleryByCategory(galleryCategory).slice(0, 4);
  const others = experiences.filter((e) => e.slug !== exp.slug);

  return (
    <>
      <PageHero eyebrow={`Experience ${String(exp.order).padStart(2, "0")}`} title={exp.name} lead={exp.short} image={exp.image}>
        <div className="flex flex-wrap gap-4">
          <Button href={`/contact?experience=${exp.slug}`}>Enquire about {exp.name}</Button>
          <Button href="/experiences" variant="glass">
            All experiences
          </Button>
        </div>
      </PageHero>

      <Section tone="base" className="lg:pt-48" orbs="subtle">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <Reveal>
                <Prose size="lead">
                  {exp.description.map((p) => (
                    <p key={p.slice(0, 20)}>{p}</p>
                  ))}
                </Prose>
              </Reveal>
            </div>
            <aside className="lg:col-span-4 lg:col-start-9">
              <Reveal delay={0.1}>
                <SpotlightCard className="p-7" tilt={2}>
                  {exp.guestRange && (
                    <>
                      <Eyebrow rule={false}>Guests</Eyebrow>
                      <p className="mt-2 font-display text-display-sm text-gold-gradient">{exp.guestRange}</p>
                    </>
                  )}
                  <Eyebrow rule={false} className="mt-8">
                    Ideal for
                  </Eyebrow>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {exp.idealFor.map((i) => (
                      <li key={i}>
                        <Badge>{i}</Badge>
                      </li>
                    ))}
                  </ul>
                  <Eyebrow rule={false} className="mt-8">
                    What&rsquo;s included
                  </Eyebrow>
                  <ul className="mt-3 space-y-2 text-sm text-fg/75">
                    {exp.includes.map((inc) => (
                      <li key={inc} className="flex items-start gap-3">
                        <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-gold shadow-[0_0_8px_rgba(201,169,98,0.9)]" />
                        {inc}
                      </li>
                    ))}
                  </ul>
                </SpotlightCard>
              </Reveal>
            </aside>
          </div>
        </Container>
      </Section>

      <Section tone="raised" orbs="ember" divider>
        <Container>
          <Reveal>
            <Eyebrow>How it works</Eyebrow>
            <Heading as="h2" size="md" className="mt-6">
              Five steps, <Em>one unhurried evening.</Em>
            </Heading>
          </Reveal>
          <div className="mt-12">
            <BookingProcess compact />
          </div>
        </Container>
      </Section>

      <Section tone="base" orbs="gold" divider>
        <Container>
          <div className="grid gap-16 lg:grid-cols-2 lg:gap-24">
            <div>
              <Reveal>
                <Eyebrow>Suggested menus</Eyebrow>
                <ul className="mt-8 space-y-3">
                  {menus.map((m) => (
                    <li key={m.slug}>
                      <Link href={`/menus?menu=${m.slug}`} className="group glass flex items-center justify-between gap-6 rounded-frame px-6 py-5 transition-all hover:border-gold/50 hover:shadow-glow">
                        <span>
                          <span className="block font-display text-display-sm font-light transition-colors group-hover:text-gold-light">{m.name}</span>
                          <span className="eyebrow mt-1 block text-[0.6rem] text-muted">{m.courseLabel}</span>
                        </span>
                        <ArrowUpRight aria-hidden className="size-5 shrink-0 text-gold" strokeWidth={1.5} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
            {exp.faq && exp.faq.length > 0 && (
              <div>
                <Reveal>
                  <Eyebrow>Questions</Eyebrow>
                  <Accordion items={exp.faq} className="mt-8" />
                </Reveal>
              </div>
            )}
          </div>
        </Container>
      </Section>

      {strip.length > 0 && (
        <Section tone="base" padding="none" className="pb-section">
          <Container size="wide">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {strip.map((g) => (
                <ImageFrame key={g.id} image={g.image} ratio="4/5" hover sizes="(min-width: 1024px) 25vw, 50vw" />
              ))}
            </div>
          </Container>
        </Section>
      )}

      <Section tone="raised" padding="tight" divider>
        <Container>
          <Eyebrow>Other experiences</Eyebrow>
          <ul className="mt-6 flex flex-wrap gap-3">
            {others.map((o) => (
              <li key={o.slug}>
                <Link href={`/experiences/${o.slug}`} className="glass inline-flex rounded-pill px-5 py-3 font-display text-xl font-light transition-all hover:border-gold/50 hover:text-gold-light">
                  {o.name}
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <FinalCta
        eyebrow={exp.name}
        title={
          <>
            Let&rsquo;s plan <Em shimmer>your evening.</Em>
          </>
        }
      />
    </>
  );
}
