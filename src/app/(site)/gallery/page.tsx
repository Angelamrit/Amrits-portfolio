import type { Metadata } from "next";
import { Suspense } from "react";
import { galleryCategories } from "@/data/gallery";
import { getGallery } from "@/lib/content/gallery";
import { seo } from "@/data/seo";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd } from "@/lib/seo/jsonld";
import { JsonLd } from "@/components/seo/JsonLd";
import { GalleryGrid, GalleryGridView } from "@/components/gallery/GalleryGrid";
import { FinalCta } from "@/components/sections/FinalCta";
import { Container } from "@/components/ui/Container";
import { Em } from "@/components/ui/Heading";
import { PageHero } from "@/components/ui/PageHero";
import { Section } from "@/components/ui/Section";

export const metadata: Metadata = buildMetadata({ seo: seo.gallery, path: "/gallery" });

export default async function GalleryPage() {
  const gallery = await getGallery();
  // A category with no pictures would open onto an empty page, so its tab is left out
  // until something is uploaded into it.
  const categories = galleryCategories.filter((c) => c.value === "all" || gallery.some((item) => item.category === c.value));

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Gallery", path: "/gallery" }])} />
      <PageHero
        eyebrow="Gallery"
        title={
          <>
            Dishes, tables, <Em>and the hands behind them.</Em>
          </>
        }
        lead="Signature dishes, the dining rooms and the quiet work of the kitchen before service."
      />
      <Section tone="base" padding="none" className="pb-section" orbs="subtle">
        <Container size="wide">
          <Suspense fallback={<GalleryGridView items={gallery} categories={categories} fromUrl={null} />}>
            <GalleryGrid items={gallery} categories={categories} />
          </Suspense>
        </Container>
      </Section>
      <FinalCta />
    </>
  );
}
