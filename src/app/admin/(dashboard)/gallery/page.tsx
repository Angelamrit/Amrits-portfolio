import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { galleryCategories, getGalleryForAdmin } from "@/lib/content/gallery";
import { GalleryManager } from "@/components/admin/GalleryManager";
import { PageHeading } from "@/components/admin/PageHeading";

export const metadata: Metadata = { title: "Gallery" };

export default async function AdminGalleryPage() {
  const { items } = await getGalleryForAdmin();
  const live = items.filter((item) => !item.hidden).length;
  const yours = items.filter((item) => item.uploaded).length;

  return (
    <div className="flex flex-col gap-8">
      <PageHeading
        eyebrow="Content"
        title="Gallery"
        description={`${live} photographs on the site${yours > 0 ? `, ${yours} of them uploaded here` : ""}. Add your own, write the captions, and choose what is shown.`}
      >
        <Link
          href="/gallery"
          target="_blank"
          rel="noreferrer"
          className="glass inline-flex shrink-0 items-center gap-2 rounded-pill px-4 py-2.5 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-fg/70 transition-colors duration-300 hover:text-gold-light"
        >
          <ExternalLink aria-hidden className="size-3.5" strokeWidth={1.8} />
          See it on the site
        </Link>
      </PageHeading>

      <GalleryManager items={items} categories={galleryCategories} />
    </div>
  );
}
