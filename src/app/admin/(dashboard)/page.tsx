import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  ChefHat,
  Clock,
  ImagePlus,
  Images,
  Store,
  type LucideIcon,
} from "lucide-react";
import { SITE_TIME_ZONE, getOverview } from "@/lib/analytics/aggregate";
import { pageName } from "@/lib/analytics/page-names";
import { getDishesForAdmin } from "@/lib/content/dishes";
import { getGalleryForAdmin } from "@/lib/content/gallery";
import { getVenue, venueIsEdited } from "@/lib/content/venue";
import { BarList } from "@/components/admin/BarList";
import { LivePulse } from "@/components/admin/LivePulse";
import { Panel } from "@/components/admin/Panel";
import { StatTile } from "@/components/admin/StatTile";
import { change, compact } from "@/components/admin/format";

// The layout's "%s · Studio" template applies to the pages below it, not to
// the page that shares its segment, so this one spells its title out.
export const metadata: Metadata = { title: { absolute: "Home · Studio" } };

/**
 * The first screen after signing in, and the answer to "what do I need to do?"
 * and "how is the website doing?".
 *
 * The chef opens this between services with a minute to spare, so it leads
 * with the jobs he actually comes here to do as single taps, then the week in
 * three numbers, then the state of each part of the website — what he has
 * changed and what is hidden — so nothing he did last month is a surprise.
 * The full visitor picture is one click away.
 */

function greeting(now: number): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: SITE_TIME_ZONE }).format(now),
  );
  if (hour < 5) return "Good evening";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const shortcuts = [
  { href: "/admin/dishes", label: "Edit dishes", sub: "Signature plates", icon: ChefHat },
  { href: "/admin/restaurant", label: "Opening hours", sub: "Address, phone, links", icon: Clock },
  { href: "/admin/gallery", label: "Add photos", sub: "Upload and caption", icon: ImagePlus },
  { href: "/admin/visitors", label: "View analytics", sub: "Visitors & traffic", icon: Store },
];

