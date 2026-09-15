"use client";

import { m, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = { children: ReactNode; amount?: number; className?: string };

/**
 * Background parallax: the child layer is oversized and drifts vertically
 * as its container scrolls through the viewport.
 */
export function Parallax({ children, amount = 70, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [-amount, amount]);

  return (
    <div ref={ref} aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <m.div className="absolute inset-[-12%]" style={{ y: reduce ? 0 : y }}>
        {children}
      </m.div>
    </div>
  );
}
