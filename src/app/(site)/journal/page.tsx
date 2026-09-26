import type { Metadata } from "next";
import { articles } from "@/data/journal";
import { filterPlaceholders } from "@/lib/placeholders";
import { seo } from "@/data/seo";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd } from "@/lib/seo/jsonld";
import { JsonLd } from "@/components/seo/JsonLd";
import { ArticleCard } from "@/components/journal/ArticleCard";
import { FinalCta } from "@/components/sections/FinalCta";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Em } from "@/components/ui/Heading";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SpotlightCard } from "@/components/ui/SpotlightCard";

const hasPublished = filterPlaceholders(articles).some((a) => a.status === "published");

// Until the first article is approved this page is a list of titles marked
// "upcoming", which search engines treat as thin content. It stays reachable
// but out of the index, and out of the sitemap, until something is published.
export const metadata: Metadata = buildMetadata({ seo: seo.journal, path: "/journal", noindex: !hasPublished });

export default function JournalPage() {
  const live = filterPlaceholders(articles).filter((a) => a.status === "published" || process.env.NEXT_PUBLIC_SHOW_PLACEHOLDERS === "true");
  const [featured, ...rest] = live;
  const upcoming = articles.filter((a) => !live.includes(a));

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Journal", path: "/journal" }])} />
      <PageHero
        eyebrow="Journal"
        title={
          <>
            Notes from <Em>the kitchen.</Em>
          </>
        }
        lead="Recipes, stories and the thinking behind the food: plating, seasonal ingredients, and how a tasting menu comes together."
      />

      <Section tone="base" padding="none" className="pb-section" orbs="subtle" pattern>
        <Container>
          {featured ? (
            <>
              <Reveal>
                <ArticleCard article={featured} featured />
              </Reveal>
              {rest.length > 0 && (
                <RevealGroup className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.map((a) => (
                    <RevealItem key={a.slug}>
                      <ArticleCard article={a} />
                    </RevealItem>
                  ))}
                </RevealGroup>
              )}
            </>
          ) : (
            <Reveal>
              <div className="glass-strong border-gradient relative overflow-hidden rounded-[2rem] p-8 md:p-14">
                <span aria-hidden className="orb orb-gold -right-[10%] -top-[40%] size-[50%] opacity-50" />
                <div className="relative">
                  <Eyebrow>Coming soon</Eyebrow>
                  <p className="mt-6 max-w-2xl font-display text-display-md font-light">
                    New stories are being written <Em>between services.</Em>
                  </p>
                </div>
              </div>
            </Reveal>
          )}

          {upcoming.length > 0 && (
            <div className="mt-12">
              <Eyebrow>In the works</Eyebrow>
              <RevealGroup className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {upcoming.map((a, i) => (
                  <RevealItem key={a.slug}>
                    <SpotlightCard className="flex h-full flex-col justify-between gap-6 p-6" tilt={2}>
                      <span className="font-display text-3xl text-gold-gradient">{String(i + 1).padStart(2, "0")}</span>
                      <div>
                        <p className="font-display text-display-sm font-light">{a.title}</p>
                        <p className="mt-2 text-sm text-fg/55">{a.excerpt}</p>
                      </div>
                      <Badge tone="gold" className="self-start">
                        Upcoming
                      </Badge>
                    </SpotlightCard>
                  </RevealItem>
                ))}
              </RevealGroup>
            </div>
          )}
        </Container>
      </Section>

      <FinalCta />
    </>
  );
}
