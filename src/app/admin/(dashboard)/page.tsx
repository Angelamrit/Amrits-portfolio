import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CalendarCheck,
  CalendarPlus,
  CircleCheck,
  Clock,
  ImagePlus,
  Inbox,
  UtensilsCrossed,
} from "lucide-react";
import { getOverview } from "@/lib/analytics/aggregate";
import { listBookings, summarise, todayInNewYork } from "@/lib/bookings/bookings";
import { experienceLabels } from "@/lib/validation/inquiry";
import { Panel } from "@/components/admin/Panel";
import { daysUntil, formatEventDate } from "@/components/admin/bookings/status";
import { compact, relativeTime } from "@/components/admin/format";

export const metadata: Metadata = { title: "Home" };

/**
 * The first screen after signing in, and the answer to "what do I need to do?"
 *
 * Deliberately not a wall of charts. The chef opens this between services with
 * a minute to spare, so it leads with the only things that need him — guests
 * waiting for a reply and events coming up — then offers the handful of jobs
 * he actually comes here to do as single taps. The visitor numbers are a
 * glance at the bottom, with the full picture one click away.
 */

function greeting(now: number): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: "America/New_York" }).format(now),
  );
  if (hour < 5) return "Good evening";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const shortcuts = [
  { href: "/admin/bookings/new", label: "Add a booking", sub: "Taken by phone", icon: CalendarPlus },
  { href: "/admin/bookings", label: "All bookings", sub: "Reply, confirm, add notes", icon: CalendarCheck },
  { href: "/admin/menus", label: "Edit a menu", sub: "Courses and wording", icon: UtensilsCrossed },
  { href: "/admin/restaurant", label: "Opening hours", sub: "Address, phone, links", icon: Clock },
  { href: "/admin/gallery", label: "Add photos", sub: "Upload and caption", icon: ImagePlus },
  { href: "/admin/visitors", label: "Visitors", sub: "Who is on the site", icon: BarChart3 },
];

