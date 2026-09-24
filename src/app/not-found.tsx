import type { Metadata } from "next";
import { site } from "@/data/site";
import { SiteShell } from "@/components/layout/SiteShell";
import { NotFoundContent } from "@/components/layout/NotFoundContent";

export const metadata: Metadata = {
  title: { absolute: `Page Not Found | ${site.name}` },
  robots: { index: false, follow: true },
};

/**
 * The 404 for a visit to any address that does not exist. Next.js serves this
 * root file for those requests, outside the `(site)` group, so it brings the
 * site's header and footer itself — otherwise a mistyped address would land on
 * a page with no way back into the site.
 *
 * Its sibling `(site)/not-found.tsx` covers not-found inside the group (for
 * example during client-side navigation) and is deliberately just the message:
 * Next.js embeds each layout's not-found tree in every page's payload, and
 * letting the group inherit this one put a second full copy of the header and
 * footer into every page.
 */
export default function NotFound() {
  return (
    <SiteShell>
      <NotFoundContent />
    </SiteShell>
  );
}
