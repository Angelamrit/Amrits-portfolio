import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/auth";
import { store } from "@/lib/store";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  title: { template: "%s · Studio", default: "Studio" },
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Everything behind the password.
 *
 * `/admin/login` deliberately sits outside this group: it is the one route
 * under `/admin` that an anonymous visitor must be able to reach, and putting
 * it inside a layout whose first line redirects anonymous visitors to it would
 * be a loop.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <AdminShell>
      {/* On every screen, not just Visitors: when saving cannot work (Vercel
          without its cloud storage) or will not last, the chef should learn
          it before typing out a menu, not after pressing Save. */}
      {store.warning && (
        <p
          role="alert"
          className="mb-6 flex items-start gap-3 rounded-xl border border-[#e59a93]/30 bg-[#e59a93]/[0.07] px-4 py-3.5 text-[0.82rem] leading-relaxed text-[#e59a93]"
        >
          <span aria-hidden className="mt-0.5 shrink-0">
            ⚠
          </span>
          {store.warning}
        </p>
      )}
      {children}
    </AdminShell>
  );
}
