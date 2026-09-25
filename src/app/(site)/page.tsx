import type { Metadata } from "next";
import { seo } from "@/data/seo";
import { buildMetadata } from "@/lib/seo/metadata";
import { Hero } from "@/components/sections/Hero";
import { Manifesto } from "@/components/sections/Manifesto";
import { MeetTheChef } from "@/components/sections/MeetTheChef";
import { AngelRestaurant } from "@/components/sections/AngelRestaurant";
import { SignatureDishes } from "@/components/sections/SignatureDishes";
import { MenusPreview } from "@/components/sections/MenusPreview";
import { GalleryEditorial } from "@/components/sections/GalleryEditorial";
import { Voices } from "@/components/sections/Voices";
import { FinalCta } from "@/components/sections/FinalCta";
import { ChapterNav, type Chapter } from "@/components/layout/ChapterNav";

export const metadata: Metadata = buildMetadata({ seo: seo.home, path: "/" });

/**
 * The home page is arranged as a single story, in chapters:
 *
 *   WOW        Hero + scroll-driven manifesto
 *   01 WHO     Meet the Chef
 *   02 WHERE   Angel, his Michelin Bib Gourmand restaurant
 *   03 WHAT    Signature dishes
 *   04 MENUS   The tasting menu
 *   05 SEE     Gallery
 *   06 PROOF   Recognition
 *   ACTION     Reserve a table at Angel
 */
const chapters: Chapter[] = [
  { id: "meet-the-chef", label: "The Chef" },
  { id: "angel", label: "Angel" },
  { id: "signature-dishes", label: "Signature Dishes" },
  { id: "menus", label: "Menus" },
  { id: "gallery", label: "Gallery" },
  { id: "recognition", label: "Recognition" },
];

export default function HomePage() {
  return (
    <>
      <Hero />
      <Manifesto />
      <MeetTheChef />
      <AngelRestaurant />
      <SignatureDishes />
      <MenusPreview />
      <GalleryEditorial />
      <Voices />
      <FinalCta />
      <ChapterNav chapters={chapters} />
    </>
  );
}
