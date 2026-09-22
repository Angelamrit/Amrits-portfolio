import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, PencilLine, Star } from "lucide-react";
import { getMenus, editedMenuSlugs } from "@/lib/content/menus";
import { PageHeading } from "@/components/admin/PageHeading";

export const metadata: Metadata = { title: "Menus" };

/**
 * The menus, as a list to choose from.
 *
 * Three menus is not many, but a list rather than one long page is still the
 * right shape: it keeps each editor short enough to hold in mind, and it
 * gives the chef a place that answers "which of these have I changed?" at a
 * glance, which a single combined form could not.
 */
export default async function AdminMenusPage() {
  const [menus, edited] = await Promise.all([getMenus(), editedMenuSlugs()]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeading
        eyebrow="Content"
        title="Menus"
        description="The three menus shown on the site. Change the wording, the courses and the order they appear in."
      />

      <ul className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {menus.map((menu) => (
          <li key={menu.slug}>
            <Link
              href={`/admin/menus/${menu.slug}`}
              className="glass border-gradient spotlight group relative flex h-full flex-col overflow-hidden rounded-frame transition-shadow duration-700 ease-luxe hover:shadow-glow focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
            >
              <span className="relative block aspect-[16/9] overflow-hidden bg-sand">
                <Image
                  src={menu.image.src}
                  alt=""
                  fill
                  sizes="(min-width: 1280px) 30vw, (min-width: 1024px) 45vw, 90vw"
                  className="object-cover transition-transform duration-[1400ms] ease-luxe group-hover:scale-105"
                />
                <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/40 to-transparent" />

                <span className="absolute inset-x-4 bottom-3 flex items-end justify-between gap-3">
                  <span className="min-w-0">
                    <span className="eyebrow block text-[0.55rem] text-gold-light/80">{menu.venue}</span>
                    <span className="mt-1 block truncate font-display text-[1.35rem] leading-tight text-ivory">
                      {menu.name}
                    </span>
                  </span>
                  <span className="glass grid size-9 shrink-0 place-items-center rounded-full text-gold-light transition-all duration-500 group-hover:bg-gold group-hover:text-charcoal">
                    <ArrowUpRight aria-hidden className="size-4" strokeWidth={1.5} />
                  </span>
                </span>
              </span>

              <span className="flex flex-1 flex-col gap-3 p-5">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="rounded-pill border border-fg/15 px-2.5 py-1 text-[0.62rem] uppercase tracking-[0.14em] text-fg/55">
                    {menu.courseCount} {menu.courseCount === 1 ? "course" : "courses"}
                  </span>
                  {menu.featured && (
                    <span className="inline-flex items-center gap-1.5 rounded-pill border border-gold/35 bg-gold/10 px-2.5 py-1 text-[0.62rem] uppercase tracking-[0.14em] text-gold-light">
                      <Star aria-hidden className="size-2.5 fill-current" strokeWidth={0} />
                      On the home page
                    </span>
                  )}
                  {edited.has(menu.slug) && (
                    <span className="inline-flex items-center gap-1.5 rounded-pill border border-[#7fc39b]/35 bg-[#7fc39b]/10 px-2.5 py-1 text-[0.62rem] uppercase tracking-[0.14em] text-[#7fc39b]">
                      <PencilLine aria-hidden className="size-2.5" strokeWidth={2} />
                      Edited
                    </span>
                  )}
                </span>

                <span className="line-clamp-3 text-[0.82rem] leading-relaxed text-fg/50">{menu.intro}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
