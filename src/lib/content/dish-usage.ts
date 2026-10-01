import type { Menu } from "@/types/content";

/**
 * Where a dish shows up on the website, in words the chef uses.
 *
 * The dashboard's most common question about a dish is "if I change this,
 * where will people see it?" — and the honest answer is spread over three
 * pages: the home page's signature showcase, the Angel page, and any menu
 * whose course points at the dish. This gathers it in one place, with a link
 * to each, so the answer is on the screen rather than in the chef's memory.
 */

export type Appearance = { label: string; href: string };

/** Menu courses that point at the dish, whether or not the dish is currently shown. */
export function menuCoursesUsing(dishId: string, menus: Menu[]): Appearance[] {
  const found: Appearance[] = [];
  for (const menu of menus) {
    menu.courses.forEach((course, index) => {
      if (course.dishId === dishId) found.push({ label: `${menu.name} · course ${index + 1}`, href: `/menus?menu=${menu.slug}` });
    });
  }
  return found;
}

export function whereDishAppears(dish: { id: string; signature: boolean; hidden: boolean }, menus: Menu[]): Appearance[] {
  if (dish.hidden) return [];
  return [
    ...(dish.signature
      ? [
          { label: "Home page", href: "/#signature-dishes" },
          { label: "Angel page", href: "/angel" },
        ]
      : []),
    ...menuCoursesUsing(dish.id, menus),
  ];
}
