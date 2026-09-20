import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { menus } from "@/data/menus";
import { dishById } from "@/data/dishes";
import { site } from "@/data/site";
import { buildMetadata } from "@/lib/seo/metadata";
import { DietaryLegend } from "@/components/menus/DietaryLegend";
import { MenuSwitcher, type ResolvedMenu } from "@/components/menus/MenuSwitcher";
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

export const metadata: Metadata = buildMetadata({
  title: "Menus",
  description:
    "The Chef's Tasting Menu, House Specialties and Private Event Menu by Chef Amrit Pal Singh: predominantly vegetarian, 100% Halal, rooted in India.",
  path: "/menus",
});

function resolveMenus(): ResolvedMenu[] {
  return menus.map((m) => ({
    slug: m.slug,
    name: m.name,
    kind: m.kind,
    courseLabel: m.courseLabel,
    courseCount: m.courseCount,
    intro: m.intro,
    notes: m.notes,
    venue: m.venue,
    pdfUrl: m.pdfUrl,
    image: m.image,
    courses: m.courses.map((c) => {
      const dish = c.dishId ? dishById(c.dishId) : undefined;
      return {
        title: c.title,
        name: c.name ?? dish?.name ?? (c.status === "draft" ? "Chef's seasonal course" : c.title),
        description: c.description ?? dish?.description,
        tags: c.tags ?? dish?.tags ?? [],
        status: c.status,
        image: dish?.image,
      };
    }),
  }));
}

