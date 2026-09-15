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
      "Served at Angel's new upscale location, the tasting menu is Chef Amrit's own journey: from the street food of Punjab to slow-cooked regional delicacies, told across seven courses.",
    courses: [
      { title: "Welcome", dishId: "dahi-batata-puri", status: "confirmed" },
      { title: "Fritter", dishId: "kale-pakora", status: "confirmed" },
      { title: "Vegetable", dishId: "lassuni-gobi", status: "confirmed" },
      { title: "Paneer", dishId: "housemade-paneer", status: "confirmed" },
      { title: "Rice", dishId: "vegetable-dum-biryani", status: "confirmed" },
      { title: "Regional Course", status: "draft", description: "A seasonal regional delicacy, chosen by Chef." },
      { title: "Sweet", status: "draft", description: "Dessert course to be confirmed with Chef." },
    ],
    notes: [
      "Predominantly vegetarian. 100% Halal.",
      "Dinner only, at Angel's new location. Reservations via Resy.",
      "Please share dietary requirements when booking.",
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
      "The dishes that built Angel's reputation in Jackson Heights, served to share. Bold, honest and rooted in Punjab.",
    courses: [
      { title: "Chaat", dishId: "dahi-batata-puri", status: "confirmed" },
      { title: "Pakora", dishId: "kale-pakora", status: "confirmed" },
      { title: "Gobi", dishId: "lassuni-gobi", status: "confirmed" },
      { title: "Paneer", dishId: "housemade-paneer", status: "confirmed" },
      { title: "Biryani", dishId: "vegetable-dum-biryani", status: "confirmed" },
    ],
    notes: ["Predominantly vegetarian. 100% Halal.", "Breads and rice are served alongside."],
    venue: "At Angel · Jackson Heights",
    featured: true,
    image: images.karahi,
  },
  {
    slug: "private-event",
    name: "Private Event Menu",
    kind: "event",
    courseCount: 4,
    courseLabel: "Bespoke, 4 Movements",
    intro:
      "A framework for private dining, dinner parties and celebrations. Chef Amrit designs each menu around your guests, the season and your setting.",
    courses: [
      { title: "Street Food Welcome", status: "confirmed", name: "Chaat & Pakora", description: "Passed bites drawn from Angel's street-food canon, such as Dahi Batata Puri and Kale Pakora." },
      { title: "From the Tandoor", status: "confirmed", name: "Housemade Paneer & Vegetables", description: "Charred in the tandoor and served with fresh breads." },
      { title: "The Table", status: "confirmed", name: "Regional Delicacies & Dum Biryani", description: "Slow-cooked centrepieces served family style, including Lassuni Gobi and Vegetable Dum Biryani." },
      { title: "Sweet & Chai", status: "draft", description: "Dessert course designed with Chef for the occasion." },
    ],
    notes: [
      "Fully customisable. Predominantly vegetarian, 100% Halal, with vegan and gluten-free options.",
      "Suitable for 8 to 200 guests.",
    ],
    venue: "Private dining & events",
    featured: false,
    image: images.tableCandles,
  },
];

export const featuredMenus = menus.filter((m) => m.featured);
export const menuBySlug = (slug: string) => menus.find((m) => m.slug === slug);
