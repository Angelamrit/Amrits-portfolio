import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { articles, articleBySlug } from "@/data/journal";
import { filterPlaceholders, showPlaceholders } from "@/lib/placeholders";
import { buildMetadata } from "@/lib/seo/metadata";
import { ArticleBody } from "@/components/journal/ArticleBody";
import { ArticleCard } from "@/components/journal/ArticleCard";
import { FinalCta } from "@/components/sections/FinalCta";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading } from "@/components/ui/Heading";
import { ImageFrame } from "@/components/ui/ImageFrame";
import { Orbs } from "@/components/ui/Orbs";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";

type Params = { slug: string };

const visibleArticles = () => filterPlaceholders(articles).filter((a) => a.status === "published" || showPlaceholders);

/**
 * Only the articles the chef has approved get a route at all. This is what
 * makes the draft gate real: with on-demand params allowed, a draft's URL
 * still answered 200, and `generateMetadata` below served its title, excerpt
 * and cover image into the page head before the body was withheld — so an
 * unapproved piece leaked through link previews. Turning the slug list into
 * the complete set means the router refuses the request outright.
 */
export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return visibleArticles().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const a = articleBySlug(slug);
  if (!a) return {};
  return buildMetadata({ title: a.title, description: a.excerpt, path: `/journal/${a.slug}`, image: a.cover.src });
}

const fmt = (d: string) => new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

export default async function ArticlePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const article = articleBySlug(slug);
  if (!article || !visibleArticles().some((a) => a.slug === slug)) notFound();

  const more = visibleArticles().filter((a) => a.slug !== slug).slice(0, 3);

  return (
    <>
      <header className="relative overflow-hidden surface-gold pt-36 pb-12 md:pt-44">
        <Orbs variant="mixed" pattern />
        <Container className="relative z-[2]">
          <div className="mx-auto max-w-3xl">
            <Reveal>
              <Eyebrow>Journal</Eyebrow>
            </Reveal>
            <Reveal delay={0.1}>
              <Heading as="h1" size="lg" className="mt-8">
                {article.title}
              </Heading>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <p className="eyebrow text-muted">
                  {fmt(article.date)} · {article.readingTime} min read
                </p>
                {article.status === "draft" && <Badge tone="gold">Draft — awaiting Chef&rsquo;s review</Badge>}
              </div>
            </Reveal>
          </div>
        </Container>
      </header>

      <div className="surface-gold">
        <Container>
          <div className="mx-auto max-w-5xl">
            <ImageFrame image={article.cover} ratio="21/9" glow priority sizes="(min-width: 1024px) 64rem, 100vw" />
          </div>
        </Container>
      </div>

      <Section tone="base" padding="tight" className="pb-section">
        <Container>
          <ArticleBody blocks={article.blocks} />
          <div className="mx-auto mt-14 max-w-prose border-t border-line pt-8">
            <Button href="/journal" variant="link">
              Back to the journal
            </Button>
          </div>
        </Container>
      </Section>

      {more.length > 0 && (
        <Section tone="raised" padding="tight" divider orbs="subtle">
          <Container>
            <Eyebrow>More from the journal</Eyebrow>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {more.map((a) => (
                <ArticleCard key={a.slug} article={a} />
              ))}
            </div>
          </Container>
        </Section>
      )}

      <FinalCta />
    </>
  );
}
