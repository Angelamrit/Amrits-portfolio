import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Size = "xl" | "lg" | "md" | "sm";

const sizes: Record<Size, string> = {
  xl: "text-display-xl",
  lg: "text-display-lg",
  md: "text-display-md",
  sm: "text-display-sm",
};

type Props = {
  as?: "h1" | "h2" | "h3" | "h4" | "p";
  size?: Size;
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<"h1">, "children">;

export function Heading({ as = "h2", size = "md", className, children, ...rest }: Props) {
  const Comp = as as ElementType;
  return (
    <Comp className={cn("font-display font-light tracking-[-0.01em] text-balance", sizes[size], className)} {...rest}>
      {children}
    </Comp>
  );
}

/** Gold-gradient italic accent inside a Heading. */
export function Em({ children, className, shimmer = false }: { children: ReactNode; className?: string; shimmer?: boolean }) {
  return (
    <em className={cn("font-display font-normal italic", shimmer ? "text-shimmer" : "text-gold-gradient", className)}>
      {children}
    </em>
  );
}
