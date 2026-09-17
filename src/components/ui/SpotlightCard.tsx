"use client";

import { useReducedMotion } from "motion/react";
import { useRef, type ComponentPropsWithoutRef, type ElementType, type MouseEvent } from "react";
import { cn } from "@/lib/cn";

type Props<T extends ElementType> = {
  as?: T;
  tilt?: number;
  glass?: boolean;
  gradientBorder?: boolean;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className">;

/**
 * Card with a cursor-following spotlight and a subtle 3D tilt.
 * Sets --mx/--my for the `spotlight` utility and rotates on hover.
 */
export function SpotlightCard<T extends ElementType = "div">({
  as,
  tilt = 4,
  glass = true,
  gradientBorder = true,
  className,
  children,
  ...rest
}: Props<T>) {
  const Comp = (as ?? "div") as ElementType;
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  const onMove = (e: MouseEvent<HTMLElement>) => {
    const el = ref.current;
    if (!el) return;
    // A tap fires one mousemove and often no mouseleave, which would leave the
    // card tilted and its spotlight frozen mid-surface until the next render.
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    el.style.setProperty("--mx", `${x}px`);
    el.style.setProperty("--my", `${y}px`);
    if (reduce || tilt === 0) return;
    const rx = ((y / r.height) - 0.5) * -tilt;
    const ry = ((x / r.width) - 0.5) * tilt;
    el.style.transform = `perspective(1200px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`;
  };

  const onLeave = () => {
    const el = ref.current;
    if (el) el.style.transform = "";
  };

  return (
    <Comp
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={cn(
        "spotlight rounded-frame transition-[transform,box-shadow,border-color] duration-700 ease-luxe will-change-transform",
        glass && "glass",
        gradientBorder && "border-gradient",
        "hover:shadow-glow",
        className,
      )}
      {...rest}
    >
      {children}
    </Comp>
  );
}
