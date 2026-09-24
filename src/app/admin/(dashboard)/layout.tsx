import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/auth";
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
  return <AdminShell>{children}</AdminShell>;
}
