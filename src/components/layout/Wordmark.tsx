"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import { cn } from "@/lib/cn";

/**
 * Already on the home page, the mark is a "back to the top" button: a link to
 * the page you are on does not scroll anywhere by itself, so a guest far down
 * the page would tap it and see nothing happen.
 */
function scrollHomeToTop(event: MouseEvent<HTMLAnchorElement>) {
  if (window.location.pathname !== "/" || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: 0, behavior: still ? "auto" : "smooth" });
  // Drop any #section left in the address bar, so a reload also lands at the top.
  if (window.location.hash) history.replaceState(history.state, "", "/");
}

/**
 * Engraved monogram + name. The ring rotates and the disc fills with gold on
 * hover, so the mark feels struck rather than typed.
 */
export function Wordmark({
  className,
  compact = false,
  onNavigate,
}: {
  tone?: "light" | "dark";
  className?: string;
  compact?: boolean;
  /** Called on every click, before anything else — the mobile menu uses it to close itself. */
  onNavigate?: () => void;
}) {
  return (
    <Link
      href="/"
      onClick={(event) => {
        onNavigate?.();
        scrollHomeToTop(event);
      }}
      aria-label="Amrit Pal Singh — home"
      className={cn("group relative inline-flex shrink-0 items-center gap-3.5 text-fg", className)}
    >
      <span aria-hidden className="relative grid size-11 shrink-0 place-items-center">
        <svg viewBox="0 0 100 100" className="absolute inset-0 size-full text-gold/45 transition-colors duration-700 group-hover:text-gold">
          <circle
            cx="50"
            cy="50"
            r="47"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeDasharray="3 7"
            strokeLinecap="round"
            className="origin-center transition-transform duration-[2200ms] ease-luxe group-hover:rotate-[200deg]"
          />
          <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="0.75" opacity="0.5" />
        </svg>
        <span className="absolute inset-[18%] rounded-full bg-gradient-to-br from-gold/22 via-gold/5 to-transparent transition-all duration-500 ease-luxe group-hover:from-gold-light group-hover:via-gold group-hover:to-gold-deep" />
        <span className="absolute inset-0 rounded-full opacity-0 shadow-[0_0_30px_-4px_rgba(226,189,108,0.95)] transition-opacity duration-500 group-hover:opacity-100" />
        <span className="relative font-display text-xl italic leading-none text-gold-light transition-colors duration-500 group-hover:text-charcoal">A</span>
      </span>

      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-[1.2rem] font-normal tracking-[0.015em] whitespace-nowrap">
            Amrit <span className="text-gold-gradient">Pal Singh</span>
          </span>
          <span className="mt-[0.4rem] flex items-center gap-2">
            <span aria-hidden className="block h-px w-0 shrink-0 bg-gradient-to-r from-gold to-transparent transition-all duration-700 ease-luxe group-hover:w-5" />
            <span className="eyebrow whitespace-nowrap text-[0.5rem] tracking-[0.3em] text-fg/50 transition-colors duration-500 group-hover:text-gold/90">
              Chef &amp; Owner · Angel
            </span>
          </span>
        </span>
      )}
    </Link>
  );
}
