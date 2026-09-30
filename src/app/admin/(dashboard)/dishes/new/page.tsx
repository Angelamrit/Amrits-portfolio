import type { Metadata } from "next";
import { getImageChoices } from "@/lib/content/dishes";
import { BackLink } from "@/components/admin/BackLink";
import { DishEditor, type DishDraft } from "@/components/admin/DishEditor";
import { PageHeading } from "@/components/admin/PageHeading";

export const metadata: Metadata = { title: "Add a dish" };

/**
 * A new dish starts as a signature dish, shown on the website: a dish that is
 * neither in the showcase nor in a menu appears nowhere, and a chef adding a
 * dish almost always wants guests to see it. Both are one switch away.
 */
const blank: DishDraft = {
  name: "",
  tagline: "",
  description: "",
  tags: [],
  signature: true,
  visible: true,
  imageKey: "",
};

export default async function NewDishPage() {
  const images = await getImageChoices();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <BackLink href="/admin/dishes">All dishes</BackLink>
      </div>

      <PageHeading
        eyebrow="Your website"
        title="Add a dish"
        description="Give it a name and a photograph — that is all it needs. It goes onto the website as soon as you press Add dish."
      />

      <DishEditor mode="create" initial={blank} images={images} inMenus={[]} />
    </div>
  );
}
