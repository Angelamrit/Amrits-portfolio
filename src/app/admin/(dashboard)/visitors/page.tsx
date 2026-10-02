import type { Metadata } from "next";
import { Database, Eye, HardDriveDownload, ShieldCheck } from "lucide-react";
import { SITE_TIME_ZONE, SITE_TIME_ZONE_LABEL, getOverview, rangeFromKey } from "@/lib/analytics/aggregate";
import { pageName } from "@/lib/analytics/page-names";
import { credentialKind } from "@/lib/admin/config";
import { credentials } from "@/lib/admin/credential";
import { store } from "@/lib/store";
import { backupsEnabled, latestBackup } from "@/lib/store/backup";
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

export const metadata: Metadata = { title: "Visitors" };

/**
 * What the chef opens first: how many people came to the site, where they came
 * from and what they read.
 *
 * Every figure on this page is computed from the site's own visit log. There
 * is no third-party analytics script anywhere on this site, which is why the
 * public pages carry no consent banner — nothing that identifies a visitor is
 * ever collected, and the log holds no cookie, no IP address and no name.
 */
export default async function VisitorsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range: requested } = await searchParams;
  const range = rangeFromKey(requested);
  const filesOnThisServer = store.kind === "Plain files" && !process.env.VERCEL;
  const [data, credential, lastBackup] = await Promise.all([
    getOverview(range.key),
    credentials.active(),
    filesOnThisServer && backupsEnabled() ? latestBackup().catch(() => null) : Promise.resolve(null),
  ]);
  // Only where this server backs itself up; on Vercel the cloud stores keep their own copies.
  const backupNote = !filesOnThisServer
    ? null
    : !backupsEnabled()
      ? "Daily backups run on the live server."
      : lastBackup
        ? `Backed up daily. Last backup ${new Date(lastBackup.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: SITE_TIME_ZONE })}.`
        : "Backed up daily. The first backup is made a minute after the server starts.";
  const signInNote =
    credential?.source === "dashboard"
      ? "Password set in the dashboard, stored as a scrypt hash."
      : credentialKind() === "hash"
        ? "Password stored as a scrypt hash."
        : "Password set in plain text — a hash is safer.";
  // The instant the roll-up was taken, rather than a second reading of the
  // clock: the live feed's relative times must agree with the range that was
  // actually measured, and a render is not the place to read a clock.
  const now = data.to;

  const { totals, previous } = data;
  const comparedTo = previous ? `vs previous ${range.label}` : undefined;
  const spark = data.series.slice(-12).map((point) => point.views);

  const hasVisits = totals.views > 0;
  // Why a tile has no percentage: nothing recorded at all, a year-long range
  // (which is not compared, see `computeOverview`), or no visits in the
  // period before this one.
  const noComparison = !hasVisits
    ? "Nothing recorded yet"
    : previous === null
      ? "Not compared over a whole year"
      : "Nothing in the period before to compare";

  return (
    <div className="flex flex-col gap-8">
      <PageHeading
        eyebrow="Visitors"
        title="Who's visiting"
        description={`Who visited chefamritpalsingh.com in the last ${range.label}, and what they looked at.`}
      >
        <LivePulse count={data.liveVisitors} />
        <RangeTabs active={range.key} basePath="/admin/visitors" />
      </PageHeading>

      {/* ---- The headline figures ------------------------------------- */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          featured
          label="Visitors"
          value={compact(totals.visitors)}
          comparedTo={comparedTo}
          change={change(totals.visitors, previous?.visitors)}
          hint={noComparison}
          spark={spark}
          className="sm:col-span-2"
        />
        <StatTile
          label="Page views"
          value={compact(totals.views)}
          comparedTo={comparedTo}
          change={change(totals.views, previous?.views)}
          hint={noComparison}
        />
        <StatTile
          label="Visits"
          value={compact(totals.sessions)}
          comparedTo={comparedTo}
          change={change(totals.sessions, previous?.sessions)}
          hint={noComparison}
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
              display: pageName(row.label),
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
          hint={`When people read the site, by hour, ${SITE_TIME_ZONE_LABEL}.`}
          className="xl:col-span-2"
          // The neighbouring panel is a list and sets the row height; without
          // this the strip would sit against the top of a mostly empty card.
          bodyClassName="flex flex-1 flex-col justify-center"
        >
          <HourStrip hours={data.hourly} zoneLabel={SITE_TIME_ZONE_LABEL} />
        </Panel>

        <Panel
          title="Latest visits"
          hint="The most recent pages opened."
          className="xl:col-span-2"
          bodyClassName="pt-2"
        >
          <LiveFeed visits={data.recent.map((visit) => ({ ...visit, page: pageName(visit.path) }))} now={now} />
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
              {backupNote && <span className="mt-1 block text-[0.76rem] text-fg/55">{backupNote}</span>}
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
              {signInNote}
            </span>
          </li>
        </ul>

      </Panel>

      <p className="pb-4 text-center text-[0.72rem] text-fg/45">
        Totals exclude obvious bots. Days and hours are {SITE_TIME_ZONE_LABEL}, the restaurant&rsquo;s own clock.
      </p>
    </div>
  );
}
