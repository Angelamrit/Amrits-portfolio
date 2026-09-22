import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Download, Globe, Inbox, Phone, Plus, Users } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  BOOKING_STATUSES,
  listBookings,
  summarise,
  todayInNewYork,
  type BookingStatus,
} from "@/lib/bookings/bookings";
import { experienceLabels } from "@/lib/validation/inquiry";
import { PageHeading } from "@/components/admin/PageHeading";
import { BookingSearch } from "@/components/admin/bookings/BookingSearch";
import { StatusPill, daysUntil, formatEventDate, statusLabel } from "@/components/admin/bookings/status";
import { relativeTime } from "@/components/admin/format";

export const metadata: Metadata = { title: "Bookings" };

/**
 * Every enquiry, newest first, with what needs the chef's attention on top.
 *
 * The tabs and the search both live in the URL, so "the confirmed ones" or
 * "everything from Priya" can be bookmarked or opened in a second tab, and
 * the back button behaves.
 */
export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status: requested, q } = await searchParams;
  const filter = BOOKING_STATUSES.includes(requested as BookingStatus) ? (requested as BookingStatus) : null;
  const query = (q ?? "").trim().toLowerCase().slice(0, 100);

  const all = await listBookings();
  const today = todayInNewYork();
  const summary = summarise(all);

  const matching = all.filter((booking) => {
    if (filter && booking.status !== filter) return false;
    if (!query) return true;
    return [booking.name, booking.email, booking.phone, booking.ref, booking.location]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(query));
  });

  const tabHref = (status: BookingStatus | null) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (query) params.set("q", query);
    const qs = params.toString();
    return qs ? `/admin/bookings?${qs}` : "/admin/bookings";
  };

  const tiles = [
    { label: "Waiting for your reply", value: summary.awaitingReply, icon: Inbox, href: tabHref("new"), highlight: summary.awaitingReply > 0 },
    { label: "Confirmed and coming up", value: summary.upcomingConfirmed, icon: CalendarDays, href: tabHref("confirmed") },
    { label: "Guests to cook for", value: summary.guestsConfirmedUpcoming, icon: Users },
    { label: "Enquiries this month", value: summary.receivedThisMonth, icon: Globe },
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeading
        eyebrow="Guests"
        title="Bookings"
        description="Every enquiry from the website's booking form, plus any you add by hand."
      >
        {/* A plain link on purpose: this is a file download from a route
            handler, and `<Link>` would prefetch it and try to render it as a
            page. */}
        <a
          href="/admin/bookings/export"
          download
          className="glass inline-flex shrink-0 items-center gap-2 rounded-pill px-4 py-2.5 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-fg/70 transition-colors duration-300 hover:text-gold-light"
        >
          <Download aria-hidden className="size-3.5" strokeWidth={1.8} />
          Download list
        </a>
        <Link
          href="/admin/bookings/new"
          className="btn-primary inline-flex shrink-0 items-center gap-2 rounded-pill px-5 py-2.5 font-sans text-[0.68rem] font-semibold uppercase tracking-[0.16em]"
        >
          <Plus aria-hidden className="size-3.5" strokeWidth={2} />
          Add a booking
        </Link>
      </PageHeading>

      {/* ---- what needs doing ---- */}
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map(({ label, value, icon: Icon, href, highlight }) => {
          const body = (
            <>
              <span
                className={cn(
                  "grid size-10 shrink-0 place-items-center rounded-full border",
                  highlight ? "border-gold/50 bg-gold/15 text-gold-light" : "border-fg/12 bg-fg/[0.04] text-fg/45",
                )}
              >
                <Icon aria-hidden className="size-4" strokeWidth={1.6} />
              </span>
              <span className="min-w-0">
                <span className="block font-sans text-[1.8rem] font-semibold leading-none text-fg">{value}</span>
                <span className="mt-1.5 block text-[0.76rem] text-fg/50">{label}</span>
              </span>
            </>
          );
          const shell = cn(
            "glass border-gradient flex items-center gap-4 rounded-frame p-5 transition-shadow duration-500",
            highlight && "shadow-glow",
          );
          return (
            <li key={label}>
              {href ? (
                <Link href={href} className={cn(shell, "hover:shadow-glow")}>
                  {body}
                </Link>
              ) : (
                <div className={shell}>{body}</div>
              )}
            </li>
          );
        })}
      </ul>

      {/* ---- filters ---- */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <nav aria-label="Filter by status" className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {[null, ...BOOKING_STATUSES].map((status) => {
            const selected = status === filter;
            const count = status ? summary.byStatus[status] : all.length;
            return (
              <Link
                key={status ?? "all"}
                href={tabHref(status)}
                scroll={false}
                aria-current={selected ? "page" : undefined}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-pill border px-3.5 py-2 text-[0.72rem] transition-all duration-300",
                  selected
                    ? "border-gold/50 bg-gold/15 text-gold-light"
                    : "border-fg/12 text-fg/50 hover:border-fg/25 hover:text-fg/80",
                )}
              >
                {status ? statusLabel[status] : "All"}
                <span className={cn("tnum text-[0.66rem]", selected ? "text-gold-light/80" : "text-fg/30")}>{count}</span>
              </Link>
            );
          })}
        </nav>
        <BookingSearch initial={q ?? ""} />
      </div>

      {/* ---- the list ---- */}
      {all.length === 0 ? (
        <div className="glass border-gradient flex flex-col items-center gap-4 rounded-frame px-6 py-16 text-center">
          <span className="grid size-12 place-items-center rounded-full border border-gold/25 bg-gold/10">
            <Inbox aria-hidden className="size-5 text-gold" strokeWidth={1.5} />
          </span>
          <p className="font-display text-[1.5rem] text-fg">No bookings yet</p>
          <p className="max-w-sm text-[0.85rem] text-fg/50">
            Enquiries from the website appear here the moment they are sent. Took one by phone? Add it yourself.
          </p>
          <Link
            href="/admin/bookings/new"
            className="btn-primary mt-2 inline-flex items-center gap-2 rounded-pill px-5 py-2.5 font-sans text-[0.68rem] font-semibold uppercase tracking-[0.16em]"
          >
            <Plus aria-hidden className="size-3.5" strokeWidth={2} />
            Add a booking
          </Link>
        </div>
      ) : matching.length === 0 ? (
        <p className="glass rounded-frame px-6 py-12 text-center text-[0.88rem] text-fg/50">
          Nothing matches{query ? ` “${q}”` : ""}{filter ? ` in ${statusLabel[filter]}` : ""}.{" "}
          <Link href="/admin/bookings" className="text-gold-light underline-offset-4 hover:underline">
            Show everything
          </Link>
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {matching.map((booking) => {
            const until = daysUntil(booking.eventDate, today);
            const past = booking.eventDate ? booking.eventDate < today : false;
            return (
              <li key={booking.id}>
                <Link
                  href={`/admin/bookings/${booking.id}`}
                  className={cn(
                    "glass group grid gap-3 rounded-frame px-5 py-4 transition-all duration-500 ease-luxe hover:border-gold/45 hover:shadow-glow sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] sm:items-center sm:gap-6",
                    booking.status === "new" && "border-gold/40",
                  )}
                >
                  {/* who */}
                  <span className="flex min-w-0 items-center gap-3.5">
                    <span
                      aria-hidden
                      className="grid size-10 shrink-0 place-items-center rounded-full border border-gold/25 bg-gold/10 font-display text-[1.05rem] text-gold-light"
                    >
                      {booking.name.trim().charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-[0.98rem] font-medium text-fg">{booking.name}</span>
                        {booking.status === "new" && (
                          <span className="live-dot shrink-0" aria-label="New" />
                        )}
                      </span>
                      <span className="mt-0.5 flex items-center gap-2 text-[0.72rem] text-fg/40">
                        <span className="tnum">{booking.ref}</span>
                        <span aria-hidden>·</span>
                        {booking.source === "manual" ? (
                          <span className="inline-flex items-center gap-1">
                            <Phone aria-hidden className="size-3" strokeWidth={1.8} /> Added by hand
                          </span>
                        ) : (
                          <span>Received {relativeTime(booking.createdAt)}</span>
                        )}
                      </span>
                    </span>
                  </span>

                  {/* what and when */}
                  <span className="min-w-0 text-[0.82rem]">
                    <span className="block truncate text-fg/80">{experienceLabels[booking.experience]}</span>
                    <span className={cn("mt-0.5 block truncate", past ? "text-fg/35" : "text-fg/55")}>
                      {formatEventDate(booking.eventDate)}
                      {until && <span className="text-fg/35"> · {until}</span>}
                      <span className="text-fg/35"> · {booking.guests} {booking.guests === 1 ? "guest" : "guests"}</span>
                    </span>
                  </span>

                  <StatusPill status={booking.status} className="justify-self-start sm:justify-self-end" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
