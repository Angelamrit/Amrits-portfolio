"use client";

import { m, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";
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

function Word({ progress, index, total, gold, children }: { progress: MotionValue<number>; index: number; total: number; gold: boolean; children: string }) {
  const start = index / total;
  const end = start + 1 / total;
  const opacity = useTransform(progress, [start, end], [0.16, 1]);
  const y = useTransform(progress, [start, end], [6, 0]);
  return (
    <m.span style={{ opacity, y }} className={cn("inline-block will-change-[opacity,transform]", gold && "text-gold-gradient font-normal italic")}>
      {children}&nbsp;
    </m.span>
  );
}

/** Scroll-driven manifesto: each word lights up as the reader scrolls through it. */
export function Manifesto() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.45"] });

  return (
    <Section id="manifesto" tone="deep" orbs="gold" pattern grain>
      <Container>
        <div ref={ref} className="mx-auto max-w-5xl py-6 md:py-12">
          <Eyebrow align="center">The rule he cooks by</Eyebrow>
          <p className="mt-10 text-center font-display text-display-md font-light leading-[1.12] text-fg md:text-display-lg md:leading-[1.08]">
            {reduce
              ? words.map((x, i) => (
                  <span key={i} className={cn("inline-block", x.gold && "text-gold-gradient font-normal italic")}>
                    {x.w}&nbsp;
                  </span>
                ))
              : words.map((x, i) => (
                  <Word key={i} progress={scrollYProgress} index={i} total={words.length} gold={x.gold}>
                    {x.w}
                  </Word>
                ))}
          </p>
          <p className="mt-10 text-center eyebrow text-muted">Chef Amrit Pal Singh · Owner &amp; Head Chef, Angel Indian Restaurant</p>
        </div>
      </Container>
    </Section>
  );
}
