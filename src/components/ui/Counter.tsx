"use client";

import { useEffect, useRef, useState } from "react";

type Props = { to: number; prefix?: string; suffix?: string; duration?: number; className?: string; separator?: boolean };

const easeOut = (t: number) => 1 - Math.pow(1 - t, 4);

/**
 * A number that counts up when it scrolls into view.
 *
 * The real value is what is rendered on the server, so the first paint, search
 * engines and anyone without JavaScript see "2019", not "0". Only a counter
 * that starts below the fold is reset and counted up when it arrives; one that
 * is already on screen when the page loads just stays put.
 */
export function Counter({ to, prefix = "", suffix = "", duration = 1.8, className, separator = false }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(to);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight) return;

    let frame = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / (duration * 1000));
          setValue(Math.round(to * easeOut(t)));
          if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.6 },
    );
    // Reset only once it is certain the count will play.
    setValue(0);
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [to, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {separator ? value.toLocaleString("en-US") : String(value)}
      {suffix}
    </span>
  );
}
