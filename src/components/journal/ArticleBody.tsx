import type { ArticleBlock } from "@/types/content";
import { ImageFrame } from "@/components/ui/ImageFrame";

export function ArticleBody({ blocks }: { blocks: ArticleBlock[] }) {
  return (
    <div className="mx-auto max-w-prose space-y-7 text-[1.0625rem] leading-relaxed text-fg/80">
      {blocks.map((b, i) => {
        switch (b.type) {
          case "h2":
            return (
              <h2 key={i} className="pt-6 font-display text-display-sm font-light text-gold-gradient">
                {b.text}
              </h2>
            );
          case "quote":
            return (
              <blockquote key={i} className="glass rounded-frame border-l-2 border-l-gold px-6 py-5 font-display text-2xl font-light italic text-fg">
                {b.text}
                {b.by && <footer className="mt-3 eyebrow not-italic">{b.by}</footer>}
              </blockquote>
            );
          case "image":
            return (
              <div key={i} className="py-4">
                <ImageFrame image={b.image} ratio="3/2" glow sizes="(min-width: 768px) 42rem, 100vw" />
              </div>
            );
          default:
            return <p key={i}>{b.text}</p>;
        }
      })}
    </div>
  );
}
