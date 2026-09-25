import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = { children: ReactNode; amount?: number; className?: string };

/**
 * Background parallax: the child layer is oversized and drifts vertically
 * as its container scrolls through the viewport.
 *
 * A native CSS scroll-driven animation (see "Background parallax" in
 * globals.css) rather than a scroll listener, so it costs no JavaScript and
 * never runs on the main thread while the page scrolls.
 */
export function Parallax({ children, amount = 70, className }: Props) {
  return (
    <div aria-hidden className={cn("parallax pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div className="parallax-layer absolute inset-[-12%]" style={{ "--parallax-amount": `${amount}px` } as CSSProperties}>
        {children}
      </div>
    </div>
  );
}
