import type { MetadataRoute } from "next";
import { site } from "@/data/site";
import { images } from "@/data/images";
import { articles } from "@/data/journal";
import { filterPlaceholders } from "@/lib/placeholders";
import type { ImageAsset } from "@/types/content";

const abs = (path: string) => new URL(path, site.url).toString();

/**
 * Only genuine photographs are listed for image search. The stock placeholders
 * still waiting to be replaced are marked `placeholder` in src/data/images.ts,
 * and offering those as the chef's own work would be misleading.
 */
const photos = (...list: ImageAsset[]) => list.filter((img) => !img.placeholder).map((img) => abs(img.src));

/**
 * Every indexable page.
 *
 * No `lastModified` on the fixed pages: stamping them with the build time on
 * every deploy tells search engines that everything changed every time, and
 * they learn to ignore the field. Articles carry their real publication date.
 * The journal index is listed only once it has a published article; until
 * then it is `noindex` (see its page).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const published = filterPlaceholders(articles).filter((a) => a.status === "published");

  const pages: MetadataRoute.Sitemap = [
    { url: abs("/"), changeFrequency: "monthly", priority: 1, images: photos(images.hero, images.angelDiningRoom) },
    { url: abs("/angel"), changeFrequency: "monthly", priority: 0.9, images: photos(images.angelDiningRoom) },
    { url: abs("/menus"), changeFrequency: "monthly", priority: 0.9 },
    { url: abs("/about"), changeFrequency: "yearly", priority: 0.8, images: photos(images.hero) },
    { url: abs("/contact"), changeFrequency: "yearly", priority: 0.8 },
    { url: abs("/press"), changeFrequency: "monthly", priority: 0.7 },
    { url: abs("/gallery"), changeFrequency: "monthly", priority: 0.6, images: photos(images.hero, images.angelDiningRoom) },
    ...(published.length > 0 ? [{ url: abs("/journal"), changeFrequency: "weekly" as const, priority: 0.6 }] : []),
  ];

  const articlePages: MetadataRoute.Sitemap = published.map((a) => ({
    url: abs(`/journal/${a.slug}`),
    lastModified: new Date(a.date),
    changeFrequency: "yearly",
    priority: 0.5,
    images: photos(a.cover),
  }));

  return [...pages, ...articlePages];
}
