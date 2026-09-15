import type { Metadata } from "next";
import { Suspense } from "react";
import { gallery, galleryCategories } from "@/data/gallery";
import { buildMetadata } from "@/lib/seo/metadata";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";
import { FinalCta } from "@/components/sections/FinalCta";
import { Container } from "@/components/ui/Container";
import { Em } from "@/components/ui/Heading";
import { PageHero } from "@/components/ui/PageHero";
import { Section } from "@/components/ui/Section";

export const metadata: Metadata = buildMetadata({
  title: "Gallery",
  description:
    "Signature dishes, private dining, events, behind the scenes, chef in action and plating from Chef Amrit Pal Singh and Angel Indian Restaurant.",
  path: "/gallery",
});

export default function GalleryPage() {
  return (
    <>
      <PageHero
        eyebrow="Gallery"
        title={
          <>
            Dishes, tables, <Em>and the hands behind them.</Em>
          </>
        }
        lead="Signature dishes, private dining rooms, events, and the quiet work of the kitchen before service."
      />
      <Section tone="base" padding="none" className="pb-section" orbs="subtle">
        <Container size="wide">
          <Suspense fallback={<div className="h-96" aria-busy="true" />}>
            <GalleryGrid items={gallery} categories={galleryCategories} />
          </Suspense>
        </Container>
      </Section>
      <FinalCta />
    </>
  );
}
