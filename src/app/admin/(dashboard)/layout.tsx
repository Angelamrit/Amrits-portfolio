import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { countNewBookings } from "@/lib/bookings/bookings";

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
  // The badge beside Bookings: how many enquiries nobody has answered yet.
  // A storage hiccup must not take the whole dashboard down, so it falls back
  // to no badge rather than an error.
  const newBookings = await countNewBookings().catch(() => 0);
  return <AdminShell newBookings={newBookings}>{children}</AdminShell>;
}
