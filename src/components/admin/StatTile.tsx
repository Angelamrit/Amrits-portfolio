import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/cn";
import { signedPercent } from "./format";

/**
 * One measurement, with its change against the period before.
 *
 * The delta is the part that earns the tile. A number on its own ("412
 * visitors") means nothing without a reference; against last month it becomes
 * a fact the chef can act on. Where there is no honest comparison — the
 * previous period had none of this at all — the tile says so in words instead
 * of printing a percentage that would be arithmetic on zero.
 *
 * Direction and goodness are separate, because they come apart: more visitors
 * is good and a higher bounce rate is not, and the colour has to follow the
 * meaning rather than the sign.
 */

type Props = {
  label: string;
  value: string;
  /** e.g. "vs previous 30 days". Named, never a bare arrow. */
  comparedTo?: string;
  change: number | null;
  higherIsBetter?: boolean;
  hint?: string;
  /** Up to twelve points, oldest first. Drawn as a sparkline under the value. */
  spark?: number[];
  featured?: boolean;
  className?: string;
};

function Sparkline({ points, featured }: { points: number[]; featured?: boolean }) {
  const width = 100;
  const height = featured ? 34 : 26;
  const max = Math.max(...points, 1);
  const step = points.length > 1 ? width / (points.length - 1) : width;

  const path = points
    .map((value, index) => `${index === 0 ? "M" : "L"}${(index * step).toFixed(2)},${(height - (value / max) * (height - 3) - 1.5).toFixed(2)}`)
    .join(" ");

  const lastX = (points.length - 1) * step;
  const lastY = height - (points[points.length - 1] / max) * (height - 3) - 1.5;

  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="mt-4 h-[26px] w-full overflow-visible"
      style={featured ? { height: 34 } : undefined}
    >
      <path d={path} fill="none" stroke="var(--color-chart-1)" strokeOpacity={0.45} strokeWidth={1.5} vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
      {/* The current period gets the end-dot, with a surface ring so it stays
          legible where the line runs close to the panel edge. */}
      <circle cx={lastX} cy={lastY} r={2.6} fill="var(--color-chart-1)" stroke="var(--color-chart-surface)" strokeWidth={2} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function StatTile({ label, value, comparedTo, change, higherIsBetter = true, hint, spark, featured, className }: Props) {
  const improving = change === null ? null : higherIsBetter ? change > 0 : change < 0;
  const flat = change !== null && Math.abs(change) < 0.005;

  const Arrow = change === null || flat ? Minus : change > 0 ? ArrowUpRight : ArrowDownRight;
  const deltaColour = flat || improving === null ? "text-fg/45" : improving ? "text-[#7fc39b]" : "text-[#e59a93]";

  return (
    <div
      className={cn(
        "glass border-gradient spotlight group relative flex flex-col rounded-frame p-6 transition-shadow duration-700 ease-luxe hover:shadow-glow",
        featured && "sm:p-8",
        className,
      )}
    >
      <p className="eyebrow text-fg/50">{label}</p>

      <p
        className={cn(
          // Proportional figures: a headline number set in tabular digits looks
          // loose at this size. Columns of numbers elsewhere do use `tnum`.
          "mt-4 font-sans font-semibold leading-none text-fg",
          featured ? "text-[clamp(2.75rem,1.6rem+3.4vw,4.25rem)]" : "text-[clamp(1.9rem,1.5rem+1.2vw,2.5rem)]",
        )}
      >
        {value}
      </p>

      <div className="mt-3.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.78rem]">
        {change === null ? (
          <span className="text-fg/40">{hint ?? "No earlier period to compare"}</span>
        ) : (
          <>
            <span className={cn("inline-flex items-center gap-1 font-semibold tnum", deltaColour)}>
              <Arrow aria-hidden className="size-3.5" strokeWidth={2} />
              {flat ? "No change" : signedPercent(change)}
            </span>
            {comparedTo && <span className="text-fg/40">{comparedTo}</span>}
          </>
        )}
      </div>

      {spark && spark.length > 1 && <Sparkline points={spark} featured={featured} />}
    </div>
  );
}
