"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { exact } from "./format";

/**
 * Visits over time.
 *
 * Two series on one axis, always in this order: page views first, visitors
 * second. Fixed order matters — if the colours followed rank instead, a quiet
 * week that flipped which line was on top would repaint the chart and make two
 * screenshots of the same site look like two different sites.
 *
 * Reading a value never depends on hovering. The crosshair is a convenience;
 * the axis carries the scale, the last point is labelled directly, and the
 * table underneath holds every number for anyone using a keyboard, a screen
 * reader, or a printout.
 */

export type ChartPoint = { label: string; at: number; views: number; visitors: number };

const SERIES = [
  { key: "views", label: "Page views", colour: "var(--color-chart-1)" },
  { key: "visitors", label: "Visitors", colour: "var(--color-chart-2)" },
] as const;

const PAD = { top: 18, right: 18, bottom: 28, left: 46 };
const HEIGHT = 300;

/**
 * Axis ticks a person would actually say out loud: 0 / 5 / 10, never
 * 0 / 3 / 5 / 8 / 10. The step is 1, 2 or 5 times a power of ten, and the top
 * of the scale is rounded up to a whole number of steps — so the ticks carry
 * the values that are not directly labelled instead of needing to be decoded.
 */
function niceTicks(peak: number, targetCount = 4): number[] {
  if (peak <= 0) return [0, 1, 2, 3, 4];
  if (peak <= targetCount) return Array.from({ length: Math.max(2, Math.ceil(peak) + 1) }, (_, i) => i);

  const rough = peak / targetCount;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const normalised = rough / magnitude;
  const step = (normalised <= 1 ? 1 : normalised <= 2 ? 2 : normalised <= 5 ? 5 : 10) * magnitude;

  const ceiling = Math.ceil(peak / step) * step;
  const ticks: number[] = [];
  for (let value = 0; value <= ceiling + step / 1000; value += step) ticks.push(Math.round(value));
  return ticks;
}

