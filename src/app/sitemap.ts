import type { MetadataRoute } from "next";
import { site } from "@/data/site";
import { experiences } from "@/data/experiences";
import { articles } from "@/data/journal";
import { filterPlaceholders } from "@/lib/placeholders";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticRoutes = ["/", "/about", "/angel", "/experiences", "/menus", "/gallery", "/press", "/journal", "/contact"].map(
    (path) => ({
      url: new URL(path, site.url).toString(),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: path === "/" ? 1 : path === "/contact" ? 0.9 : path === "/about" || path === "/angel" ? 0.8 : 0.7,
    }),
  );
  const experienceRoutes = experiences.map((e) => ({
    url: new URL(`/experiences/${e.slug}`, site.url).toString(),
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
  const articleRoutes = filterPlaceholders(articles)
    .filter((a) => a.status === "published")
    .map((a) => ({
      url: new URL(`/journal/${a.slug}`, site.url).toString(),
      lastModified: new Date(a.date),
      changeFrequency: "yearly" as const,
      priority: 0.5,
    }));
  return [...staticRoutes, ...experienceRoutes, ...articleRoutes];
}
