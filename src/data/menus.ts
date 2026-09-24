import type { Menu } from "@/types/content";
import { images } from "./images";

/**
 * Menus are built only from dishes the chef actually serves.
 * Courses marked `status: "draft"` are shown as "to be confirmed with Chef"
 * and must be finalised with Chef Amrit before launch.
 */
export const menus: Menu[] = [
  {
    slug: "tasting",
    name: "Chef's Tasting Menu",
    kind: "tasting",
    courseCount: 7,
    courseLabel: "7 Courses",
    intro:
      "Served at Angel's new upscale location, the tasting menu is Chef Amrit's own journey: from the street food of India to slow-cooked regional delicacies, told across seven courses.",
    courses: [
      { title: "Welcome", dishId: "chole-bhatura", status: "confirmed" },
      { title: "Paneer", dishId: "amritsari-paneer-kulcha", status: "confirmed" },
      { title: "Potato", dishId: "amritsari-aloo-kulcha", status: "confirmed" },
      { title: "Vegetable", dishId: "mix-veg-kulcha", status: "confirmed" },
      { title: "Rice", dishId: "vegetable-dum-biryani", status: "confirmed" },
      { title: "Chicken", dishId: "chicken-dum-biryani", status: "confirmed" },
      { title: "Goat", dishId: "goat-dum-biryani", status: "confirmed" },
    ],
    notes: [
      "Predominantly vegetarian. 100% Halal.",
      "Dinner only, at Angel's new location. Reservations via Resy.",
      "Please let your server know about any dietary requirements.",
    ],
    venue: "At Angel · New dining room",
    featured: true,
    image: images.thaliOverhead,
  },
  {
    slug: "house-specialties",
    name: "House Specialties",
    kind: "specialties",
    courseCount: 5,
    courseLabel: "Family Style",
    intro:
      "The dishes that built Angel's reputation in Jackson Heights, served to share. Bold, honest and rooted in India.",
    courses: [
      { title: "Chole", dishId: "chole-bhatura", status: "confirmed" },
      { title: "Kulcha", dishId: "amritsari-paneer-kulcha", status: "confirmed" },
      { title: "Biryani", dishId: "vegetable-dum-biryani", status: "confirmed" },
      { title: "Chicken", dishId: "chicken-dum-biryani", status: "confirmed" },
      { title: "Goat", dishId: "goat-dum-biryani", status: "confirmed" },
    ],
    notes: ["Predominantly vegetarian. 100% Halal.", "Breads and rice are served alongside."],
    venue: "At Angel · Jackson Heights",
    featured: true,
    image: images.karahi,
  },
];

export const featuredMenus = menus.filter((m) => m.featured);
export const menuBySlug = (slug: string) => menus.find((m) => m.slug === slug);
