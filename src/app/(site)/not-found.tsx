import type { Metadata } from "next";
import { site } from "@/data/site";
import { NotFoundContent } from "@/components/layout/NotFoundContent";

export const metadata: Metadata = {
  title: { absolute: `Page Not Found | ${site.name}` },
  robots: { index: false, follow: true },
};

/**
 * Not-found inside the `(site)` group (for example a client-side navigation to
 * a missing article): the group layout already supplies the header and
 * footer, so this is just the message.
 *
 * It exists for size as much as behaviour. Next.js embeds each layout's
 * not-found tree in every page's payload; without this file the group would
 * inherit the root 404, which carries the full site shell, and every page
 * would ship an extra copy of the header and footer.
 */
export default function NotFound() {
  return <NotFoundContent />;
}