export default async function HomePage() {
  const [bookings, day, week] = await Promise.all([listBookings(), getOverview("24h"), getOverview("7d")]);

  const now = week.to;
  const today = todayInNewYork(now);
  const summary = summarise(bookings, now);

  const waiting = bookings.filter((booking) => booking.status === "new").slice(0, 5);
  const upcoming = bookings
    .filter((booking) => booking.status === "confirmed" && booking.eventDate && booking.eventDate >= today)
    .sort((a, b) => (a.eventDate ?? "").localeCompare(b.eventDate ?? ""))
    .slice(0, 4);

  const dateLine = new Date(now).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/New_York",
  });

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="eyebrow text-gold/75">{dateLine}</p>
        <h1 className="mt-3 font-display text-display-md font-light leading-none text-fg">
          {greeting(now)}, <em className="font-normal italic text-gold-gradient">Chef</em>
        </h1>
        <p className="mt-3 text-[0.92rem] text-fg/65">
          {summary.awaitingReply === 0
            ? "Every enquiry has been answered."
            : `${summary.awaitingReply} ${summary.awaitingReply === 1 ? "guest is" : "guests are"} waiting for your reply.`}
        </p>
      </header>

      <div className="grid gap-4 xl:grid-cols-5">
        {/* ---- needs a reply ---- */}
        <Panel
          title="Waiting for your reply"
          className="xl:col-span-3"
          action={
            summary.awaitingReply > 0 ? (
              <Link
                href="/admin/bookings?status=new"
                className="inline-flex shrink-0 items-center gap-1.5 text-[0.7rem] uppercase tracking-[0.16em] text-gold-light/80 transition-colors hover:text-gold-light"
              >
                See all <ArrowRight aria-hidden className="size-3.5" strokeWidth={1.8} />
              </Link>
            ) : undefined
          }
        >
          {waiting.length === 0 ? (
            <div className="flex items-center gap-4 rounded-xl border border-[#7fc39b]/25 bg-[#7fc39b]/[0.06] px-5 py-5">
              <CircleCheck aria-hidden className="size-6 shrink-0 text-[#7fc39b]" strokeWidth={1.5} />
              <p className="text-[0.9rem] text-fg/75">All caught up. New enquiries from the website appear here.</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {waiting.map((booking) => (
                <li key={booking.id}>
                  <Link
                    href={`/admin/bookings/${booking.id}`}
                    className="group flex items-center gap-4 rounded-xl border border-gold/25 bg-gold/[0.05] px-4 py-3.5 transition-all duration-300 hover:border-gold/50 hover:bg-gold/[0.09]"
                  >
                    <span
                      aria-hidden
                      className="grid size-10 shrink-0 place-items-center rounded-full border border-gold/30 bg-gold/10 font-display text-[1.05rem] text-gold-light"
                    >
                      {booking.name.trim().charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[0.95rem] font-medium text-fg">{booking.name}</span>
                      <span className="block truncate text-[0.76rem] text-fg/50">
                        {experienceLabels[booking.experience]} · {booking.guests} guests ·{" "}
                        {formatEventDate(booking.eventDate)}
                      </span>
                    </span>
                    <span className="hidden shrink-0 text-[0.72rem] text-fg/40 sm:block">
                      {relativeTime(booking.createdAt, now)}
                    </span>
                    <ArrowRight
                      aria-hidden
                      className="size-4 shrink-0 text-gold/50 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-gold"
                      strokeWidth={1.8}
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* ---- coming up ---- */}
        <Panel title="Coming up" className="xl:col-span-2">
          {upcoming.length === 0 ? (
            <div className="flex items-center gap-4 rounded-xl border border-dashed border-fg/12 px-5 py-5">
              <Inbox aria-hidden className="size-6 shrink-0 text-fg/30" strokeWidth={1.5} />
              <p className="text-[0.88rem] text-fg/50">No confirmed events yet.</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {upcoming.map((booking) => {
                const date = new Date(`${booking.eventDate}T00:00:00Z`);
                return (
                  <li key={booking.id}>
                    <Link
                      href={`/admin/bookings/${booking.id}`}
                      className="flex items-center gap-4 rounded-xl border border-fg/10 bg-fg/[0.03] px-4 py-3 transition-colors duration-300 hover:border-[#7fc39b]/40"
                    >
                      <span className="flex w-12 shrink-0 flex-col items-center rounded-lg border border-[#7fc39b]/30 bg-[#7fc39b]/[0.08] py-1.5">
                        <span className="text-[0.58rem] uppercase tracking-[0.14em] text-[#9fd8b6]">
                          {date.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" })}
                        </span>
                        <span className="font-sans text-[1.15rem] font-semibold leading-none text-fg">
                          {date.getUTCDate()}
                        </span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[0.9rem] text-fg">{booking.name}</span>
                        <span className="block truncate text-[0.74rem] text-fg/45">
                          {booking.guests} guests · {daysUntil(booking.eventDate, today)}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      {/* ---- the jobs, one tap each ---- */}
      <section aria-labelledby="shortcuts">
        <h2 id="shortcuts" className="eyebrow mb-3 text-fg/40">
          Quick actions
        </h2>
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {shortcuts.map(({ href, label, sub, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className="glass border-gradient spotlight group flex h-full flex-col gap-3 rounded-frame p-4 transition-shadow duration-500 hover:shadow-glow sm:p-5"
              >
                <span className="grid size-10 place-items-center rounded-full border border-gold/25 bg-gold/10 text-gold transition-colors duration-300 group-hover:bg-gold/20">
                  <Icon aria-hidden className="size-[1.1rem]" strokeWidth={1.6} />
                </span>
                <span>
                  <span className="block text-[0.9rem] font-medium text-fg">{label}</span>
                  <span className="mt-0.5 block text-[0.72rem] text-fg/45">{sub}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ---- a glance at visitors ---- */}
      <Link
        href="/admin/visitors"
        className="glass border-gradient group grid grid-cols-2 gap-5 rounded-frame p-6 transition-shadow duration-500 hover:shadow-glow sm:grid-cols-4"
      >
        {[
          { label: "Reading now", value: String(week.liveVisitors) },
          { label: "Visitors today", value: compact(day.totals.visitors) },
          { label: "Visitors this week", value: compact(week.totals.visitors) },
          { label: "Pages read this week", value: compact(week.totals.views) },
        ].map(({ label, value }) => (
          <span key={label} className="flex flex-col gap-1.5">
            <span className="font-sans text-[1.7rem] font-semibold leading-none text-fg">{value}</span>
            <span className="text-[0.74rem] text-fg/50">{label}</span>
          </span>
        ))}
        <span className="col-span-2 flex items-center gap-1.5 text-[0.7rem] uppercase tracking-[0.16em] text-gold-light/70 transition-colors group-hover:text-gold-light sm:col-span-4">
          See all visitor numbers <ArrowRight aria-hidden className="size-3.5" strokeWidth={1.8} />
        </span>
      </Link>
    </div>
  );
}
