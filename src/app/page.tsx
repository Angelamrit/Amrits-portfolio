import { Hero } from "@/components/sections/Hero";
import { Manifesto } from "@/components/sections/Manifesto";
import { MeetTheChef } from "@/components/sections/MeetTheChef";
import { AngelRestaurant } from "@/components/sections/AngelRestaurant";
import { SignatureDishes } from "@/components/sections/SignatureDishes";
import { PlatingSequence } from "@/components/sections/PlatingSequence";
import { ExperiencesGrid } from "@/components/sections/ExperiencesGrid";
import { MenusPreview } from "@/components/sections/MenusPreview";
import { GalleryEditorial } from "@/components/sections/GalleryEditorial";
import { Voices } from "@/components/sections/Voices";
import { BookingProcess } from "@/components/sections/BookingProcess";
import { FinalCta } from "@/components/sections/FinalCta";
import { ChapterNav, type Chapter } from "@/components/layout/ChapterNav";

/**
 * The home page is arranged as a single story, in chapters:
 *
 *   WOW        Hero + scroll-driven manifesto
 *   01 WHO     Meet the Chef
 *   02 WHERE   Angel, his Michelin Bib Gourmand restaurant
 *   03 WHAT    Signature dishes + scroll-scrubbed plating interlude
 *   04 HOW     Private experiences beyond the restaurant
 *   05 MENUS   Tasting menu, house specialties, private event menu
 *   06 SEE     Gallery
 *   07 PROOF   Recognition
 *   08 PROCESS How booking works
 *   ACTION     Final call to action
 */
const chapters: Chapter[] = [
  { id: "meet-the-chef", label: "The Chef" },
  { id: "angel", label: "Angel" },
  { id: "signature-dishes", label: "Signature Dishes" },
  { id: "experiences", label: "Experiences" },
  { id: "menus", label: "Menus" },
  { id: "gallery", label: "Gallery" },
  { id: "recognition", label: "Recognition" },
  { id: "process", label: "How it works" },
];

export default function HomePage() {
  return (
    <>
      <Hero />
      <Manifesto />
      <MeetTheChef />
      <AngelRestaurant />
      <SignatureDishes />
      <PlatingSequence />
      <ExperiencesGrid />
      <MenusPreview />
      <GalleryEditorial />
      <Voices />
      <BookingProcess />
      <FinalCta />
      <ChapterNav chapters={chapters} />
    </>
  );
}
