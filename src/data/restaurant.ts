import type { RestaurantProfile } from "@/types/content";
import { images } from "./images";

/**
 * Angel Indian Restaurant: the chef's own restaurant and the anchor of his
 * credibility. Every fact here is drawn from the chef's verified biography.
 */
export const restaurant: RestaurantProfile = {
  name: "Angel Indian Restaurant",
  shortName: "Angel",
  tagline: "Indian roots. Bold flavours. A Michelin Bib Gourmand in Jackson Heights.",
  namesake: "Named after Chef Amrit's daughter",
  founded: "October 2019",
  intro:
    "Outside, a gold sign and a green awning on 37th Avenue, the windows strung with lights. Inside, a warm, full dining room where Chef Amrit's cooking lives every night: the Indian food that earned Angel a Michelin Bib Gourmand.",
  story: [
    "In October 2019, Chef Amrit opened Angel in Jackson Heights, Queens, with almost nothing: a six-burner stove, one tandoor and a fridge. It was a two-person operation. He cooked, took the orders and cleaned the floors himself.",
    "The neighbourhood answered immediately. Angel paid its own rent in the very first month, and word travelled quickly through a borough that knows Indian food better than anywhere in America.",
    "He named the restaurant after his daughter. Every plate that leaves the kitchen carries her name, and he cooks accordingly: predominantly vegetarian, 100% Halal, and always simple but good.",
  ],
  features: ["Predominantly vegetarian", "100% Halal", "Full bar", "Dinner only", "Chef's tasting menu", "Housemade paneer"],
  facts: [
    { value: "2019", label: "Opened" },
    { value: "Growing", label: "Team" },
    { value: "Bib Gourmand", label: "Michelin Guide" },
  ],
  locations: [
    {
      name: "Angel, Jackson Heights",
      kind: "original",
      description:
        "The original room on 37th Avenue, where the menu moves from Indian street food to slow-cooked regional delicacies. The dishes that earned the Bib Gourmand are still served here, family style.",
      highlights: ["Street food to regional delicacies", "Predominantly vegetarian, 100% Halal"],
      image: images.diningRoomGreen,
      view: {
        label: "Outside",
        title: "Outside, on 37th Avenue",
        description:
          "The front of Angel at 75-18 37th Avenue in Jackson Heights, Queens: the gold script sign, the green awning and windows strung with lights.",
        highlights: ["75-18 37th Avenue, Jackson Heights", "Since October 2019"],
      },
    },
    {
      name: "Angel, the new dining room",
      kind: "upscale",
      description:
        "A sleek, formal, dinner-only dining room with a full bar and a curated chef's tasting menu. The expansion Chef Vikas Khanna called a “pride of India.”",
      highlights: ["Chef's tasting menu", "Full bar and cocktails", "Reservations via Resy"],
      image: images.angelDiningRoom,
      view: {
        label: "Inside",
        title: "Inside, the dining room",
        description:
          "A sleek, formal, dinner-only room under warm pendant lights, with the gold Angel sign, a long banquette, a full bar and a curated chef's tasting menu. Chef Vikas Khanna called it a “pride of India.”",
        highlights: ["Chef's tasting menu", "Full bar and cocktails", "Reservations via Resy"],
        image: images.angelBanquette,
      },
    },
  ],
  heroImage: images.angelDiningRoom,
  storyImage: images.kitchenLine,
  barImage: images.bar,
  thenNow: {
    before: {
      image: images.storefrontEvening,
      label: "Outside",
      caption: "Angel on 37th Avenue, Jackson Heights, lit up for the evening.",
    },
    after: {
      image: images.angelFullRoom,
      label: "Inside",
      caption: "A full dining room, with guests at every table and the team at work.",
    },
  },
};
