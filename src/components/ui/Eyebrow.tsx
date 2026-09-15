import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = {
  children: ReactNode;
  className?: string;
  rule?: boolean;
  align?: "left" | "center";
  as?: "p" | "span" | "div";
};

export function Eyebrow({ children, className, rule = true, align = "left", as = "p" }: Props) {
  const Comp = as;
  return (
    <Comp className={cn("eyebrow flex items-center gap-4", align === "center" && "justify-center", className)}>
      {rule && <span aria-hidden className="hairline-full inline-block w-8 shrink-0" />}
      <span>{children}</span>
      {rule && align === "center" && <span aria-hidden className="hairline-full inline-block w-8 shrink-0" />}
    </Comp>
  );
}
