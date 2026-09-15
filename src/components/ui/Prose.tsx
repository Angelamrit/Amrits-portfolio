import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

type Props = ComponentPropsWithoutRef<"div"> & { size?: "base" | "lead"; tone?: "light" | "dark" };

export function Prose({ size = "base", tone = "dark", className, ...rest }: Props) {
  return (
    <div
      className={cn(
        "max-w-prose space-y-5 leading-relaxed",
        size === "lead" ? "text-lead" : "text-[1.0625rem]",
        tone === "dark" ? "text-fg/75" : "text-charcoal/80",
        className,
      )}
      {...rest}
    />
  );
}
