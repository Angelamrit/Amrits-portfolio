import { chef } from "@/data/chef";
import { site } from "@/data/site";
import type { VenueDetails } from "@/lib/content/venue";

export function personJsonLd(venue: VenueDetails) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: chef.name,
    jobTitle: "Owner & Head Chef",
    description: chef.shortBio,
    url: site.url,
    birthPlace: { "@type": "Place", name: "Pathankot, India" },
    award: ["Michelin Bib Gourmand (Angel Indian Restaurant)"],
    worksFor: {
      "@type": "Restaurant",
      name: venue.name,
      address: {
        "@type": "PostalAddress",
        streetAddress: venue.address.street,
        addressLocality: venue.address.city,
        addressRegion: venue.address.region,
        postalCode: venue.address.postal,
        addressCountry: venue.address.country,
      },
    },
  };
}

export function restaurantJsonLd(venue: VenueDetails) {
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: venue.name,
    url: new URL("/angel", site.url).toString(),
    servesCuisine: ["Indian", "North Indian", "Vegetarian"],
    address: {
      "@type": "PostalAddress",
      streetAddress: venue.address.street,
      addressLocality: venue.address.city,
      addressRegion: venue.address.region,
      postalCode: venue.address.postal,
      addressCountry: venue.address.country,
    },
    ...(venue.resyUrl ? { acceptsReservations: venue.resyUrl } : {}),
    founder: { "@type": "Person", name: chef.name },
    award: "Michelin Bib Gourmand",
  };
}
