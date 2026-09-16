import type { RestaurantProfile } from "@/types/content";
import { images } from "./images";

/**
 * Angel Indian Restaurant: the chef's own restaurant and the anchor of his
 * credibility. Every fact here is drawn from the chef's verified biography.
 */
export const restaurant: RestaurantProfile = {
  name: "Angel Indian Restaurant",
  shortName: "Angel",
  tagline: "Punjabi roots. Bold flavours. A Michelin Bib Gourmand in Jackson Heights.",
  namesake: "Named after Chef Amrit's daughter",
  founded: "October 2019",
  intro:
    "Angel is where Chef Amrit's cooking lives every night. Opened in October 2019 with a six-burner stove, one tandoor and a single fridge, it has grown into a Michelin Bib Gourmand restaurant with a team of more than twenty and a new upscale dining room.",
  story: [
    "In October 2019, Chef Amrit opened Angel in Jackson Heights, Queens, with almost nothing: a six-burner stove, one tandoor and a fridge. It was a two-person operation. He cooked, took the orders and cleaned the floors himself.",
    "The neighbourhood answered immediately. Angel paid its own rent in the very first month, and word travelled quickly through a borough that knows Indian food better than anywhere in America.",
    "He named the restaurant after his daughter. Every plate that leaves the kitchen carries her name, and he cooks accordingly: predominantly vegetarian, 100% Halal, and always simple but good.",
  ],
  features: ["Predominantly vegetarian", "100% Halal", "Full bar", "Dinner only", "Chef's tasting menu", "Housemade paneer"],
  facts: [
    { value: "2019", label: "Opened" },
    { value: "20+", label: "Team" },
    { value: "Bib Gourmand", label: "Michelin Guide" },
  ],
  locations: [
    {
      name: "Angel, Jackson Heights",
      kind: "original",
      description:
        "The original room on 37th Avenue, where the menu moves from Punjabi street food to slow-cooked regional delicacies. The dishes that earned the Bib Gourmand are still served here, family style.",
      highlights: ["House specialties", "Street food to regional delicacies", "Predominantly vegetarian, 100% Halal"],
      image: images.diningRoomGreen,
    },
    {
      name: "Angel, the new dining room",
      kind: "upscale",
      description:
        "A sleek, formal, dinner-only dining room with a full bar and a curated chef's tasting menu served alongside the house specialties. The expansion Chef Vikas Khanna called a “pride of India.”",
      highlights: ["Chef's tasting menu", "Full bar and cocktails", "Reservations via Resy"],
      image: images.angelDiningRoom,
    },
  ],
  heroImage: images.angelDiningRoom,
  storyImage: images.kitchenLine,
  barImage: images.bar,
  thenNow: {
    before: {
      image: images.kitchenLine,
      label: "2019",
      caption: "Six burners, one tandoor, one fridge and a two-person team.",
    },
    after: {
      image: images.angelDiningRoom,
      label: "Today",
      caption: "A Michelin Bib Gourmand, twenty-plus staff and a new upscale dining room.",
    },
  },
};
