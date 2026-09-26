import { cn } from "@/lib/cn";
import { exact } from "./format";
import { PanelEmpty } from "./Panel";

/**
 * A ranked list with a bar behind each row.
 *
 * One measure, so one hue — a different colour per row would say these
 * categories differ in kind when the only thing that differs is size. The
 * number sits at the bar's tip, which is where the eye already is after
 * following the bar, and the second measure appears on hover for anyone who
 * wants it without putting two numbers on every row by default.
 */

export type BarRow = {
  label: string;
  /** Rendered instead of `label` when the raw value needs shaping (a URL, a country code). */
  display?: string;
  value: number;
  secondary?: number;
  secondaryLabel?: string;
  href?: string;
};

export function BarList({
  rows,
  emptyMessage,
  secondaryLabel = "visitors",
}: {
  rows: BarRow[];
  emptyMessage: string;
  secondaryLabel?: string;
}) {
  if (rows.length === 0) return <PanelEmpty>{emptyMessage}</PanelEmpty>;

  const peak = Math.max(...rows.map((row) => row.value), 1);

  return (
    <ol className="flex flex-col gap-1">
      {rows.map((row) => {
        const share = Math.max(0.02, row.value / peak);
        return (
          <li key={row.label} className="group/row relative">
            <div className="relative flex items-center justify-between gap-4 overflow-hidden rounded-lg px-3 py-2.5 transition-colors duration-300 hover:bg-fg/[0.04]">
              {/* The bar is the background of the row: square at the baseline it
                  grows from, rounded at the data end. */}
              <span
                aria-hidden
                className="absolute inset-y-[3px] left-0 rounded-r-[4px] bg-[color:var(--color-chart-1)] opacity-[0.28] transition-[width,opacity] duration-700 ease-luxe group-hover/row:opacity-45"
                style={{ width: `${share * 100}%` }}
              />
              <span className="relative min-w-0 flex-1 truncate font-sans text-[0.84rem] text-fg/85">
                {row.display ?? row.label}
              </span>
              <span className="relative flex shrink-0 items-baseline gap-2">
                {row.secondary !== undefined && (
                  <span className="text-[0.7rem] tnum text-fg/0 transition-colors duration-300 group-hover/row:text-fg/45">
                    {exact(row.secondary)} {row.secondaryLabel ?? secondaryLabel}
                  </span>
                )}
                <span className="font-sans text-[0.9rem] font-semibold tnum text-fg">{exact(row.value)}</span>
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * The device split: a small fixed set of named categories, so each gets its own
 * slot colour and its own share of one track. Read left to right as a whole.
 */
export function ShareBars({
  rows,
  emptyMessage,
}: {
  rows: { label: string; value: number; share: number; slot: 1 | 2 | 3 | 4 }[];
  emptyMessage: string;
}) {
  if (rows.length === 0) return <PanelEmpty>{emptyMessage}</PanelEmpty>;

  return (
    <div className="flex flex-col gap-5">
      {/* One track, segmented. The 2px gaps are the surface showing through —
          nothing is outlined, because an outline would add ink that isn't data. */}
      <div className="flex h-2.5 w-full gap-[2px] overflow-hidden rounded-pill">
        {rows.map((row) => (
          <span
            key={row.label}
            className="h-full first:rounded-l-pill last:rounded-r-pill"
            style={{ width: `${Math.max(1.5, row.share * 100)}%`, background: `var(--color-chart-${row.slot})` }}
          />
        ))}
      </div>

      <ul className="flex flex-col gap-2.5">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2.5">
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-[3px]"
                style={{ background: `var(--color-chart-${row.slot})` }}
              />
              <span className="truncate font-sans text-[0.84rem] capitalize text-fg/85">{row.label}</span>
            </span>
            <span className="flex shrink-0 items-baseline gap-2.5 tnum">
              <span className="text-[0.72rem] text-fg/40">{exact(row.value)}</span>
              <span className={cn("font-sans text-[0.9rem] font-semibold text-fg")}>
                {(row.share * 100).toFixed(0)}%
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
