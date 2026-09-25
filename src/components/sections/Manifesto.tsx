import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Section } from "@/components/ui/Section";

/** The statement, split into phrases. Gold phrases are the ones to remember. */
const phrases: { text: string; gold?: boolean }[] = [
  { text: "Simple but good.", gold: true },
  { text: "Indian roots, bold flavours, and nothing on the plate that does not need to be there." },
  { text: "From a mother's kitchen in Pathankot" },
  { text: "to a Michelin Bib Gourmand in Queens,", gold: true },
  { text: "every dish still follows that one rule." },
];

const words = phrases.flatMap((p) => p.text.split(" ").map((w) => ({ w, gold: p.gold ?? false })));

/**
 * Scroll-driven manifesto: each word lights up, in reading order, as the reader
 * scrolls through the statement.
 *
 * This is a native CSS scroll-driven animation (see "Manifesto" in
 * globals.css): the paragraph is a view timeline and each word takes its own
 * slice of it. It used to be forty-odd script-driven words recomputed on every
 * scrolled frame; now it is a server component with no JavaScript at all.
 * Browsers without scroll timelines, and anyone with reduced motion, see the
 * statement fully lit.
 */
export function Manifesto() {
  return (
    <Section id="manifesto" tone="deep" orbs="gold" pattern grain>
      <Container>
        <div className="mx-auto max-w-5xl py-6 md:py-12">
          <Eyebrow align="center">The rule he cooks by</Eyebrow>
          <p
            className="manifesto mt-10 text-center font-display text-display-md font-light leading-[1.12] text-fg md:text-display-lg md:leading-[1.08]"
            style={{ "--n": words.length } as CSSProperties}
          >
            {words.map((x, i) => (
              <span
                key={i}
                className={cn("manifesto-word inline-block", x.gold && "text-gold-gradient font-normal italic")}
                style={{ "--i": i } as CSSProperties}
              >
                {x.w}&nbsp;
              </span>
            ))}
          </p>
          <p className="mt-10 text-center eyebrow text-muted">Chef Amrit Pal Singh · Owner &amp; Head Chef, Angel Indian Restaurant</p>
        </div>
      </Container>
    </Section>
  );
}
