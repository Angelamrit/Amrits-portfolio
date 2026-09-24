import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getMenus } from "@/lib/content/menus";
import { getDishes } from "@/lib/content/dishes";
import { getVenue } from "@/lib/content/venue";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading, Em } from "@/components/ui/Heading";
import { ImageFrame } from "@/components/ui/ImageFrame";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SpotlightCard } from "@/components/ui/SpotlightCard";

/** Chapter 04: every menu, presented like a printed menu card with its courses listed. */
export async function MenusPreview() {
  const [menus, dishes, venue] = await Promise.all([getMenus(), getDishes(), getVenue()]);
  const dishById = (id: string) => dishes.find((dish) => dish.id === id);

  return (
    <Section id="menus" tone="raised" orbs="ember" divider className="scroll-mt-20">
      <Container>
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between md:[&>*:last-child]:shrink-0">
          <div className="max-w-3xl">
            <Reveal>
              <Eyebrow>04 · Menus</Eyebrow>
            </Reveal>
            <Reveal delay={0.1}>
              <Heading as="h2" size="lg" className="mt-8">
                Two menus, <Em shimmer>course by course.</Em>
              </Heading>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="mt-8 max-w-xl text-lead text-fg/65">
                Both served every night at Angel: the seven-course tasting menu and the house specialties.
              </p>
            </Reveal>
          </div>
          {venue.menuUrl && (
            <Reveal delay={0.2}>
              <Button href={venue.menuUrl} external>
                Full menu at Angel
              </Button>
            </Reveal>
          )}
        </div>

        <RevealGroup className="mt-16 grid gap-6 lg:grid-cols-2">
          {menus.map((menu, mi) => (
            <RevealItem key={menu.slug}>
              <SpotlightCard as="article" className="group relative flex h-full flex-col overflow-hidden p-3" tilt={3}>
                <Link href={`/menus?menu=${menu.slug}`} className="absolute inset-0 z-[4]" aria-label={`View the ${menu.name}`} />
                <div className="relative aspect-[16/9] overflow-hidden rounded-[calc(var(--radius-frame)-0.25rem)]">
                  <ImageFrame image={menu.image} ratio="fill" hover reveal="none" sizes="(min-width: 1024px) 50vw, 100vw" />
                  <div aria-hidden className="absolute inset-0 z-[1] bg-gradient-to-t from-surface-2 via-surface-2/20 to-transparent" />
                  <Badge tone="solid" className="absolute left-4 top-4 z-[2]">
                    {menu.courseLabel}
                  </Badge>
                  <span aria-hidden className="absolute right-4 top-1 z-[2] font-display text-[4.5rem] leading-none text-outline-gold">
                    {String(mi + 1).padStart(2, "0")}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-5 text-center md:p-6">
                  <p className="eyebrow text-[0.58rem] text-gold-light/80">{menu.venue}</p>
                  <h3 className="mt-3 font-display text-display-sm font-light transition-colors duration-300 group-hover:text-gold-light">{menu.name}</h3>
                  <span aria-hidden className="hairline-center mx-auto my-5 w-2/3" />
                  <ol className="space-y-2.5 text-left">
                    {menu.courses.map((c, i) => {
                      const name = c.name ?? (c.dishId ? dishById(c.dishId)?.name : undefined);
                      const draft = c.status === "draft";
                      return (
                        <li key={`${menu.slug}-${i}`} className="grid grid-cols-[1.75rem_1fr] items-baseline gap-2 text-sm">
                          <span className="font-display text-base text-gold-gradient">{String(i + 1).padStart(2, "0")}</span>
                          <span className="leading-snug">
                            <span className={draft ? "italic text-fg/55" : "text-fg"}>{name ?? (draft ? "Chef's seasonal course" : c.title)}</span>
                            <span className="text-fg/45"> · {c.title}</span>
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                  <div className="mt-auto flex items-center justify-between gap-4 pt-6">
                    <span className="eyebrow max-w-[70%] text-[0.58rem] leading-relaxed text-muted">
                      {menu.notes[0]}
                    </span>
                    <span className="glass grid size-10 shrink-0 place-items-center rounded-full text-gold-light transition-all duration-500 group-hover:bg-gold group-hover:text-charcoal">
                      <ArrowUpRight aria-hidden className="size-4" strokeWidth={1.5} />
                    </span>
                  </div>
                </div>
              </SpotlightCard>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </Section>
  );
}
