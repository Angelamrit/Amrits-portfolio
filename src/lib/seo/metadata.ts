import type { Metadata } from "next";
import { site } from "@/data/site";
import type { PageSeo } from "@/data/seo";

export function siteUrl(path = "/") {
  return new URL(path, site.url).toString();
}

type PageMeta = {
  /** The page's search copy, from src/data/seo.ts. */
  seo: Pick<PageSeo, "title" | "description">;
  path: string;
  /** Keep the page out of search results but let crawlers follow its links. */
  noindex?: boolean;
  type?: "website" | "profile" | "article";
  /** Article-only Open Graph fields. */
  article?: { publishedTime?: string; authors?: string[] };
};

/**
 * Everything a public page puts in its <head> for search and sharing.
 *
 * The title is used exactly as written (`absolute`): the copy in
 * src/data/seo.ts is already complete and length-checked, and letting the
 * layout's template append the brand again would push it past what Google
 * displays.
 *
 * Open Graph and Twitter blocks are rebuilt in full on every page because
 * Next.js merges metadata shallowly — a page that sets `openGraph` replaces
 * the layout's whole block. The share image itself comes from the
 * `opengraph-image` file in each route folder, which Next.js adds on top.
 */
export function buildMetadata({ seo, path, noindex = false, type = "website", article }: PageMeta): Metadata {
  const { title, description } = seo;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      siteName: site.name,
      locale: site.locale,
      ...(type === "profile"
        ? { type: "profile", firstName: "Amrit Pal", lastName: "Singh" }
        : type === "article"
          ? { type: "article", ...article }
          : { type: "website" }),
    },
    twitter: { card: "summary_large_image", title, description },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}