export function TrafficChart({ points, rangeLabel }: { points: ChartPoint[]; rangeLabel: string }) {
  const frame = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      // Sub-pixel widths make the crosshair jitter; whole pixels do not.
      setWidth(Math.max(280, Math.floor(entry.contentRect.width)));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const plotWidth = Math.max(1, width - PAD.left - PAD.right);
  const plotHeight = HEIGHT - PAD.top - PAD.bottom;

  const { ticks, xOf, yOf } = useMemo(() => {
    const highest = points.reduce((peak, point) => Math.max(peak, point.views, point.visitors), 0);
    const scale = niceTicks(highest);
    const ceiling = scale[scale.length - 1];
    const step = points.length > 1 ? plotWidth / (points.length - 1) : 0;
    return {
      ticks: scale,
      xOf: (index: number) => PAD.left + (points.length > 1 ? index * step : plotWidth / 2),
      yOf: (value: number) => PAD.top + plotHeight - (value / ceiling) * plotHeight,
    };
  }, [points, plotWidth, plotHeight]);

  const paths = useMemo(
    () =>
      SERIES.map((series) => {
        const line = points
          .map((point, index) => `${index === 0 ? "M" : "L"}${xOf(index).toFixed(2)},${yOf(point[series.key]).toFixed(2)}`)
          .join(" ");
        const baseline = PAD.top + plotHeight;
        const area =
          points.length > 1
            ? `${line} L${xOf(points.length - 1).toFixed(2)},${baseline} L${xOf(0).toFixed(2)},${baseline} Z`
            : "";
        return { ...series, line, area };
      }),
    [points, xOf, yOf, plotHeight],
  );

  const empty = points.every((point) => point.views === 0);

  /** The crosshair snaps to the nearest position, so the reader aims at a date rather than at a 2px line. */
  const indexAt = useCallback(
    (clientX: number) => {
      const box = frame.current?.getBoundingClientRect();
      if (!box || points.length === 0) return null;
      const x = clientX - box.left;
      if (points.length === 1) return 0;
      const step = plotWidth / (points.length - 1);
      return Math.min(points.length - 1, Math.max(0, Math.round((x - PAD.left) / step)));
    },
    [points.length, plotWidth],
  );

  const onKey = (event: React.KeyboardEvent) => {
    if (points.length === 0) return;
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      setActive((current) => {
        const next = (current ?? (event.key === "ArrowRight" ? -1 : points.length)) + (event.key === "ArrowRight" ? 1 : -1);
        return Math.min(points.length - 1, Math.max(0, next));
      });
    }
    if (event.key === "Escape") setActive(null);
  };

  const point = active === null ? null : points[active];
  // Flip the readout to the left of the crosshair near the right edge so it is
  // never clipped by the panel.
  const tooltipX = active === null ? 0 : xOf(active);
  const flip = tooltipX > width - 150;

  const lastIndex = points.length - 1;
  const showEndLabel = !empty && points.length > 1;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        {SERIES.map((series) => (
          <span key={series.key} className="flex items-center gap-2 text-[0.78rem] text-fg/60">
            <span aria-hidden className="h-[2px] w-5 rounded-pill" style={{ background: series.colour }} />
            {series.label}
          </span>
        ))}
      </div>

      <div
        ref={frame}
        // `min-w-0` because a grid item's default `min-width: auto` lets its
        // contents push it wider than its track — and the SVG below is given an
        // explicit pixel width. Without this the chart measures the container,
        // draws itself that wide, widens the container, and the panel walks off
        // the right edge of a phone.
        className="relative w-full min-w-0 outline-none"
        style={{ height: HEIGHT }}
        tabIndex={0}
        role="img"
        aria-label={`Page views and visitors over the last ${rangeLabel}. The figures are listed in the table below the chart.`}
        onKeyDown={onKey}
        onPointerMove={(event) => setActive(indexAt(event.clientX))}
        onPointerLeave={() => setActive(null)}
        onBlur={() => setActive(null)}
      >
        {/* Taken out of flow entirely: its pixel width is a consequence of the
            measured container, never an input to it. */}
        <svg width={width} height={HEIGHT} className="absolute inset-0 overflow-visible">
          {/* Gridlines: one step off the surface, hairline, solid. */}
          {ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={PAD.left}
                x2={width - PAD.right}
                y1={yOf(tick)}
                y2={yOf(tick)}
                stroke="var(--color-chart-grid)"
                strokeWidth={1}
                shapeRendering="crispEdges"
              />
              <text
                x={PAD.left - 10}
                y={yOf(tick)}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-[color:var(--fg)] font-sans text-[0.66rem] tnum opacity-40"
              >
                {exact(tick)}
              </text>
            </g>
          ))}

          {!empty &&
            paths.map((series) => (
              <g key={series.key}>
                {series.area && <path d={series.area} fill={series.colour} fillOpacity={0.1} />}
                <path
                  d={series.line}
                  fill="none"
                  stroke={series.colour}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            ))}

          {/* A single bucket has no line to draw, so it is drawn as a marker. */}
          {!empty &&
            points.length === 1 &&
            SERIES.map((series) => (
              <circle
                key={series.key}
                cx={xOf(0)}
                cy={yOf(points[0][series.key])}
                r={4}
                fill={series.colour}
                stroke="var(--color-chart-surface)"
                strokeWidth={2}
              />
            ))}

          {active !== null && point && (
            <g>
              <line
                x1={xOf(active)}
                x2={xOf(active)}
                y1={PAD.top}
                y2={PAD.top + plotHeight}
                stroke="var(--color-gold-light)"
                strokeOpacity={0.4}
                strokeWidth={1}
              />
              {SERIES.map((series) => (
                <circle
                  key={series.key}
                  cx={xOf(active)}
                  cy={yOf(point[series.key])}
                  r={4.5}
                  fill={series.colour}
                  stroke="var(--color-chart-surface)"
                  strokeWidth={2}
                />
              ))}
            </g>
          )}

          {/* One direct label, on the most recent page-views value. */}
          {showEndLabel && (
            <text
              x={xOf(lastIndex) - 4}
              y={yOf(points[lastIndex].views) - 12}
              textAnchor="end"
              className="fill-[color:var(--fg)] font-sans text-[0.7rem] font-semibold opacity-75"
            >
              {exact(points[lastIndex].views)}
            </text>
          )}

          {/* X labels, thinned so they never collide at any width. */}
          {points.map((item, index) => {
            const every = Math.max(1, Math.ceil(points.length / Math.max(2, Math.floor(plotWidth / 78))));
            if (index % every !== 0 && index !== lastIndex) return null;
            if (index !== lastIndex && lastIndex - index < every * 0.6) return null;
            return (
              <text
                key={item.at}
                x={xOf(index)}
                y={HEIGHT - 8}
                textAnchor={index === 0 ? "start" : index === lastIndex ? "end" : "middle"}
                className="fill-[color:var(--fg)] font-sans text-[0.64rem] opacity-40"
              >
                {item.label}
              </text>
            );
          })}
        </svg>

        {active !== null && point && (
          <div
            className="glass-strong pointer-events-none absolute z-10 min-w-[9.5rem] rounded-xl px-3.5 py-3 shadow-frame"
            style={{ left: flip ? tooltipX - 150 : tooltipX + 14, top: PAD.top }}
          >
            <p className="text-[0.68rem] uppercase tracking-[0.16em] text-fg/45">{point.label}</p>
            <ul className="mt-2 flex flex-col gap-1.5">
              {SERIES.map((series) => (
                <li key={series.key} className="flex items-baseline gap-2">
                  <span aria-hidden className="h-[2px] w-3.5 shrink-0 rounded-pill" style={{ background: series.colour }} />
                  <span className="font-sans text-[0.95rem] font-semibold tnum text-fg">{exact(point[series.key])}</span>
                  <span className="text-[0.7rem] text-fg/45">{series.label}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {empty && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <p className="rounded-pill border border-dashed border-fg/15 px-5 py-2 text-[0.8rem] text-fg/40">
              No visits recorded in this period yet
            </p>
          </div>
        )}
      </div>

      {/* Every value, without hovering — and the fallback when the chart cannot be seen at all. */}
      <details className="group/table">
        <summary className="inline-flex cursor-pointer list-none items-center gap-2 text-[0.72rem] uppercase tracking-[0.18em] text-fg/40 transition-colors duration-300 hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
          <span aria-hidden className="transition-transform duration-300 group-open/table:rotate-90">›</span>
          View as a table
        </summary>
        <div className="mt-3 max-h-64 overflow-auto rounded-xl border border-fg/10">
          <table className="w-full text-left text-[0.8rem]">
            <thead className="sticky top-0 bg-charcoal/90 text-[0.66rem] uppercase tracking-[0.16em] text-fg/45 backdrop-blur">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Period
                </th>
                {SERIES.map((series) => (
                  <th key={series.key} scope="col" className="px-4 py-2.5 text-right font-medium">
                    {series.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="tnum">
              {points.map((item) => (
                <tr key={item.at} className="border-t border-fg/8">
                  <th scope="row" className="px-4 py-2 font-normal text-fg/65">
                    {item.label}
                  </th>
                  <td className="px-4 py-2 text-right text-fg/80">{exact(item.views)}</td>
                  <td className="px-4 py-2 text-right text-fg/80">{exact(item.visitors)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
