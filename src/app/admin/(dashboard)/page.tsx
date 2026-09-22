import type { Metadata } from "next";
import { Database, Eye, HardDriveDownload, ShieldCheck } from "lucide-react";
import { getOverview, rangeFromKey } from "@/lib/analytics/aggregate";
import { credentialKind } from "@/lib/admin/config";
import { store } from "@/lib/store";
import { BarList, ShareBars } from "@/components/admin/BarList";
import { HourStrip } from "@/components/admin/HourStrip";
import { LiveFeed } from "@/components/admin/LiveFeed";
import { LivePulse } from "@/components/admin/LivePulse";
import { PageHeading } from "@/components/admin/PageHeading";
import { Panel } from "@/components/admin/Panel";
import { RangeTabs } from "@/components/admin/RangeTabs";
import { StatTile } from "@/components/admin/StatTile";
import { TrafficChart } from "@/components/admin/TrafficChart";
import { change, compact, countryName, duration, percent } from "@/components/admin/format";

export const metadata: Metadata = { title: "Overview" };

/**
 * What the chef opens first: how many people came to the site, where they came
 * from and what they read.
 *
 * Every figure on this page is computed from the site's own visit log. There
 * is no third-party analytics script anywhere on this site, which is why the
 * public pages carry no consent banner — nothing that identifies a visitor is
 * ever collected, and the log holds no cookie, no IP address and no name.
 */
