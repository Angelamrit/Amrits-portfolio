import type { Experience } from "@/types/content";
import { images } from "./images";

export const experiences: Experience[] = [
  {
    slug: "private-dining",
    name: "Private Dining",
    short: "A multi-course menu cooked and served by Chef Amrit at your home or chosen venue.",
    description: [
      "Chef Amrit brings the kitchen of Angel to your table. A personalised, multi-course menu, designed around your guests and cooked in front of them, from the first chaat to the last cup of chai.",
      "The menu is predominantly vegetarian and always Halal, moving from Punjabi street food to slow-cooked regional delicacies. Every dish is prepared the way it is at the restaurant: paneer made in-house, spices ground the same day.",
    ],
    idealFor: ["Intimate celebrations", "Family gatherings", "Milestone dinners"],
    includes: ["Consultation and bespoke menu", "Chef and service team", "All ingredients and equipment", "Full clean-up"],
    guestRange: "6 – 24 guests",
    image: images.tableCandles,
    faq: [
      { q: "Do you cook in our kitchen?", a: "Yes. A standard home kitchen is enough; Chef brings specialist equipment, including a portable tandoor where the venue allows." },
      { q: "Can the menu be fully vegan?", a: "Absolutely. Most of Angel's menu is vegetarian, and many dishes are naturally vegan or easily adapted." },
    ],
    order: 1,
  },
  {
    slug: "dinner-parties",
    name: "Dinner Parties",
    short: "Elegant dining for birthdays, anniversaries and private celebrations.",
    description: [
      "For the nights that matter, Chef Amrit designs a menu that feels like an event in itself. Shared plates from the tandoor, a slow-cooked centrepiece and a table that never runs quiet.",
      "Cocktail pairings and a full bar can be arranged, echoing the new Angel dining room.",
    ],
    idealFor: ["Birthdays", "Anniversaries", "Engagements"],
    includes: ["Menu design", "Chef and service", "Optional bar and pairings", "Set-up and clean-up"],
    guestRange: "8 – 40 guests",
    image: images.toast,
    order: 2,
  },
  {
    slug: "corporate-events",
    name: "Corporate Events",
    short: "Professional culinary experiences for companies, clients and executive dinners.",
    description: [
      "From boardroom lunches to client dinners and team celebrations, Chef Amrit delivers a Michelin Bib Gourmand standard with the discretion and reliability corporate hosts need.",
      "Menus accommodate every dietary requirement without compromising on flavour, and service is timed around your agenda.",
    ],
    idealFor: ["Client dinners", "Executive lunches", "Team celebrations", "Product launches"],
    includes: ["Dedicated event coordinator", "Menu tailored to dietary needs", "Professional service staff", "Invoicing and documentation"],
    guestRange: "10 – 200 guests",
    image: images.restaurantOverhead,
    order: 3,
  },
  {
    slug: "weddings",
    name: "Weddings",
    short: "Custom menus and professional catering for the most important day.",
    description: [
      "A wedding menu should carry the families' stories. Chef Amrit designs custom, predominantly vegetarian and Halal menus that honour tradition while surprising guests, from a chaat station to a grand slow-cooked biryani.",
      "He works with your planner and venue on every detail: timing, tasting sessions, staffing and presentation.",
    ],
    idealFor: ["Wedding receptions", "Mehndi and sangeet", "Rehearsal dinners"],
    includes: ["Tasting session", "Custom menu and stations", "Full catering team", "Coordination with planner and venue"],
    guestRange: "50 – 300 guests",
    image: images.tableFlorals,
    order: 4,
  },
  {
    slug: "villa-yacht-dining",
    name: "Villa & Yacht Dining",
    short: "Luxury private chef experiences for travel, villas and yachts.",
    description: [
      "For hosts travelling with their guests, Chef Amrit joins you on location: a rented villa, a summer house or a yacht. He plans the provisioning, adapts to the galley and cooks a menu that meets the setting.",
      "Multi-day residencies can be arranged, with breakfasts, lunches and dinners designed as a single, unhurried story.",
    ],
    idealFor: ["Holiday residencies", "Yacht charters", "Destination celebrations"],
    includes: ["Travel and provisioning plan", "Daily menus", "Chef on site", "Galley and kitchen management"],
    guestRange: "2 – 16 guests",
    image: images.villaPool,
    order: 5,
  },
  {
    slug: "personal-chef",
    name: "Weekly Personal Chef",
    short: "Meal preparation designed around your lifestyle, preferences and dietary needs.",
    description: [
      "Honest, home-style Punjabi cooking, prepared weekly in your kitchen. Chef Amrit builds a rotating plan around your preferences, health goals and dietary requirements, then cooks, labels and stores it.",
      "It is the food his mother cooked every day, simple but good, made for a busy household.",
    ],
    idealFor: ["Busy families", "Dietary programmes", "Extended stays in New York"],
    includes: ["Weekly menu planning", "Shopping and preparation", "Labelled, portioned meals", "Kitchen left spotless"],
    image: images.homeKitchen,
    order: 6,
  },
];

export const experienceBySlug = (slug: string) => experiences.find((e) => e.slug === slug);
export const experienceSlugs = experiences.map((e) => e.slug);
