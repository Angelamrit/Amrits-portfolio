"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useRef, useState, type MouseEvent } from "react";

/**
 * Live clock in the restaurant's time zone. Rendered after mount so the
 * server and client markup match; a dash holds the slot until then.
 */
export function LocalTime({ place }: { place: string }) {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/New_York",
      timeZoneName: "short",
    });
    const tick = () => setTime(fmt.format(new Date()));
    tick();
    const id = window.setInterval(tick, 15_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-sans text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-fg/50">
      <span aria-hidden className="relative grid size-2.5 place-items-center">
        <span className="absolute inset-0 rounded-full bg-gold opacity-60 animate-ping motion-reduce:animate-none" />
        <span className="relative size-1.5 rounded-full bg-gold-light shadow-[0_0_10px_rgba(240,217,160,0.9)]" />
      </span>
      <span>Local time · {place}</span>
      <span className="tabular-nums text-gold-light">{time ?? "—"}</span>
    </p>
  );
}

/** Scrolls smoothly back to the top. Styled to match the wordmark's struck monogram. */
export function BackToTop() {
  const onClick = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Back to top"
      className="group relative grid size-12 shrink-0 place-items-center rounded-full text-gold-light transition-colors duration-500 ease-luxe hover:text-charcoal focus-visible:outline-gold"
    >
      <svg viewBox="0 0 100 100" aria-hidden className="absolute inset-0 size-full text-gold/45 transition-colors duration-700 group-hover:text-gold">
        <circle
          cx="50"
          cy="50"
          r="47"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeDasharray="3 7"
          strokeLinecap="round"
          className="origin-center transition-transform duration-[2200ms] ease-luxe group-hover:-rotate-[200deg]"
        />
        <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="0.75" opacity="0.5" />
      </svg>
      <span
        aria-hidden
        className="absolute inset-[18%] rounded-full bg-gradient-to-br from-gold/22 via-gold/5 to-transparent transition-all duration-500 ease-luxe group-hover:from-gold-light group-hover:via-gold group-hover:to-gold-deep group-hover:shadow-[0_0_30px_-4px_rgba(226,189,108,0.95)]"
      />
      <ArrowUp aria-hidden className="relative size-4 transition-transform duration-500 ease-luxe group-hover:-translate-y-0.5" strokeWidth={1.75} />
    </button>
  );
}

/**
 * The chef's name set enormous and engraved in outline. A gold-gradient fill
 * follows the cursor through a radial mask, as if a lamp were passing over
 * brass. Touch devices see a soft static fill instead.
 */
export function SignatureName({ name, className }: { name: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  // The 3rem floor was wider than a 320px screen once the name is set on one
  // nowrap line, so it clipped mid-word; 2.25rem fits and the vw term takes
  // over by ~360px, leaving every larger size exactly as it was.
  const type = "whitespace-nowrap font-display text-[clamp(2.25rem,10.5vw,10.5rem)] font-light leading-[0.9] tracking-[-0.02em]";

  return (
    <div ref={ref} onMouseMove={onMove} aria-hidden className={`group/sig relative select-none overflow-hidden mask-fade-b ${className ?? ""}`}>
      <p className={`${type} text-outline-gold opacity-70`}>{name}</p>
      <p
        className={`${type} text-gold-gradient absolute inset-0 opacity-0 transition-opacity duration-700 ease-luxe group-hover/sig:opacity-100 [mask-image:radial-gradient(300px_circle_at_var(--mx,50%)_var(--my,50%),#000,transparent_72%)] [@media(hover:none)]:opacity-60 [@media(hover:none)]:[mask-image:none]`}
      >
        {name}
      </p>
    </div>
  );
}
