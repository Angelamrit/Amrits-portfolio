import type { SiteConfig } from "@/types/content";
import { images } from "./images";

const DEFAULT_URL = "https://chefamritpalsingh.com";

/**
 * The site's public address, used for canonical links, the sitemap and emails.
 *
 * NEXT_PUBLIC_SITE_URL when it is set. Otherwise, on Vercel, the project's own
 * production address, which Vercel provides itself: before a custom domain is
 * connected that is the project's .vercel.app address, and after, the domain.
 * Without this, a deploy that forgot the variable would point every canonical
 * link, share preview and email link at a domain that does not serve the site.
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
  url: resolveSiteUrl(
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
      process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ||
      process.env.VERCEL_PROJECT_PRODUCTION_URL,
  ),
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
    // Taken from the Reserve link on angelindianrestaurant.com and confirmed to
    // load the venue's booking page. Note the "-ny" suffix: without it Resy
    // returns its "we can't find that page" screen, which is a client-side 404 —
    // the URL still answers 200, so only loading it in a browser catches this.
    resyUrl: "https://resy.com/cities/new-york-ny/venues/angel-indian-restaurant-ny",
    // The restaurant's own website, on its own domain (the Vercel preview address
    // it had before still works, but links should carry the real one). Every
    // "Full menu" button on this site opens it.
    menuUrl: "https://angelindianrestaurantnyc.com/menu",
    mapsUrl: "https://maps.google.com/?q=Angel+Indian+Restaurant+75-18+37th+Ave+Jackson+Heights+NY+11372",
    // Confirmed against the restaurant's own website and the September 2026
    // project update; the telephone number is the one on the awning. Search
    // engines compare these with Google Maps, Resy and Yelp, and a mismatch is
    // read as an unreliable listing.
    phone: "347-848-0098",
    hours: "Tuesday to Sunday, 12–10 PM · Closed Monday",
    // The same hours in the compact form search engines read; parsed by
    // src/lib/seo/opening-hours.ts into the structured data. Editable in the dashboard.
    openingHours: ["Tu-Su 12:00-22:00"],
    notes: ["Predominantly vegetarian", "100% Halal", "Full bar", "Chef's tasting menu"],
  },
  social: {
    // TODO: add verified handles.
  },
  // Shown on the Contact page, and the address the chatbot gives out. Contact
  // form messages go to INQUIRY_TO_EMAIL, set to the same address.
  contactEmail: "angelrestaurant278@gmail.com",
  cta: { label: "Reserve a Table", href: "/contact" },
  thankYou: {
    // No clip has been recorded yet, so the thank-you page and the auto-reply show
    // the photo and the note alone. To add one, put a 20–30 second clip at
    // public/video/chef-thank-you.mp4 and set this to "/video/chef-thank-you.mp4".
    videoUrl: null,
    poster: images.chefInterview,
    headline: "A message from Chef Amrit",
    message:
      "Thank you for writing to me. I read every message myself, and I will be in touch within two working days. I hope to welcome you to Angel soon.",
  },
};
