import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  ChefHat,
  Clock,
  ImagePlus,
  UtensilsCrossed,
} from "lucide-react";
import { getOverview } from "@/lib/analytics/aggregate";
import { compact } from "@/components/admin/format";

export const metadata: Metadata = { title: "Home" };

/**
 * The first screen after signing in, and the answer to "what do I need to do?"
 *
 * Deliberately not a wall of charts. The chef opens this between services with
 * a minute to spare, so it leads with the handful of jobs he actually comes
 * here to do as single taps. The visitor numbers are a glance underneath, with
 * the full picture one click away.
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
  { href: "/admin/menus", label: "Edit a menu", sub: "Courses and wording", icon: UtensilsCrossed },
  { href: "/admin/dishes", label: "Edit dishes", sub: "Signature plates", icon: ChefHat },
  { href: "/admin/restaurant", label: "Opening hours", sub: "Address, phone, links", icon: Clock },
  { href: "/admin/gallery", label: "Add photos", sub: "Upload and caption", icon: ImagePlus },
  { href: "/admin/visitors", label: "Visitors", sub: "Who is on the site", icon: BarChart3 },
];

export default async function HomePage() {
  const [day, week] = await Promise.all([getOverview("24h"), getOverview("7d")]);

  const now = week.to;

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
          {week.liveVisitors > 0
            ? `${week.liveVisitors} ${week.liveVisitors === 1 ? "person is" : "people are"} reading the website right now.`
            : "Everything on the website is up to date."}
        </p>
      </header>

      {/* ---- the jobs, one tap each ---- */}
      <section aria-labelledby="shortcuts">
        <h2 id="shortcuts" className="eyebrow mb-3 text-fg/40">
          Quick actions
        </h2>
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
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
