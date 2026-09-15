import { Plus } from "lucide-react";
import { cn } from "@/lib/cn";

type Item = { q: string; a: string };

export function Accordion({ items, className }: { items: Item[]; className?: string; tone?: "light" | "dark" }) {
  return (
    <div className={cn("space-y-3", className)}>
      {items.map((item) => (
        <details key={item.q} className="group rounded-frame glass px-6 transition-colors open:border-gold/40">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 font-display text-xl font-normal [&::-webkit-details-marker]:hidden">
            <span>{item.q}</span>
            <span className="grid size-8 shrink-0 place-items-center rounded-full border border-gold/40 text-gold transition-transform duration-500 ease-luxe group-open:rotate-45 group-open:bg-gold group-open:text-charcoal">
              <Plus aria-hidden className="size-3.5" strokeWidth={1.75} />
            </span>
          </summary>
          <p className="max-w-prose pb-6 leading-relaxed text-fg/70">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
