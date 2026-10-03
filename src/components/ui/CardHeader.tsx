import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Eyebrow title and a glowing icon disc that brightens on hover. The parent
 * card must carry `group/card` for the hover states to trigger. `size="lg"`
 * sets the title larger, for cards read from further away (the footer's).
 */
export function CardHeader({
  id,
  title,
  icon,
  size = "md",
}: {
  id?: string;
  title: string;
  icon: ReactNode;
  size?: "md" | "lg";
}) {
  return (
    <div className="relative flex items-center justify-between gap-4">
      <h3 id={id} className={cn("eyebrow", size === "lg" && "text-[0.875rem] leading-snug tracking-[0.2em]")}>
        {title}
      </h3>
      <span
        aria-hidden
        className="grid size-11 shrink-0 place-items-center rounded-full border border-gold/30 bg-gold/10 text-gold shadow-[0_0_24px_-6px_rgba(226,189,108,0.7)] transition-all duration-500 ease-luxe group-hover/card:border-gold/70 group-hover/card:bg-gold/20 group-hover/card:text-gold-light group-hover/card:shadow-glow"
      >
        {icon}
      </span>
    </div>
  );
}
