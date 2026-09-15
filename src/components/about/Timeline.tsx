import type { TimelineEntry } from "@/types/content";
import { Reveal } from "@/components/ui/Reveal";
import { SpotlightCard } from "@/components/ui/SpotlightCard";

export function Timeline({ entries }: { entries: TimelineEntry[] }) {
  return (
    <ol className="relative pl-10 md:pl-14">
      <span aria-hidden className="absolute left-[0.6rem] top-2 h-full w-px bg-gradient-to-b from-gold via-gold/30 to-transparent md:left-[0.85rem]" />
      {entries.map((entry, i) => (
        <li key={entry.title} className="relative pb-8 last:pb-0">
          <span className="absolute -left-10 top-6 grid size-5 place-items-center md:-left-14 md:size-7">
            <span aria-hidden className="absolute inset-0 rounded-full bg-gold/40 blur-[6px] animate-pulse-glow" />
            <span className="relative size-2.5 rounded-full bg-gradient-to-br from-gold-light to-gold shadow-[0_0_14px_rgba(201,169,98,1)]" />
          </span>
          <Reveal delay={i * 0.05}>
            <SpotlightCard className="p-6 md:p-8" tilt={2}>
              <p className="eyebrow">{entry.year}</p>
              <h3 className="mt-3 font-display text-display-sm font-light text-gold-gradient">{entry.title}</h3>
              <p className="mt-3 max-w-lg leading-relaxed text-fg/70">{entry.body}</p>
            </SpotlightCard>
          </Reveal>
        </li>
      ))}
    </ol>
  );
}
