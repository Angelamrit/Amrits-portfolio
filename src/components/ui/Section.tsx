import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";
import { Orbs } from "./Orbs";

type Tone = "base" | "raised" | "deep" | "ivory" | "transparent";
type Padding = "default" | "tight" | "none";

const tones: Record<Tone, string> = {
  base: "bg-bg tone-gold",
  raised: "bg-brown tone-dark",
  deep: "bg-brown-deep tone-dark",
  ivory: "bg-ivory tone-gold",
  transparent: "",
};

const paddings: Record<Padding, string> = {
  default: "py-section",
  tight: "py-section-sm",
  none: "",
};

type Props = ComponentPropsWithoutRef<"section"> & {
  tone?: Tone;
  padding?: Padding;
  orbs?: "gold" | "ember" | "mixed" | "subtle" | false;
  pattern?: boolean;
  grain?: boolean;
  divider?: boolean;
};

export function Section({
  tone = "base",
  padding = "default",
  orbs = false,
  pattern = false,
  grain = false,
  divider = false,
  className,
  children,
  ...rest
}: Props) {
  return (
    <section
      data-tone={tone}
      // overflow-clip (not hidden) keeps sticky children working while containing the orbs
      className={cn("relative overflow-clip", tones[tone], paddings[padding], grain && "grain", className)}
      {...rest}
    >
      {divider && <span aria-hidden className="hairline-center absolute inset-x-0 top-0 z-[2]" />}
      {(orbs || pattern) && <Orbs variant={orbs || "subtle"} pattern={pattern} className={!orbs ? "[&>span]:hidden" : undefined} />}
      <div className="relative z-[2]">{children}</div>
    </section>
  );
}
