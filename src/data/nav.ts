import type { NavItem } from "@/types/content";

/**
 * Navigation follows the story of the portfolio:
 * who he is → where he cooks → what he cooks → proof → contact.
 */
export const nav: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "The Chef", href: "/about" },
  { label: "Angel", href: "/angel" },
  { label: "Menu", href: "/menus" },
  { label: "Gallery", href: "/gallery" },
  { label: "Press", href: "/press" },
  // Journal moves into the header once the first articles are published.
  { label: "Journal", href: "/journal", secondary: true },
  // Enable once genuine client testimonials are available.
  { label: "Testimonials", href: "/testimonials", hidden: true },
  { label: "Contact", href: "/contact" },
];

/** Everything that is not hidden: footer and mobile menu. */
export const visibleNav = nav.filter((item) => !item.hidden);

/** Desktop header: the main chapters only. */
export const primaryNav = visibleNav.filter((item) => !item.secondary);
