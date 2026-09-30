import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getDishesForAdmin } from "@/lib/content/dishes";
import { menuCoursesUsing, whereDishAppears } from "@/lib/content/dish-usage";
import { getMenus } from "@/lib/content/menus";
import { DishList } from "@/components/admin/DishList";
import { PageHeading } from "@/components/admin/PageHeading";

export const metadata: Metadata = { title: "Dishes" };

/**
 * The dishes, as one list the chef can run the whole screen from.
 *
 * Adding a dish, switching it on or off the website or into the signature
 * showcase, and moving it up or down all happen here without opening
 * anything. Opening a dish is for its words and its photograph.
 */
export default async function AdminDishesPage({
  searchParams,
}: {
  searchParams: Promise<{ added?: string; deleted?: string }>;
}) {
  const [{ added, deleted }, dishes, menus] = await Promise.all([searchParams, getDishesForAdmin(), getMenus()]);

  const addedDish = typeof added === "string" ? dishes.find((dish) => dish.id === added) : undefined;
  const notice = addedDish
    ? { kind: "added" as const, id: addedDish.id, name: addedDish.name }
    : typeof deleted === "string" && deleted.length > 0
      ? { kind: "deleted" as const, name: deleted.slice(0, 90) }
      : undefined;

  return (
    <div className="flex flex-col gap-8">
      <PageHeading
        eyebrow="Your website"
        title="Dishes"
        description="Your dishes, in the order guests see them. Switch each one on or off the website, choose which lead the signature showcase, and use the arrows to reorder."
      >
        <Link
          href="/admin/dishes/new"
          className="btn-primary inline-flex shrink-0 items-center gap-2 rounded-pill px-6 py-3 font-sans text-[0.7rem] font-semibold uppercase tracking-[0.18em]"
        >
          <Plus aria-hidden className="size-4" strokeWidth={2} />
          Add a dish
        </Link>
      </PageHeading>

      <DishList
        // Re-keyed by the notice so a second "added" banner replaces the first.
        key={notice ? `${notice.kind}-${notice.name}` : "list"}
        notice={notice}
        dishes={dishes.map((dish) => ({
          id: dish.id,
          name: dish.name,
          tagline: dish.tagline,
          image: dish.image,
          tags: dish.tags,
          signature: dish.signature,
          hidden: dish.hidden,
          added: dish.added,
          edited: dish.edited,
          appears: whereDishAppears(dish, menus),
          inMenus: menuCoursesUsing(dish.id, menus),
        }))}
      />
    </div>
  );
}
