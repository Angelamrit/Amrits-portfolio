import type { SiteConfig } from "@/types/content";
import { images } from "./images";

const DEFAULT_URL = "https://chefamritpalsingh.com";

/**
 * The site's public address, used for canonical links, the sitemap and emails.
 *
 * Every page builds `new URL(...)` from this at build time, so a bad value
 * fails the whole build. A hosting dashboard makes that easy: a variable
 * added with an empty value is "set" to `""`, which `??` does not catch. So a
 * blank value means unset, a bare host like `example.vercel.app` gains
 * `https://`, and anything still unparseable falls back to the default.
 */
function resolveSiteUrl(raw: string | undefined): string {
  const value = raw?.trim();
  if (!value) return DEFAULT_URL;
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    return new URL(withScheme).origin;
  } catch {
    return DEFAULT_URL;
  }
}

export const site: SiteConfig = {
  name: "Chef Amrit Pal Singh",
  shortName: "Amrit Pal Singh",
  url: resolveSiteUrl(process.env.NEXT_PUBLIC_SITE_URL),
  description:
    "Chef Amrit Pal Singh, owner and head chef of Michelin Bib Gourmand–awarded Angel Indian Restaurant in Jackson Heights, Queens. A seven-course tasting menu and regional Indian cooking, served every night at Angel.",
  locale: "en_US",
  restaurant: {
    name: "Angel Indian Restaurant",
    address: {
      street: "75-18 37th Ave",
      city: "Jackson Heights",
      region: "NY",
      postal: "11372",
      country: "US",
    },
    // TODO: confirm the exact Resy listing URL with the chef.
    resyUrl: "https://resy.com/cities/new-york-ny/venues/angel-indian-restaurant",
    menuUrl: "https://www.angelindianrestaurant.com/menu",
    mapsUrl: "https://maps.google.com/?q=Angel+Indian+Restaurant+75-18+37th+Ave+Jackson+Heights+NY+11372",
    hours: "Dinner only",
    notes: ["Predominantly vegetarian", "100% Halal", "Full bar", "Chef's tasting menu"],
  },
  social: {
    // TODO: add verified handles.
  },
  cta: { label: "Reserve a Table", href: "/contact" },
  thankYou: {
    // TODO: record a 20–30 second clip of Chef Amrit and drop it at public/video/chef-thank-you.mp4
    videoUrl: "/video/chef-thank-you.mp4",
    poster: images.chefPlating,
    headline: "A message from Chef Amrit",
    message:
      "Thank you for writing to me. I read every message myself, and I will be in touch within two working days. I hope to welcome you to Angel soon.",
  },
};
