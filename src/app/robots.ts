import type { MetadataRoute } from "next";
import { site } from "@/data/site";

/**
 * Crawl rules. Everything public is open; the dashboard, the API routes and
 * the thank-you page (reached only from the contact-form auto-reply) are not
 * for search. Those also carry `noindex` themselves — robots.txt only stops
 * crawling, and a blocked URL can still be listed if something links to it.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/thank-you"] },
    sitemap: new URL("/sitemap.xml", site.url).toString(),
    host: site.url,
  };
}
