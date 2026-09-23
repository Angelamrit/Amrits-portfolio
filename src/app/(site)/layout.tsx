import { SiteShell } from "@/components/layout/SiteShell";

/**
 * The public site. Every guest-facing route lives in this group so that the
 * navigation, footer and sticky CTA are applied here rather than in the root
 * layout — which is what keeps them off `/admin`.
 *
 * The group name is in parentheses, so it contributes nothing to any URL:
 * `(site)/menus/page.tsx` is still `/menus`.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
