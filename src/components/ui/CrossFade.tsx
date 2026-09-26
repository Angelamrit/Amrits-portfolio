"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type Snapshot = { id: string; node: ReactNode };

/**
 * Swaps its content with a crossfade when `id` changes: the previous content
 * stays mounted just long enough to fade out while the new one fades in.
 *
 * The fade itself is CSS (`[data-xfade]` in globals.css); this only decides
 * which layers exist. The first render does not animate. Each layer is
 * absolutely positioned inside `className`, so give the container a size.
 */
export function CrossFade({
  id,
  children,
  className,
  variant = "fade",
  duration = 900,
}: {
  id: string;
  children: ReactNode;
  className?: string;
  /** `fade`: image crossfade with a gentle settle. `rise`: text that lifts in after the old copy fades. */
  variant?: "fade" | "rise";
  /** How long the outgoing layer is kept, in ms. Match the CSS durations. */
  duration?: number;
}) {
  // What the current id looked like when it arrived, kept so it can fade out
  // after it is replaced; the live current layer always renders `children`.
  const [current, setCurrent] = useState<Snapshot>({ id, node: children });
  const [leaving, setLeaving] = useState<Snapshot[]>([]);
  const [animated, setAnimated] = useState(false);

  // Adjusted during render (not in an effect) so the swap lands in one frame.
  if (current.id !== id) {
    setLeaving((prev) => [...prev.filter((l) => l.id !== id), current]);
    setCurrent({ id, node: children });
    setAnimated(true);
  }

  useEffect(() => {
    if (leaving.length === 0) return;
    const t = window.setTimeout(() => setLeaving([]), duration);
    return () => window.clearTimeout(t);
  }, [leaving, duration]);

  return (
    <div className={cn("relative", className)}>
      {leaving.map((l) => (
        <div key={l.id} data-xfade="exit" data-xfade-variant={variant} aria-hidden className="absolute inset-0">
          {l.node}
        </div>
      ))}
      <div key={id} data-xfade={animated ? "enter" : undefined} data-xfade-variant={variant} className="absolute inset-0">
        {children}
      </div>
    </div>
  );
}