const plural = (count: number, one: string, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;

/** A small pill on a status row: gold for "you changed this", quiet otherwise. */
function Pill({ children, tone = "quiet" }: { children: React.ReactNode; tone?: "edited" | "quiet" | "warn" }) {
  return (
    <span
      className={
        tone === "edited"
          ? "rounded-pill border border-[#7fc39b]/35 bg-[#7fc39b]/10 px-2.5 py-0.5 text-[0.6rem] uppercase tracking-[0.14em] text-[#7fc39b]"
          : tone === "warn"
            ? "rounded-pill border border-gold/35 bg-gold/10 px-2.5 py-0.5 text-[0.6rem] uppercase tracking-[0.14em] text-gold-light"
            : "rounded-pill border border-fg/12 px-2.5 py-0.5 text-[0.6rem] uppercase tracking-[0.14em] text-fg/45"
      }
    >
      {children}
    </span>
  );
}

function StatusRow({
  href,
  icon: Icon,
  title,
  detail,
  pills,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  detail: string;
  pills: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="group flex items-center gap-4 rounded-xl px-3 py-3.5 transition-colors duration-300 hover:bg-fg/[0.04] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-full border border-gold/25 bg-gold/10 text-gold transition-shadow duration-500 group-hover:shadow-glow">
          <Icon aria-hidden className="size-[1.05rem]" strokeWidth={1.6} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[0.9rem] font-medium text-fg">{title}</span>
          <span className="mt-0.5 block truncate text-[0.74rem] text-fg/50">{detail}</span>
          {/* Beside the row where there is room, under it on a phone. */}
          <span className="mt-2 flex flex-wrap gap-1.5 sm:hidden">{pills}</span>
        </span>
        <span className="hidden shrink-0 flex-wrap justify-end gap-1.5 sm:flex">{pills}</span>
        <ArrowUpRight
          aria-hidden
          className="size-4 shrink-0 text-fg/30 transition-colors duration-300 group-hover:text-gold-light"
          strokeWidth={1.6}
        />
      </Link>
    </li>
  );
}

export default async function HomePage() {
  const [day, week, dishes, gallery, venue, venueEdited] = await Promise.all([
    getOverview("24h"),
    getOverview("7d"),
    getDishesForAdmin(),
    getGalleryForAdmin(),
    getVenue(),
    venueIsEdited(),
  ]);

  const now = week.to;
  const dateLine = new Date(now).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: SITE_TIME_ZONE,
  });

  const photos = gallery.items;
  const hiddenPhotos = photos.filter((item) => item.hidden).length;
  const yourPhotos = photos.filter((item) => item.uploaded).length;
  const liveDishes = dishes.filter((dish) => !dish.hidden);
  const signatures = liveDishes.filter((dish) => dish.signature).length;
  const changedDishes = dishes.filter((dish) => dish.edited || dish.added).length;
  const hiddenDishes = dishes.length - liveDishes.length;
  const comparedTo = week.previous ? "vs the week before" : undefined;
  const quietWeek = week.totals.views === 0 ? "Nothing recorded yet" : "Nothing the week before to compare";

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow text-gold/75">{dateLine}</p>
          <h1 className="mt-3 font-display text-display-md font-light leading-none text-fg">
            {greeting(now)}, <em className="font-normal italic text-gold-gradient">Chef</em>
          </h1>
        </div>
        {/* Refreshes the whole screen every minute while it is open. */}
        <LivePulse count={week.liveVisitors} />
      </header>

      {/* ---- the jobs, one tap each ---- */}
      <section aria-labelledby="shortcuts">
        <h2 id="shortcuts" className="eyebrow mb-3 text-fg/40">
          Quick actions
        </h2>
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {shortcuts.map(({ href, label, sub, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className="glass border-gradient spotlight group flex h-full flex-col gap-3 rounded-frame p-4 transition-shadow duration-500 hover:shadow-glow focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold sm:p-5"
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

      {/* ---- the week, in three numbers ---- */}
      <section aria-labelledby="this-week" className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-4">
          <h2 id="this-week" className="eyebrow text-fg/40">
            This week on the website
          </h2>
          <Link
            href="/admin/visitors?range=7d"
            className="inline-flex items-center gap-1.5 text-[0.68rem] uppercase tracking-[0.16em] text-gold-light/70 transition-colors duration-300 hover:text-gold-light"
          >
            All visitor numbers <ArrowRight aria-hidden className="size-3.5" strokeWidth={1.8} />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            featured
            label="Visitors"
            value={compact(week.totals.visitors)}
            comparedTo={comparedTo}
            change={change(week.totals.visitors, week.previous?.visitors)}
            hint={quietWeek}
            spark={week.series.map((point) => point.visitors)}
            className="sm:col-span-2"
          />
          <StatTile
            label="Pages read"
            value={compact(week.totals.views)}
            comparedTo={comparedTo}
            change={change(week.totals.views, week.previous?.views)}
            hint={quietWeek}
          />
          <StatTile
            label="Last 24 hours"
            value={compact(day.totals.visitors)}
            comparedTo={day.previous ? "vs the day before" : undefined}
            change={change(day.totals.visitors, day.previous?.visitors)}
            hint={day.totals.views === 0 ? "No visitors yet today" : "Nothing the day before to compare"}
          />
        </div>
      </section>

      {/* ---- what they read, and the state of the website ---- */}
      <div className="grid gap-4 xl:grid-cols-5">
        <Panel title="Most read this week" hint="The pages guests opened most." className="xl:col-span-2">
          <BarList
            rows={week.topPages.slice(0, 5).map((row) => ({
              label: row.label,
              display: pageName(row.label),
              value: row.views,
              secondary: row.visitors,
            }))}
            emptyMessage="No pages opened this week yet."
          />
        </Panel>

        <Panel title="Your website" hint="What is live, and what you have changed." className="xl:col-span-3" bodyClassName="pt-2">
          <ul className="flex flex-col divide-y divide-fg/[0.06]">
            <StatusRow
              href="/admin/dishes"
              icon={ChefHat}
              title="Dishes"
              detail={`${plural(liveDishes.length, "dish", "dishes")} on the website · ${signatures} signature`}
              pills={
                <>
                  {changedDishes > 0 && <Pill tone="edited">{changedDishes} changed</Pill>}
                  {hiddenDishes > 0 ? <Pill tone="warn">{hiddenDishes} hidden</Pill> : changedDishes === 0 && <Pill>As published</Pill>}
                </>
              }
            />
            <StatusRow
              href="/admin/gallery"
              icon={Images}
              title="Photos"
              detail={`${plural(photos.length - hiddenPhotos, "photograph")} on the website`}
              pills={
                <>
                  {yourPhotos > 0 && <Pill tone="edited">{yourPhotos} yours</Pill>}
                  {hiddenPhotos > 0 ? <Pill tone="warn">{hiddenPhotos} hidden</Pill> : yourPhotos === 0 && <Pill>As published</Pill>}
                </>
              }
            />
            <StatusRow
              href="/admin/restaurant"
              icon={Store}
              title="Restaurant details"
              detail={[venue.hours, venue.phone].filter(Boolean).join(" · ") || venue.name}
              pills={venueEdited ? <Pill tone="edited">Edited</Pill> : <Pill>As published</Pill>}
            />
          </ul>
        </Panel>
      </div>
    </div>
  );
}
