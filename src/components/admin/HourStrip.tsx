import { cn } from "@/lib/cn";
import { exact } from "./format";
import { PanelEmpty } from "./Panel";

/**
 * When, in the day, people read the site.
 *
 * One measure across twenty-four fixed slots, so it is columns in a single
 * hue, not a heat map — height is a far more precise channel than shade, and
 * a rainbow across hours would imply a category difference that is not there.
 *
 * The hours are UTC, and the panel says so rather than quietly converting:
 * the chef is in New York, his guests are not all in one place, and a chart
 * that silently picks one timezone is a chart that is wrong for everyone else.
 */
export function HourStrip({ hours }: { hours: number[] }) {
  const peak = Math.max(...hours);
  if (peak === 0) return <PanelEmpty>Nothing recorded yet</PanelEmpty>;

  const busiest = hours.indexOf(peak);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex h-40 items-end gap-[3px]" role="img" aria-label={`Views by hour. Busiest at ${String(busiest).padStart(2, "0")}:00 UTC with ${exact(peak)} views.`}>
        {hours.map((count, hour) => (
          <div key={hour} className="group/hour relative flex h-full flex-1 items-end">
            <span
              className="w-full rounded-t-[4px] bg-[color:var(--color-chart-1)] transition-[height,opacity] duration-700 ease-luxe group-hover/hour:opacity-100"
              style={{
                height: `${Math.max(2, (count / peak) * 100)}%`,
                // An empty hour keeps a baseline sliver so the axis reads as a
                // continuous day, but at an opacity that cannot be mistaken
                // for a real reading.
                opacity: count === 0 ? 0.14 : hour === busiest ? 0.95 : 0.5,
              }}
            />
            {/*
              The hit target is the whole column, not the painted bar.

              The readout is anchored to the strip's edges near either end
              rather than always centred on its column. A hidden tooltip still
              takes part in layout, so a centred one on the last hour hung past
              the right edge and gave the whole page a horizontal scrollbar on
              a phone — and on the first hour it would have been cut off.
            */}
            <span
              className={cn(
                "pointer-events-none absolute -top-1 z-10 hidden -translate-y-full whitespace-nowrap rounded-lg border border-gold/25 bg-charcoal/95 px-2.5 py-1.5 text-[0.68rem] tnum text-fg shadow-frame group-hover/hour:block",
                hour <= 2 ? "left-0" : hour >= 21 ? "right-0" : "left-1/2 -translate-x-1/2",
              )}
            >
              {String(hour).padStart(2, "0")}:00 · {exact(count)}
            </span>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[0.64rem] tnum text-fg/35">
        <span>00:00</span>
        <span>06:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>23:00</span>
      </div>
    </div>
  );
}
