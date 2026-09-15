import { Badge, dietaryLabels } from "@/components/ui/Badge";
import type { DietaryTag } from "@/types/content";

const order: DietaryTag[] = ["vegetarian", "vegan", "gluten-free", "halal", "dairy", "contains-nuts"];

export function DietaryLegend() {
  return (
    <dl className="flex flex-wrap gap-x-6 gap-y-3">
      {order.map((t) => (
        <div key={t} className="flex items-center gap-2">
          <dt>
            <Badge className="px-2.5 py-1">{dietaryLabels[t].short}</Badge>
          </dt>
          <dd className="text-xs text-muted">{dietaryLabels[t].label}</dd>
        </div>
      ))}
    </dl>
  );
}
