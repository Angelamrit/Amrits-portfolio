import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

type Props = { count?: number; className?: string };

/** Rising embers over the flames. Deterministic values keep server and client markup identical. */
export function Embers({ count = 18, className }: Props) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 z-[1] overflow-hidden motion-reduce:hidden", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className={`absolute bottom-[-4%] block rounded-full bg-gold-light opacity-0 shadow-[0_0_10px_rgba(240,217,160,0.95)] animate-ember ${i % 3 === 0 ? "size-1.5" : "size-1"}`}
          style={
            {
              left: `${(i * 53 + 7) % 100}%`,
              animationDelay: `${(i * 0.85) % 9}s`,
              animationDuration: `${8 + (i % 5) * 1.7}s`,
              "--dx": `${((i % 4) - 1.5) * 42}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