export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range: requested } = await searchParams;
  const range = rangeFromKey(requested);
  const data = await getOverview(range.key);
  // The instant the roll-up was taken, rather than a second reading of the
  // clock: the live feed's relative times must agree with the range that was
  // actually measured, and a render is not the place to read a clock.
  const now = data.to;

  const { totals, previous } = data;
  const comparedTo = previous ? `vs previous ${range.label}` : undefined;
  const spark = data.series.slice(-12).map((point) => point.views);

  const hasVisits = totals.views > 0;

  return (
    <div className="flex flex-col gap-8">
      <PageHeading
        eyebrow="Dashboard"
        title="Overview"
        description={`Who visited chefamritpalsingh.com in the last ${range.label}, and what they looked at.`}
      >
        <LivePulse count={data.liveVisitors} />
        <RangeTabs active={range.key} />
      </PageHeading>

      {/* ---- The headline figures ------------------------------------- */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          featured
          label="Visitors"
          value={compact(totals.visitors)}
          comparedTo={comparedTo}
          change={change(totals.visitors, previous?.visitors)}
          hint={hasVisits ? "First period on record" : "Nothing recorded yet"}
          spark={spark}
          className="sm:col-span-2"
        />
        <StatTile
          label="Page views"
          value={compact(totals.views)}
          comparedTo={comparedTo}
          change={change(totals.views, previous?.views)}
          hint={hasVisits ? "First period on record" : "Nothing recorded yet"}
        />
        <StatTile
          label="Visits"
          value={compact(totals.sessions)}
          comparedTo={comparedTo}
          change={change(totals.sessions, previous?.sessions)}
          hint={hasVisits ? "First period on record" : "Nothing recorded yet"}
        />
      </div>

      {/* ---- Traffic over time, with the engagement read beside it ----- */}
      <div className="grid gap-4 xl:grid-cols-4">
        <Panel
          title="Traffic"
          hint={`Page views and visitors across the last ${range.label}.`}
          className="xl:col-span-3"
        >
          <TrafficChart points={data.series} rangeLabel={range.label} />
        </Panel>

        <Panel title="How they read" hint="Depth and length of a typical visit.">
          <dl className="flex flex-col divide-y divide-fg/8">
            <div className="flex items-baseline justify-between gap-4 pb-4">
              <dt className="text-[0.82rem] text-fg/55">Pages per visit</dt>
              <dd className="font-sans text-[1.3rem] font-semibold tnum text-fg">
                {totals.viewsPerSession.toFixed(1)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 py-4">
              <dt className="text-[0.82rem] text-fg/55">Average visit</dt>
              <dd className="font-sans text-[1.3rem] font-semibold tnum text-fg">
                {duration(totals.avgSessionSeconds)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 pt-4">
              <dt className="text-[0.82rem] text-fg/55">
                Left after one page
                <span className="mt-0.5 block text-[0.7rem] text-fg/35">Lower is better</span>
              </dt>
              <dd className="font-sans text-[1.3rem] font-semibold tnum text-fg">
                {hasVisits ? percent(totals.bounceRate) : "—"}
              </dd>
            </div>
          </dl>
        </Panel>
      </div>

      {/* ---- Where they went and where they came from ------------------ */}
      <div className="grid gap-4 xl:grid-cols-4">
        <Panel title="Most-read pages" hint="Ranked by page views in this period." className="xl:col-span-2">
          <BarList
            rows={data.topPages.map((row) => ({
              label: row.label,
              value: row.views,
              secondary: row.visitors,
            }))}
            emptyMessage="No pages have been opened in this period."
          />
        </Panel>

        <Panel title="Where visitors came from" hint="The site that sent them. Direct means typed in or bookmarked.">
          <BarList
            rows={data.referrers.map((row) => ({
              label: row.label,
              display: row.label === "direct" ? "Direct" : row.label,
              value: row.views,
              secondary: row.visitors,
            }))}
            emptyMessage="No referrals recorded yet."
          />
        </Panel>

        <Panel title="Devices" hint="What they were reading on.">
          <ShareBars
            rows={data.devices.map((row, index) => ({
              label: row.device,
              value: row.views,
              share: row.share,
              slot: (index + 1) as 1 | 2 | 3,
            }))}
            emptyMessage="Nothing recorded yet."
          />
        </Panel>
      </div>

      {/* ---- Rhythm of the day, and the last few arrivals -------------- */}
      <div className="grid gap-4 xl:grid-cols-4">
        <Panel
          title="Hours of the day"
          hint="Views by hour, UTC, across this period."
          className="xl:col-span-2"
          // The neighbouring panel is a list and sets the row height; without
          // this the strip would sit against the top of a mostly empty card.
          bodyClassName="flex flex-1 flex-col justify-center"
        >
          <HourStrip hours={data.hourly} />
        </Panel>

        <Panel
          title="Latest visits"
          hint="The most recent pages opened."
          className="xl:col-span-2"
          bodyClassName="pt-2"
        >
          <LiveFeed visits={data.recent} now={now} />
        </Panel>
      </div>

      {data.countries.length > 0 && (
        <div className="grid gap-4 xl:grid-cols-4">
          <Panel title="Countries" hint="Where visitors connected from." className="xl:col-span-2">
            <BarList
              rows={data.countries.map((row) => ({
                label: row.label,
                display: countryName(row.label),
                value: row.views,
                secondary: row.visitors,
              }))}
              emptyMessage="No location data available from this host."
            />
          </Panel>
        </div>
      )}

      {/* ---- What is running behind all of this ------------------------ */}
      <Panel title="How this works" hint="The counter is part of this site — no third-party analytics.">
        <ul className="grid gap-x-8 gap-y-5 sm:grid-cols-2 xl:grid-cols-4">
          <li className="flex min-w-0 gap-3">
            <ShieldCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-gold/70" strokeWidth={1.5} />
            <span className="text-[0.82rem] leading-relaxed text-fg/60">
              <span className="block text-fg/85">No cookies, no names</span>
              Visitors are counted with a hash that is re-salted daily.
            </span>
          </li>
          <li className="flex min-w-0 gap-3">
            <Database aria-hidden className="mt-0.5 size-4 shrink-0 text-gold/70" strokeWidth={1.5} />
            <span className="min-w-0 text-[0.82rem] leading-relaxed text-fg/60">
              <span className="block text-fg/85">{store.kind}</span>
              {/* A filesystem path has no spaces to break at, so it would push
                  the panel off the side of a phone without `break-all`. The
                  monospace face is what makes the wrap read as deliberate. */}
              {store.location && (
                <span className="mt-0.5 block break-all font-mono text-[0.7rem] text-fg/45">{store.location}</span>
              )}
            </span>
          </li>
          <li className="flex min-w-0 gap-3">
            <Eye aria-hidden className="mt-0.5 size-4 shrink-0 text-gold/70" strokeWidth={1.5} />
            <span className="text-[0.82rem] leading-relaxed text-fg/60">
              <span className="block text-fg/85">History</span>
              {data.trackingSince
                ? `Counting since ${new Date(`${data.trackingSince}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}.`
                : "Nothing recorded yet."}
            </span>
          </li>
          <li className="flex min-w-0 gap-3">
            <HardDriveDownload aria-hidden className="mt-0.5 size-4 shrink-0 text-gold/70" strokeWidth={1.5} />
            <span className="text-[0.82rem] leading-relaxed text-fg/60">
              <span className="block text-fg/85">Sign-in</span>
              {credentialKind() === "hash" ? "Password stored as a scrypt hash." : "Password set in plain text — a hash is safer."}
            </span>
          </li>
        </ul>

        {!store.durable && (
          <p className="mt-6 flex items-start gap-3 rounded-xl border border-[#e59a93]/30 bg-[#e59a93]/[0.07] px-4 py-3.5 text-[0.82rem] leading-relaxed text-[#e59a93]">
            <span className="mt-0.5 shrink-0">⚠</span>
            This server is writing to a temporary folder, so these numbers will be lost when it restarts. Set
            <span className="mx-1 font-mono text-[0.78rem]">DATA_DIR</span>
            to a directory that persists.
          </p>
        )}
      </Panel>

      <p className="pb-4 text-center text-[0.72rem] text-fg/45">
        Totals exclude obvious bots. All times UTC.
      </p>
    </div>
  );
}
