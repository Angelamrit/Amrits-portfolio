import Link from "next/link";
import { cn } from "@/lib/cn";
import { RANGES } from "@/lib/analytics/aggregate";

/**
 * The date range, which scopes everything below it.
 *
 * Presets rather than a calendar: "last 30 days" is what anyone actually wants
 * and nobody should have to assemble it out of two date pickers. It lives in
 * the URL, so a range can be bookmarked and the back button behaves.
 */
export function RangeTabs({ active, basePath = "/admin/visitors" }: { active: string; basePath?: string }) {
  return (
    <div
      // Five presets are wider than a phone. Scrolling the strip keeps every
      // range reachable without wrapping it into two rows or pushing the page
      // sideways.
      className="glass no-scrollbar flex max-w-full items-center gap-0.5 overflow-x-auto rounded-pill p-1"
      role="group"
      aria-label="Time range"
    >
      {RANGES.map((range) => {
        const selected = range.key === active;
        return (
          <Link
            key={range.key}
            href={range.key === "30d" ? basePath : `${basePath}?range=${range.key}`}
            scroll={false}
            aria-current={selected ? "true" : undefined}
            className={cn(
              "shrink-0 rounded-pill px-3.5 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.14em] transition-all duration-400 ease-luxe",
              selected
                ? "bg-gold/20 text-gold-light shadow-[inset_0_0_0_1px_rgba(240,217,160,0.35)]"
                : "text-fg/45 hover:bg-fg/[0.06] hover:text-fg/80",
            )}
          >
            {range.label}
          </Link>
        );
      })}
    </div>
  );
}
