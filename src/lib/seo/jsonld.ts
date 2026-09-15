import { chef } from "@/data/chef";
import { site } from "@/data/site";

export function personJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: chef.name,
    jobTitle: "Owner & Head Chef",
    description: chef.shortBio,
    url: site.url,
    birthPlace: { "@type": "Place", name: "Pathankot, Punjab, India" },
    award: ["Michelin Bib Gourmand (Angel Indian Restaurant)"],
    worksFor: {
      "@type": "Restaurant",
      name: site.restaurant.name,
      address: {
        "@type": "PostalAddress",
        streetAddress: site.restaurant.address.street,
        addressLocality: site.restaurant.address.city,
        addressRegion: site.restaurant.address.region,
        postalCode: site.restaurant.address.postal,
        addressCountry: site.restaurant.address.country,
      },
    },
  };
}

export function restaurantJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: site.restaurant.name,
    url: new URL("/angel", site.url).toString(),
    servesCuisine: ["Indian", "Punjabi", "Vegetarian"],
    address: {
      "@type": "PostalAddress",
      streetAddress: site.restaurant.address.street,
      addressLocality: site.restaurant.address.city,
      addressRegion: site.restaurant.address.region,
      postalCode: site.restaurant.address.postal,
      addressCountry: site.restaurant.address.country,
    },
    ...(site.restaurant.resyUrl ? { acceptsReservations: site.restaurant.resyUrl } : {}),
    founder: { "@type": "Person", name: chef.name },
    award: "Michelin Bib Gourmand",
  };
}
