import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { PencilLine, Star } from "lucide-react";
import { dietaryLabels } from "@/components/ui/Badge";
import { editedDishIds, getDishes } from "@/lib/content/dishes";
import { PageHeading } from "@/components/admin/PageHeading";

export const metadata: Metadata = { title: "Dishes" };

/**
 * Every dish, as a wall of photographs.
 *
 * A table of names would be faster to scan for a developer and useless for a
 * chef — he knows these by sight. The picture is the primary label, with the
 * name under it, which is also how they appear on the site.
 */
export default async function AdminDishesPage() {
  const [dishes, edited] = await Promise.all([getDishes(), editedDishIds()]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeading
        eyebrow="Content"
        title="Dishes"
        description="The dishes behind the menus and the signature showcase. Change a name, a description, the dietary tags or the photograph."
      />

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {dishes.map((dish) => (
          <li key={dish.id}>
            <Link
              href={`/admin/dishes/${dish.id}`}
              className="glass border-gradient spotlight group relative flex h-full flex-col overflow-hidden rounded-frame transition-shadow duration-700 ease-luxe hover:shadow-glow focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
            >
              <span className="relative block aspect-[4/3] overflow-hidden bg-sand">
                <Image
                  src={dish.image.src}
                  alt=""
                  fill
                  sizes="(min-width: 1280px) 22vw, (min-width: 640px) 45vw, 90vw"
                  className="object-cover transition-transform duration-[1400ms] ease-luxe group-hover:scale-105"
                />
                <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-charcoal/85 via-charcoal/10 to-transparent" />

                <span className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                  {dish.signature && (
                    <span className="inline-flex items-center gap-1 rounded-pill border border-gold/40 bg-charcoal/70 px-2 py-0.5 text-[0.58rem] uppercase tracking-[0.14em] text-gold-light backdrop-blur">
                      <Star aria-hidden className="size-2.5 fill-current" strokeWidth={0} />
                      Signature
                    </span>
                  )}
                  {edited.has(dish.id) && (
                    <span className="inline-flex items-center gap-1 rounded-pill border border-[#7fc39b]/40 bg-charcoal/70 px-2 py-0.5 text-[0.58rem] uppercase tracking-[0.14em] text-[#7fc39b] backdrop-blur">
                      <PencilLine aria-hidden className="size-2.5" strokeWidth={2} />
                      Edited
                    </span>
                  )}
                </span>

                <span className="absolute inset-x-3 bottom-2.5">
                  <span className="block truncate font-display text-[1.15rem] leading-tight text-ivory">{dish.name}</span>
                  <span className="mt-0.5 block truncate text-[0.7rem] text-ivory/55">{dish.tagline}</span>
                </span>
              </span>

              <span className="flex flex-wrap gap-1.5 p-4">
                {dish.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-pill border border-fg/12 px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.12em] text-fg/45"
                  >
                    {dietaryLabels[tag].label}
                  </span>
                ))}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
