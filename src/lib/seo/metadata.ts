import type { Metadata } from "next";
import { site } from "@/data/site";

export function siteUrl(path = "/") {
  return new URL(path, site.url).toString();
}

type PageMeta = {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
};

export function buildMetadata({ title, description, path = "/", image }: PageMeta = {}): Metadata {
  const desc = description ?? site.description;
  return {
    title: title ?? { absolute: `${site.name} — Owner & Head Chef, Angel Indian Restaurant` },
    description: desc,
    alternates: { canonical: path },
    openGraph: {
      title: title ? `${title} | ${site.name}` : site.name,
      description: desc,
      url: path,
      siteName: site.name,
      locale: site.locale,
      type: "website",
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: title ? `${title} | ${site.name}` : site.name,
      description: desc,
    },
  };
}