export default function MenusPage() {
  const resolved = resolveMenus();
  const hero = menus[0].image;

  return (
    <>
      {/* ---------- cinematic hero ---------- */}
      <section className="tone-dark relative overflow-hidden bg-brown-deep pt-40 pb-16 grain md:pt-48 md:pb-20">
        <Parallax amount={70}>
          <ImageFrame image={hero} ratio="fill" reveal="none" sizes="100vw" quality={65} imgClassName="opacity-45" />
        </Parallax>
        <div aria-hidden className="absolute inset-0 z-[1] bg-gradient-to-b from-brown-deep/90 via-brown-deep/55 to-brown-deep" />
        <div aria-hidden className="absolute inset-0 z-[1] bg-gradient-to-r from-brown-deep/95 via-brown-deep/45 to-transparent" />
        <Orbs variant="gold" className="z-[1]" />

        <Container className="relative z-[2]">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              <Reveal>
                <Eyebrow>The Menus</Eyebrow>
              </Reveal>
              <Reveal delay={0.1}>
                <Heading as="h1" size="xl" className="mt-8">
                  Three menus, <Em shimmer>course by course.</Em>
                </Heading>
              </Reveal>
              <Reveal delay={0.2}>
                <p className="mt-8 max-w-2xl text-lead text-fg/75">
                  Two are served at Angel: the seven-course Chef&rsquo;s Tasting Menu in the new dining room, and the House Specialties that
                  built its name. The third is the framework Chef Amrit designs around for your private event. Every course is listed with
                  its dietary notes, so you know exactly what arrives at the table.
                </p>
              </Reveal>
              <Reveal delay={0.3}>
                <ul className="mt-8 flex flex-wrap gap-2">
                  {["Predominantly vegetarian", "100% Halal", "Vegan & gluten-free options", "Housemade paneer"].map((f) => (
                    <li key={f}>
                      <Badge>{f}</Badge>
                    </li>
                  ))}
                </ul>
              </Reveal>
              <Reveal delay={0.4}>
                <div className="mt-10 flex flex-wrap gap-4">
                  {site.restaurant.menuUrl && (
                    <Button href={site.restaurant.menuUrl} external>
                      View the full menu at Angel
                    </Button>
                  )}
                  <Button href="/contact" variant="glass">
                    Request a bespoke menu
                  </Button>
                  {site.restaurant.resyUrl && (
                    <Button href={site.restaurant.resyUrl} variant="outline">
                      Reserve at Angel via Resy
                    </Button>
                  )}
                </div>
              </Reveal>
            </div>
            <Reveal delay={0.35} className="hidden lg:col-span-4 lg:flex lg:justify-end">
              <Medallion text="Predominantly Vegetarian · 100% Halal · India · " size={200} className="text-gold-light">
                <span className="block text-center font-display leading-none">
                  <span className="block text-[0.5rem] uppercase tracking-[0.3em] text-fg/60">Angel</span>
                  <span className="mt-1 block text-2xl text-gold-gradient">Menus</span>
                </span>
              </Medallion>
            </Reveal>
          </div>

          {/* menu tiles */}
          <RevealGroup className="mt-14 grid gap-4 md:grid-cols-3">
            {resolved.map((mn, i) => (
              <RevealItem key={mn.slug}>
                <SpotlightCard as="article" className="group relative flex h-full items-center gap-4 p-3 pr-5" tilt={3}>
                  <Link href={`/menus?menu=${mn.slug}#menu-card`} className="absolute inset-0 z-[4]" aria-label={`View the ${mn.name}`} />
                  <span className="relative block size-20 shrink-0 overflow-hidden rounded-xl bg-sand">
                    <Image src={mn.image.src} alt={mn.image.alt} fill sizes="96px" className="object-cover transition-transform duration-[1200ms] ease-luxe group-hover:scale-110" />
                    <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-brown-deep/70 to-transparent" />
                    <span aria-hidden className="absolute bottom-1.5 left-2 font-display text-sm leading-none text-gold-light">{String(i + 1).padStart(2, "0")}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="eyebrow block text-[0.5rem] text-gold-light/80">{mn.venue}</span>
                    <span className="mt-1.5 block font-display text-xl leading-tight transition-colors duration-300 group-hover:text-gold-light">{mn.name}</span>
                    <span className="eyebrow mt-1.5 block text-[0.5rem] text-muted">{mn.courseLabel}</span>
                  </span>
                  <span className="glass grid size-9 shrink-0 place-items-center rounded-full text-gold-light transition-all duration-500 group-hover:bg-gold group-hover:text-charcoal">
                    <ArrowUpRight aria-hidden className="size-4" strokeWidth={1.5} />
                  </span>
                </SpotlightCard>
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </section>

      {/* ---------- interactive menu card ---------- */}
      <Section id="menu-card" tone="base" orbs="gold" pattern className="scroll-mt-24">
        <Container>
          <div className="mb-10 max-w-2xl">
            <Reveal>
              <Eyebrow>Explore each menu</Eyebrow>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-6 text-lead text-fg/65">Choose a menu, then hover or tap any course to see the dish.</p>
            </Reveal>
          </div>
          <Suspense fallback={<div className="h-96" aria-busy="true" />}>
            <MenuSwitcher menus={resolved} />
          </Suspense>
          {site.restaurant.menuUrl && (
            <Reveal delay={0.1} className="mt-12 flex justify-center">
              <Button href={site.restaurant.menuUrl} external>
                View the full menu at Angel
              </Button>
            </Reveal>
          )}
        </Container>
      </Section>

      {/* ---------- dietary key ---------- */}
      <Section tone="raised" orbs="ember" divider>
        <Container>
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-4">
              <Reveal>
                <Eyebrow>Dietary key</Eyebrow>
                <Heading as="h2" size="md" className="mt-6">
                  Every course, <Em>clearly marked.</Em>
                </Heading>
                <p className="mt-6 max-w-sm text-sm leading-relaxed text-fg/60">
                  Tell us about allergies and dietary requirements when booking. The kitchen handles nuts, dairy and gluten, and most dishes
                  can be made vegan.
                </p>
              </Reveal>
            </div>
            <Reveal delay={0.1} className="lg:col-span-8">
              <DietaryLegend />
            </Reveal>
          </div>
        </Container>
      </Section>

      <FinalCta
        eyebrow="A menu written for you"
        title={
          <>
            Design your own <Em shimmer>tasting menu.</Em>
          </>
        }
      />
    </>
  );
}
