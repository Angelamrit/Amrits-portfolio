import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDishForAdmin, getImageChoices } from "@/lib/content/dishes";
import { menuCoursesUsing } from "@/lib/content/dish-usage";
import { getMenus } from "@/lib/content/menus";
import { BackLink } from "@/components/admin/BackLink";
import { DishEditor, type DishDraft } from "@/components/admin/DishEditor";
import { PageHeading } from "@/components/admin/PageHeading";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const dish = await getDishForAdmin(id);
  return { title: dish ? `Edit ${dish.name}` : "Dish" };
}

export default async function EditDishPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [dish, images, menus] = await Promise.all([getDishForAdmin(id), getImageChoices(), getMenus()]);
  if (!dish) notFound();

  const draft: DishDraft = {
    name: dish.name,
    tagline: dish.tagline,
    description: dish.description,
    tags: dish.tags as DishDraft["tags"],
    signature: dish.signature,
    visible: !dish.hidden,
    imageKey: dish.imageKey,
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <BackLink href="/admin/dishes">All dishes</BackLink>
      </div>

      <PageHeading
        eyebrow={dish.added ? "A dish you added" : "Editing a dish"}
        title={dish.name}
        description="Change the photograph, the words or where it appears. Guests see your changes as soon as you press Save."
      />

      <DishEditor
        // Re-mounted after a reset or a save that renames it, so every field starts from what was stored.
        key={dish.id}
        mode="edit"
        id={dish.id}
        initial={draft}
        images={images}
        canReset={dish.edited}
        canDelete={dish.added}
        inMenus={menuCoursesUsing(dish.id, menus)}
      />
    </div>
  );
}
