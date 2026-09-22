import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { flatten, getVenue, venueIsEdited } from "@/lib/content/venue";
import { PageHeading } from "@/components/admin/PageHeading";
import { VenueEditor } from "@/components/admin/VenueEditor";

export const metadata: Metadata = { title: "Restaurant details" };

export default async function AdminRestaurantPage() {
  const [venue, edited] = await Promise.all([getVenue(), venueIsEdited()]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeading
        eyebrow="Your website"
        title="Restaurant details"
        description="Address, hours and the links guests use to book. These appear across the whole site."
      >
        <Link
          href="/angel"
          target="_blank"
          rel="noreferrer"
          className="glass inline-flex shrink-0 items-center gap-2 rounded-pill px-4 py-2.5 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-fg/70 transition-colors duration-300 hover:text-gold-light"
        >
          <ExternalLink aria-hidden className="size-3.5" strokeWidth={1.8} />
          See it on the site
        </Link>
      </PageHeading>

      <VenueEditor initial={flatten(venue)} isEdited={edited} />
    </div>
  );
}
