import { Badge, dietaryLabels } from "@/components/ui/Badge";
import type { DietaryTag } from "@/types/content";

const order: DietaryTag[] = ["vegetarian", "vegan", "gluten-free", "halal", "dairy", "contains-nuts"];

/** The dietary abbreviations used on every course, as glass tiles. */
export function DietaryLegend() {
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {order.map((t) => (
        <div key={t} className="glass flex items-center gap-3 rounded-frame px-4 py-3.5 transition-all duration-500 hover:border-gold/60 hover:shadow-glow">
          <dt>
            <Badge tone="gold" className="px-2.5 py-1">
              {dietaryLabels[t].short}
            </Badge>
          </dt>
          <dd className="text-xs text-fg/80">{dietaryLabels[t].label}</dd>
        </div>
      ))}
    </dl>
  );
}
