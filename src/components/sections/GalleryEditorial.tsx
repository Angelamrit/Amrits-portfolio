import Image from "next/image";
import { gallery } from "@/data/gallery";
import type { GalleryItem } from "@/types/content";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading, Em } from "@/components/ui/Heading";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";

function Strip({ items, reverse = false }: { items: GalleryItem[]; reverse?: boolean }) {
  const track = [...items, ...items];
  return (
    <div className="mask-fade-x overflow-hidden">
      <ul
        aria-hidden
        className={cn(
          "flex w-max gap-4 [animation-duration:90s] hover:[animation-play-state:paused] motion-reduce:animate-none",
          reverse ? "animate-marquee-reverse" : "animate-marquee",
        )}
      >
        {track.map((g, i) => (
          <li
            key={`${g.id}-${i}`}
            className={cn(
              "tone-dark group relative h-52 shrink-0 overflow-hidden rounded-frame bg-sand md:h-72",
              g.span === "wide" ? "w-80 md:w-[28rem]" : g.span === "tall" ? "w-44 md:w-56" : "w-64 md:w-80",
            )}
          >
            <Image
              src={g.image.src}
              alt=""
              fill
              sizes="(min-width: 768px) 28rem, 20rem"
              className="object-cover transition-transform duration-[1400ms] ease-luxe group-hover:scale-[1.06]"
            />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-brown-deep/80 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            {g.caption && (
              <span className="glass absolute bottom-3 left-3 translate-y-3 rounded-pill px-3 py-1.5 eyebrow text-[0.55rem] text-fg opacity-0 transition-all duration-500 ease-luxe group-hover:translate-y-0 group-hover:opacity-100">
                {g.caption}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Chapter 05: a two-row cinematic film strip of the kitchen, the plates and the tables. */
export async function GalleryEditorial() {
  const rowA = gallery.slice(0, 9);
  const rowB = gallery.slice(9, 18);
  return (
    <Section id="gallery" tone="base" orbs="subtle" divider className="scroll-mt-20">
      <Container>
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between md:[&>*:last-child]:shrink-0">
          <div className="max-w-3xl">
            <Reveal>
              <Eyebrow>05 · Gallery</Eyebrow>
            </Reveal>
            <Reveal delay={0.1}>
              <Heading as="h2" size="lg" className="mt-8">
                The plates, the tables, <Em shimmer>and the hands behind them.</Em>
              </Heading>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="mt-8 max-w-xl text-lead text-fg/65">
                Signature dishes, the dining rooms, celebrations and the quiet work of the kitchen before service.
              </p>
            </Reveal>
          </div>
          <Reveal delay={0.2}>
            <Button href="/gallery" variant="glass">
              Open the full gallery
            </Button>
          </Reveal>
        </div>
      </Container>

      <Reveal delay={0.2} className="mt-16 space-y-4">
        <Strip items={rowA} />
        <Strip items={rowB} reverse />
      </Reveal>
    </Section>
  );
}
