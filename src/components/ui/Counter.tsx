"use client";

import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

type Props = { to: number; prefix?: string; suffix?: string; duration?: number; className?: string; separator?: boolean };

/** Counts up from 0 when scrolled into view. */
export function Counter({ to, prefix = "", suffix = "", duration = 1.8, className, separator = false }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();
  const [value, setValue] = useState(reduce ? to : 0);

  useEffect(() => {
    if (!inView || reduce) return;
    const controls = animate(0, to, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setValue(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, to, duration, reduce]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {separator ? value.toLocaleString() : String(value)}
      {suffix}
    </span>
  );
}
