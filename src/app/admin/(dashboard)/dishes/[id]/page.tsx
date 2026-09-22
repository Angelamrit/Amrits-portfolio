import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { dishes as baseDishes } from "@/data/dishes";
import { editedDishIds, getDishById, imageChoices, imageKeyFor } from "@/lib/content/dishes";
import { DishEditor, type DishDraft } from "@/components/admin/DishEditor";
import { PageHeading } from "@/components/admin/PageHeading";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const dish = await getDishById(id);
  return { title: dish ? `Edit ${dish.name}` : "Dish" };
}

export default async function EditDishPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!baseDishes.some((dish) => dish.id === id)) notFound();

  const [dish, edited] = await Promise.all([getDishById(id), editedDishIds()]);
  if (!dish) notFound();

  const draft: DishDraft = {
    name: dish.name,
    tagline: dish.tagline,
    description: dish.description,
    tags: dish.tags as DishDraft["tags"],
    signature: dish.signature,
    order: dish.order,
    imageKey: imageKeyFor(dish) ?? "",
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link
          href="/admin/dishes"
          className="inline-flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.18em] text-fg/45 transition-colors duration-300 hover:text-gold"
        >
          <ArrowLeft aria-hidden className="size-3.5" strokeWidth={1.8} />
          All dishes
        </Link>
      </div>

      <PageHeading
        eyebrow="Editing a dish"
        title={dish.name}
        description="Changes go live on the site as soon as they are saved."
      >
        <Link
          href="/menus"
          target="_blank"
          rel="noreferrer"
          className="glass inline-flex shrink-0 items-center gap-2 rounded-pill px-4 py-2.5 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-fg/70 transition-colors duration-300 hover:text-gold-light"
        >
          <ExternalLink aria-hidden className="size-3.5" strokeWidth={1.8} />
          See it on the site
        </Link>
      </PageHeading>

      <DishEditor id={dish.id} initial={draft} images={imageChoices} isEdited={edited.has(dish.id)} />
    </div>
  );
}
