import { primaryNav, visibleNav } from "@/data/nav";
import { experiences } from "@/data/experiences";
import { getMenus } from "@/lib/content/menus";
import { restaurant } from "@/data/restaurant";
import { galleryCategories } from "@/data/gallery";
import { getGallery } from "@/lib/content/gallery";
import type { GalleryCategory } from "@/types/content";
import { HeaderClient } from "./HeaderClient";
import type { MegaPanelData } from "./MegaMenu";

/** Dropdown content for the nav items that have children. */
async function buildPanels(): Promise<MegaPanelData[]> {
  const [menus, gallery] = await Promise.all([getMenus(), getGallery()]);
  const galleryItems = galleryCategories
    .filter((c) => c.value !== "all")
    .map((c) => {
      const first = gallery.find((item) => item.category === (c.value as GalleryCategory));
      return first
        ? {
            href: `/gallery?category=${c.value}`,
            name: c.label,
            blurb: first.caption ?? first.image.alt,
            src: first.image.src,
            alt: first.image.alt,
          }
        : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  return [
    {
      key: "/angel",
      eyebrow: "The Restaurant",
      title: "Angel Indian",
      accent: "Restaurant.",
      blurb: "His own Michelin Bib Gourmand restaurant in Jackson Heights, Queens, now with a second upscale dining room.",
      cta: "Discover Angel",
      ctaHref: "/angel",
      note: `${restaurant.features.slice(0, 3).join(" · ")}`,
      items: restaurant.locations.map((loc) => ({
        href: `/angel#${loc.kind}`,
        name: loc.name,
        blurb: loc.highlights.join(" · "),
        meta: loc.kind === "original" ? "Since October 2019" : "New dining room",
        src: loc.image.src,
        alt: loc.image.alt,
      })),
    },
    {
      key: "/experiences",
      eyebrow: "Private Experiences",
      title: "Six ways to book",
      accent: "Chef Amrit.",
      blurb: "Beyond the restaurant, he brings the kitchen of Angel to your home, your celebration or your residency.",
      cta: "View all experiences",
      ctaHref: "/experiences",
      note: "Every experience begins with a consultation and a menu designed around your guests.",
      items: experiences.map((e) => ({
        href: `/experiences/${e.slug}`,
        name: e.name,
        blurb: e.short,
        meta: e.guestRange,
        src: e.image.src,
        alt: e.image.alt,
      })),
    },
    {
      key: "/menus",
      eyebrow: "Menu",
      title: "Course by",
      accent: "course.",
      blurb: "Two menus served at Angel, and one framework designed around your private event.",
      cta: "Explore all menus",
      ctaHref: "/menus",
      note: "Predominantly vegetarian · 100% Halal · vegan and gluten-free options",
      items: menus.map((m) => ({
        href: `/menus?menu=${m.slug}`,
        name: m.name,
        blurb: m.intro,
        meta: `${m.courseLabel} · ${m.venue}`,
        src: m.image.src,
        alt: m.image.alt,
      })),
    },
    {
      key: "/gallery",
      eyebrow: "Gallery",
      title: "The plates, the tables,",
      accent: "the hands.",
      blurb: "Signature dishes, private dining rooms, events and the quiet work of the kitchen before service.",
      cta: "Open the full gallery",
      ctaHref: "/gallery",
      items: galleryItems,
    },
  ];
}

export async function Header() {
  return <HeaderClient items={primaryNav} mobileItems={visibleNav} panels={await buildPanels()} />;
}
