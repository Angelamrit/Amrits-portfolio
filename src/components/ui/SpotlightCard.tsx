import type { ComponentPropsWithoutRef, ElementType } from "react";
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
 *
 * Plain server-rendered markup: the light and the tilt are driven by one
 * delegated pointer listener in PageEffects, which reads `data-spotlight` and
 * `data-tilt`, so a page full of these cards costs no per-card JavaScript.
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
  return (
    <Comp
      data-spotlight=""
      data-tilt={tilt || undefined}
      className={cn(
        "spotlight rounded-frame transition-[transform,box-shadow,border-color] duration-700 ease-luxe",
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
