import type { CSSProperties, ReactNode } from "react";

/*
 * Scroll reveals, done in CSS.
 *
 * These are plain server-rendered <div>s: each carries `data-reveal` (or is a
 * group / group item), the fade and lift are CSS transitions in globals.css,
 * and PageEffects — one small script for the whole page — flips `data-shown`
 * the first time an element comes into view. Content already on the first
 * screen is shown even earlier, by the inline script in SiteShell, before any
 * JavaScript bundle has loaded.
 *
 * They used to be one client component (and before that one animation
 * instance) per revealed element, and hydrating a couple of hundred of them
 * was a large share of a phone's main-thread time on the longer pages.
 *
 * Reduced motion needs nothing here: the CSS shows everything at once under
 * `prefers-reduced-motion`. `suppressHydrationWarning` covers the `data-shown`
 * attribute the inline script may add before React hydrates.
 */

type Props = {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  duration?: number;
  /** Kept for API compatibility; reveals always play once. */
  once?: boolean;
};

export function Reveal({ children, className, delay = 0, y = 28, duration = 1.1 }: Props) {
  const style = { "--reveal-delay": `${delay}s`, "--reveal-y": `${y}px`, "--reveal-duration": `${duration}s` } as CSSProperties;
  return (
    <div data-reveal="" className={className} style={style} suppressHydrationWarning>
      {children}
    </div>
  );
}

/** Staggers the RevealItems inside it (PageEffects numbers them). */
export function RevealGroup({
  children,
  className,
  stagger = 0.08,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
}) {
  const style = { "--reveal-stagger": `${stagger}s`, "--reveal-delay": `${delay}s` } as CSSProperties;
  return (
    <div data-reveal-group="" className={className} style={style} suppressHydrationWarning>
      {children}
    </div>
  );
}

export function RevealItem({ children, className, y = 28 }: { children: ReactNode; className?: string; y?: number }) {
  return (
    <div data-reveal-item="" className={className} style={{ "--reveal-y": `${y}px` } as CSSProperties}>
      {children}
    </div>
  );
}
