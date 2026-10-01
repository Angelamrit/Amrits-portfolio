import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

type Props = { count?: number; className?: string };

/**
 * Rising embers over the flames. Deterministic values keep server and client markup identical.
 *
 * Each ember is two spans. The outer one holds its place and a small fixed tilt; the inner one
 * only rises and fades. The tilt turns that straight rise into the sideways drift, so the
 * keyframes need no per-ember variable. That matters: a custom property inside keyframes keeps
 * Chrome from handing the animation to the compositor, and with thirty embers on the home page
 * that meant a style recalculation on every frame, for as long as the page was open.
 */
export function Embers({ count = 18, className }: Props) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 z-[1] overflow-hidden motion-reduce:hidden", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="absolute bottom-[-4%] block origin-bottom"
          // -4.5° to 4.5°: over a 95vh climb, the same ±21px / ±63px drift as before.
          style={{ left: `${(i * 53 + 7) % 100}%`, transform: `rotate(${((i % 4) - 1.5) * 3}deg)` }}
        >
          <span
            className={`block rounded-full bg-gold-light opacity-0 shadow-[0_0_10px_rgba(240,217,160,0.95)] animate-ember ${i % 3 === 0 ? "size-1.5" : "size-1"}`}
            style={{ animationDelay: `${(i * 0.85) % 9}s`, animationDuration: `${8 + (i % 5) * 1.7}s` } as CSSProperties}
          />
        </span>
      ))}
    </div>
  );
}
