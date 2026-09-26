import { chef } from "@/data/chef";
import { images } from "@/data/images";
import { site } from "@/data/site";
import type { VenueDetails } from "@/lib/content/venue";
import type { DietaryTag, Menu } from "@/types/content";

/**
 * Structured data (schema.org JSON-LD) for search engines.
 *
 * The site-wide part is one linked graph — the website, the chef and the
 * restaurant — with stable `@id`s, so per-page data (breadcrumbs, the menus,
 * the profile page) can point at the same entities instead of repeating them.
 * Everything here is taken from the site's own verified content; nothing is
 * added that the pages themselves do not say (no invented opening hours,
 * prices or ratings).
 */

const abs = (path: string) => new URL(path, site.url).toString();

export const ids = {
  website: abs("/#website"),
  chef: abs("/#chef"),
  restaurant: abs("/angel#restaurant"),
};

/** The restaurant's own presences, also linked from the footer. */
const restaurantProfiles = ["https://www.angelindianrestaurant.com/", "https://www.instagram.com/angel_indian_restaurant"];

/** Map pin shown on the site's neighbourhood map. */
const geo = { "@type": "GeoCoordinates", latitude: 40.7498, longitude: -73.8895 };

function postalAddress(venue: VenueDetails) {
  return {
    "@type": "PostalAddress",
    streetAddress: venue.address.street,
    addressLocality: venue.address.city,
    addressRegion: venue.address.region,
    postalCode: venue.address.postal,
    addressCountry: venue.address.country,
  };
}

export function siteGraph(venue: VenueDetails) {
  const sameAs = [...new Set([...restaurantProfiles, venue.social.instagram, venue.social.facebook].filter(Boolean))];
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": ids.website,
        url: abs("/"),
        name: site.name,
        description: site.description,
        inLanguage: "en-US",
        publisher: { "@id": ids.chef },
        about: { "@id": ids.restaurant },
      },
      {
        "@type": "Person",
        "@id": ids.chef,
        name: chef.name,
        alternateName: "Chef Amrit",
        jobTitle: "Owner & Head Chef",
        description: chef.shortBio,
        url: abs("/about"),
        image: abs(images.hero.src),
        birthPlace: { "@type": "Place", name: "Pathankot, India" },
        homeLocation: { "@type": "Place", name: "Jackson Heights, Queens, New York" },
        knowsAbout: ["Indian cuisine", "North Indian cuisine", "Tandoor cooking", "Vegetarian cooking", "Halal cooking"],
        award: ["Michelin Bib Gourmand (Angel Indian Restaurant)"],
        worksFor: { "@id": ids.restaurant },
      },
      {
        "@type": "Restaurant",
        "@id": ids.restaurant,
        name: venue.name,
        url: abs("/angel"),
        image: [abs(images.angelDiningRoom.src)],
        description:
          "Michelin Bib Gourmand Indian restaurant in Jackson Heights, Queens: predominantly vegetarian, 100% Halal, with a full bar and a chef's tasting menu.",
        address: postalAddress(venue),
        geo,
        ...(venue.phone ? { telephone: venue.phone } : {}),
        servesCuisine: ["Indian", "North Indian", "Vegetarian", "Halal"],
        hasMenu: abs("/menus"),
        acceptsReservations: venue.resyUrl ?? "True",
        founder: { "@id": ids.chef },
        foundingDate: "2019-10",
        award: "Michelin Bib Gourmand",
        sameAs,
      },
    ],
  };
}

/** Home › … › page. `trail` excludes Home, which is added first. */
export function breadcrumbJsonLd(trail: { name: string; path: string }[]) {
  const items = [{ name: "Home", path: "/" }, ...trail];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({ "@type": "ListItem", position: i + 1, name: item.name, item: abs(item.path) })),
  };
}

export function profilePageJsonLd(path: string) {
  return { "@context": "https://schema.org", "@type": "ProfilePage", url: abs(path), mainEntity: { "@id": ids.chef } };
}

export function contactPageJsonLd(path: string) {
  return { "@context": "https://schema.org", "@type": "ContactPage", url: abs(path), about: { "@id": ids.restaurant } };
}

const diets: Partial<Record<DietaryTag, string>> = {
  vegetarian: "https://schema.org/VegetarianDiet",
  vegan: "https://schema.org/VeganDiet",
  "gluten-free": "https://schema.org/GlutenFreeDiet",
  halal: "https://schema.org/HalalDiet",
};

const menuId = (slug: string) => abs(`/menus?menu=${slug}#menu`);

type MenuForSchema = Pick<Menu, "slug" | "name" | "intro"> & {
  courses: { name: string; title: string; description?: string; tags: DietaryTag[]; status: "confirmed" | "draft" }[];
};

/**
 * The menus as schema.org Menu entities, attached to the restaurant. Courses
 * still marked "draft" (to be confirmed with the chef) are left out.
 */
export function menusJsonLd(menus: MenuForSchema[]) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      // Attaches the menus to the restaurant in the site-wide graph (same @id).
      { "@type": "Restaurant", "@id": ids.restaurant, hasMenu: menus.map((menu) => ({ "@id": menuId(menu.slug) })) },
      ...menus.map((menu) => ({
        "@type": "Menu",
        "@id": menuId(menu.slug),
        name: menu.name,
        description: menu.intro,
        url: abs(`/menus?menu=${menu.slug}`),
        inLanguage: "en-US",
        hasMenuItem: menu.courses
          .filter((c) => c.status === "confirmed" && c.name)
          .map((c) => {
            const suitableForDiet = c.tags.map((t) => diets[t]).filter(Boolean);
            return {
              "@type": "MenuItem",
              name: c.name,
              ...(c.description ? { description: c.description } : {}),
              ...(suitableForDiet.length ? { suitableForDiet } : {}),
            };
          }),
      })),
    ],
  };
}

/** A published journal article, credited to the chef. */
export function articleJsonLd(article: { slug: string; title: string; excerpt: string; date: string; cover: { src: string } }) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.excerpt,
    datePublished: article.date,
    image: abs(article.cover.src),
    url: abs(`/journal/${article.slug}`),
    mainEntityOfPage: abs(`/journal/${article.slug}`),
    inLanguage: "en-US",
    author: { "@id": ids.chef },
    publisher: { "@id": ids.chef },
    isPartOf: { "@id": ids.website },
  };
}
