import type { DietaryTag } from "@/types/content";
import { cn } from "@/lib/cn";

export const dietaryLabels: Record<DietaryTag, { short: string; label: string }> = {
  vegetarian: { short: "V", label: "Vegetarian" },
  vegan: { short: "VG", label: "Vegan" },
  "gluten-free": { short: "GF", label: "Gluten-free" },
  "contains-nuts": { short: "N", label: "Contains nuts" },
  halal: { short: "H", label: "Halal" },
  dairy: { short: "D", label: "Contains dairy" },
};

type Props = {
  children: React.ReactNode;
  tone?: "light" | "dark" | "gold" | "solid";
  className?: string;
  title?: string;
};

export function Badge({ children, tone = "dark", className, title }: Props) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center rounded-pill border px-3 py-1.5 font-sans text-[0.6rem] font-semibold uppercase tracking-[0.18em] backdrop-blur",
        tone === "dark" && "border-fg/12 bg-fg/[0.04] text-fg/75",
        tone === "light" && "border-charcoal/15 bg-charcoal/5 text-charcoal/75",
        tone === "gold" && "border-accent/50 bg-accent/10 text-accent shadow-[0_0_20px_-6px_rgba(226,189,108,0.5)]",
        tone === "solid" && "border-transparent bg-gradient-to-r from-gold-light to-gold text-charcoal",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function DietaryBadges({ tags, tone = "dark" }: { tags: DietaryTag[]; tone?: "light" | "dark" }) {
  if (!tags.length) return null;
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Dietary information">
      {tags.map((t) => (
        <li key={t}>
          <Badge tone={tone} title={dietaryLabels[t].label} className="px-2.5 py-1">
            {dietaryLabels[t].short}
          </Badge>
        </li>
      ))}
    </ul>
  );
}
