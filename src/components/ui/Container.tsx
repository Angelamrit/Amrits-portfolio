import type { ComponentPropsWithoutRef, ElementType } from "react";
import { cn } from "@/lib/cn";

type Size = "content" | "prose" | "wide" | "full";

const sizes: Record<Size, string> = {
  content: "max-w-content",
  prose: "max-w-prose",
  wide: "max-w-wide",
  full: "max-w-none",
};

type Props<T extends ElementType> = { as?: T; size?: Size } & ComponentPropsWithoutRef<T>;

export function Container<T extends ElementType = "div">({ as, size = "content", className, ...rest }: Props<T>) {
  const Comp = (as ?? "div") as ElementType;
  return <Comp className={cn("mx-auto w-full px-5 sm:px-8 lg:px-12", sizes[size], className)} {...rest} />;
}
