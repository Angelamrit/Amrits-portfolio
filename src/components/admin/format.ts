/**
 * How numbers are written on the dashboard.
 *
 * Kept in one place because the same value appears in a tile, a tooltip and a
 * table row, and a figure that reads "1.2K" in one and "1,240" in another makes
 * a reader check whether they are even the same number.
 */

/** Full precision with thousands separators — for tables, tooltips and axis ticks. */
export function exact(value: number): string {
  return Math.round(value).toLocaleString("en-GB");
}

/** Compact for headline figures, where four digits of precision is noise. */
export function compact(value: number): string {
  const rounded = Math.round(value);
  if (rounded < 10_000) return rounded.toLocaleString("en-GB");
  if (rounded < 1_000_000) return `${(rounded / 1_000).toFixed(rounded < 100_000 ? 1 : 0)}K`;
  return `${(rounded / 1_000_000).toFixed(1)}M`;
}

export function percent(fraction: number, digits = 0): string {
  return `${(fraction * 100).toFixed(digits)}%`;
}

/** Durations read as time, not as a count of seconds: 0s, 47s, 3m 12s, 1h 04m. */
export function duration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  if (total < 60) return `${total}s`;
  if (total < 3_600) return `${Math.floor(total / 60)}m ${String(total % 60).padStart(2, "0")}s`;
  return `${Math.floor(total / 3_600)}h ${String(Math.floor((total % 3_600) / 60)).padStart(2, "0")}m`;
}

/**
 * The change against the period before, as a fraction.
 *
 * `null` where a percentage would be a lie: growth from zero is not "infinite
 * per cent up", it is the first data, and the tile says "first activity"
 * instead of printing a number that would make a quiet week look like a
 * triumph.
 */
export function change(current: number, previous: number | undefined): number | null {
  if (previous === undefined || previous === 0) return null;
  return (current - previous) / previous;
}

export function signedPercent(fraction: number): string {
  const rounded = Math.abs(fraction * 100);
  const shown = rounded >= 100 ? Math.round(rounded) : Number(rounded.toFixed(rounded < 10 ? 1 : 0));
  return `${fraction >= 0 ? "+" : "−"}${shown}%`;
}

/** "just now", "6 min ago", "3 h ago", "2 days ago" — for the live feed. */
export function relativeTime(at: number, now = Date.now()): string {
  const seconds = Math.max(0, Math.round((now - at) / 1000));
  if (seconds < 45) return "just now";
  if (seconds < 3_600) return `${Math.round(seconds / 60)} min ago`;
  if (seconds < 86_400) return `${Math.round(seconds / 3_600)} h ago`;
  const days = Math.round(seconds / 86_400);
  return days === 1 ? "yesterday" : `${days} days ago`;
}

/**
 * Country codes shown as a name rather than two letters.
 *
 * `Intl.DisplayNames` is built into Node and every browser this site supports,
 * so there is no country list to keep — and it falls back to the code itself
 * for anything it does not recognise.
 */
const countryNames = new Intl.DisplayNames(["en"], { type: "region" });

export function countryName(code: string): string {
  try {
    return countryNames.of(code) ?? code;
  } catch {
    return code;
  }
}
