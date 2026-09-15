import type { Metadata } from "next";
import { Suspense } from "react";
import { menus } from "@/data/menus";
import { dishById } from "@/data/dishes";
import { site } from "@/data/site";
import { buildMetadata } from "@/lib/seo/metadata";
import { DietaryLegend } from "@/components/menus/DietaryLegend";
import { MenuSwitcher, type ResolvedMenu } from "@/components/menus/MenuSwitcher";
import { FinalCta } from "@/components/sections/FinalCta";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Em } from "@/components/ui/Heading";
import { PageHero } from "@/components/ui/PageHero";
import { Section } from "@/components/ui/Section";

export const metadata: Metadata = buildMetadata({
  title: "Menus",
  description:
    "The Chef's Tasting Menu, House Specialties and Private Event Menu by Chef Amrit Pal Singh: predominantly vegetarian, 100% Halal, rooted in Punjab.",
  path: "/menus",
});

function resolveMenus(): ResolvedMenu[] {
  return menus.map((m) => ({
    slug: m.slug,
    name: m.name,
    courseLabel: m.courseLabel,
    intro: m.intro,
    notes: m.notes,
    venue: m.venue,
    pdfUrl: m.pdfUrl,
    image: m.image,
    courses: m.courses.map((c) => {
      const dish = c.dishId ? dishById(c.dishId) : undefined;
      return {
        title: c.title,
        name: c.name ?? dish?.name ?? (c.status === "draft" ? "Course to be confirmed" : c.title),
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
  return (
    <>
      <PageHero
        eyebrow="Menus"
        title={
          <>
            From the street <Em>to the tasting table.</Em>
          </>
        }
        lead="Two menus are served at Angel: the seven-course Chef's Tasting Menu in the new dining room and the House Specialties that built its name. The third is the framework for your private event. Predominantly vegetarian, 100% Halal, presented course by course."
      >
        <div className="flex flex-wrap gap-4">
          <Button href="/contact">Request a bespoke menu</Button>
          {site.restaurant.resyUrl && (
            <Button href={site.restaurant.resyUrl} variant="glass">
              Reserve at Angel via Resy
            </Button>
          )}
        </div>
      </PageHero>

      <Section tone="base" padding="tight" className="pb-section" orbs="gold" pattern>
        <Container>
          <Suspense fallback={<div className="h-64" aria-busy="true" />}>
            <MenuSwitcher menus={resolved} />
          </Suspense>

          <div className="mt-20 rounded-frame glass p-6 md:p-8">
            <Eyebrow rule={false} className="mb-4">
              Dietary key
            </Eyebrow>
            <DietaryLegend />
            <p className="mt-6 max-w-xl text-xs leading-relaxed text-muted">
              Menus change with the season and the market. Please tell us about allergies and dietary requirements when
              booking; the kitchen handles nuts, dairy and gluten.
            </p>
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
