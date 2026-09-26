import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import type { Menu } from "@/types/content";
import { editedMenuSlugs, getMenuBySlug, menuSlugs } from "@/lib/content/menus";
import { getDishes } from "@/lib/content/dishes";
import { MenuEditor, type MenuDraft } from "@/components/admin/MenuEditor";
import { PageHeading } from "@/components/admin/PageHeading";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const menu = await getMenuBySlug(slug);
  return { title: menu ? `Edit ${menu.name}` : "Menu" };
}

/** The editor works in plain, fully-populated values; the patching happens on save. */
function toDraft(menu: Menu): MenuDraft {
  return {
    name: menu.name,
    courseLabel: menu.courseLabel,
    venue: menu.venue,
    intro: menu.intro,
    notes: [...menu.notes],
    featured: menu.featured,
    courses: menu.courses.map((course) => ({
      title: course.title,
      dishId: course.dishId,
      name: course.name,
      description: course.description,
      tags: course.tags as MenuDraft["courses"][number]["tags"],
      status: course.status,
    })),
  };
}

export default async function EditMenuPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!menuSlugs.includes(slug)) notFound();

  const [menu, dishes, edited] = await Promise.all([getMenuBySlug(slug), getDishes(), editedMenuSlugs()]);
  if (!menu) notFound();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link
          href="/admin/menus"
          className="inline-flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.18em] text-fg/45 transition-colors duration-300 hover:text-gold"
        >
          <ArrowLeft aria-hidden className="size-3.5" strokeWidth={1.8} />
          All menus
        </Link>
      </div>

      <PageHeading
        eyebrow="Editing a menu"
        title={menu.name}
        description="Changes go live on the site as soon as they are saved."
      >
        <Link
          href={`/menus?menu=${menu.slug}`}
          target="_blank"
          rel="noreferrer"
          className="glass inline-flex shrink-0 items-center gap-2 rounded-pill px-4 py-2.5 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-fg/70 transition-colors duration-300 hover:text-gold-light"
        >
          <ExternalLink aria-hidden className="size-3.5" strokeWidth={1.8} />
          See it on the site
        </Link>
      </PageHeading>

      <MenuEditor
        slug={menu.slug}
        initial={toDraft(menu)}
        dishes={dishes.map((dish) => ({ id: dish.id, name: dish.name }))}
        isEdited={edited.has(menu.slug)}
      />
    </div>
  );
}
