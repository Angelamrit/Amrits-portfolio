import type { ChefProfile } from "@/types/content";
import { images } from "./images";

export const chef: ChefProfile = {
  name: "Amrit Pal Singh",
  firstName: "Amrit",
  title: "Owner & Head Chef, Angel Indian Restaurant",
  positioning: "Punjabi roots. Bold flavours. Simple but good.",
  location: "Jackson Heights, Queens — New York City",
  shortBio:
    "Born in Pathankot, Punjab, and shaped by his mother's kitchen, Chef Amrit Pal Singh trained formally in Australia before earning his place in the acclaimed New York kitchens of Rahi and Adda. In October 2019 he opened Angel with a six-burner stove, one tandoor and a single fridge. Today the restaurant holds a Michelin Bib Gourmand, employs more than twenty people, and has been called a “pride of India.”",
  longBio: [
    "Amrit Pal Singh grew up in Pathankot, a small city in the foothills of Punjab. His mother, a housewife, cooked for the family every day; his father served as an officer in the Indian Army. It was at her stove that he learned the rule he still cooks by: simple but good. No excess, no shortcuts, just enough spice to let each ingredient taste like itself.",
    "He left India for Australia to study the food industry formally, then made his way to New York City. There he honed his craft in two of the city's most celebrated Indian kitchens, Rahi and Adda, learning how tradition and precision could share the same plate.",
    "In October 2019 he opened Angel Indian Restaurant in Jackson Heights, Queens, with almost nothing: a six-burner stove, one tandoor and a fridge. It was a two-person operation. Amrit cooked, took the orders and cleaned the floors himself. The neighbourhood answered immediately, and Angel paid its own rent in the very first month.",
    "Named after his daughter, Angel is predominantly vegetarian and 100% Halal, and its menu moves from comforting street food to complex regional delicacies. The restaurant earned a Michelin Bib Gourmand in 2021, and when the new dining room opened in July 2025 the Michelin-starred chef Vikas Khanna called it “the pride of India” and Amrit “possibly one of the finest Indian chefs in the U.S.”",
    "Today Chef Amrit leads a team of more than twenty. His new upscale location is a formal, dinner-only dining room with a full bar and a curated chef's tasting menu alongside the house specialties that made Angel famous.",
  ],
  portrait: images.chefPortrait,
  heroImage: images.hero,
  timeline: [
    {
      year: "Pathankot",
      title: "A mother's kitchen in Punjab",
      body: "Raised in Pathankot by a mother who cooked every day and a father in the Indian Army. Discipline from one, flavour from the other.",
    },
    {
      year: "Australia",
      title: "Formal training",
      body: "Moved abroad to study the food industry formally, building the technical foundation beneath his home-taught instincts.",
    },
    {
      year: "New York",
      title: "Rahi & Adda",
      body: "Honed his skills in two of the most acclaimed Indian kitchens in New York City, earning his place on the line.",
    },
    {
      year: "October 2019",
      title: "Angel opens",
      body: "A six-burner stove, one tandoor, one fridge and a two-person team. Cooking, taking orders and cleaning himself, Amrit made enough to pay the rent in month one.",
    },
    {
      year: "Today",
      title: "Michelin Bib Gourmand",
      body: "More than twenty employees, a place in the Michelin Guide, a Bib Gourmand and a new upscale dining room with a chef's tasting menu.",
    },
  ],
  training: [
    {
      title: "Home",
      body: "The daily cooking of his mother in Pathankot, Punjab, where “simple but good” became the rule.",
    },
    {
      title: "Formal study, Australia",
      body: "Structured education in the food industry, from technique to running a professional kitchen.",
    },
    {
      title: "Rahi, New York City",
      body: "Modern Indian cooking in one of Manhattan's most acclaimed dining rooms.",
    },
    {
      title: "Adda, Queens",
      body: "Unapologetically bold regional Indian food in a kitchen celebrated across the city.",
    },
  ],
  specialties: [
    "Traditional Punjabi cooking",
    "Regional Indian delicacies",
    "Indian street food",
    "Tandoor",
    "Housemade paneer",
    "Predominantly vegetarian menus",
    "100% Halal kitchen",
    "Chef's tasting menus",
  ],
  philosophy: {
    quote: "Simple but good.",
    body: [
      "Chef Amrit's cooking rests on a rule learned at his mother's stove: simple but good. Bold flavours, honest technique and nothing on the plate that does not need to be there.",
      "His roots are traditional Punjabi, and he protects them. But Angel's menu travels, from the chaat of the street to slow-cooked regional dishes, all of it predominantly vegetarian and 100% Halal.",
      "He named the restaurant after his daughter. Every plate that leaves the kitchen carries her name, and he cooks accordingly.",
    ],
  },
  stats: [
    { value: "2019", label: "Angel opened" },
    { value: "20+", label: "Team members" },
    { value: "Bib Gourmand", label: "Michelin Guide" },
  ],
  restaurants: [
    {
      name: "Angel Indian Restaurant",
      role: "Owner & Head Chef",
      location: "Jackson Heights, Queens",
      note: "Michelin Bib Gourmand. Predominantly vegetarian, 100% Halal.",
    },
    {
      name: "Angel — New Upscale Location",
      role: "Owner & Head Chef",
      location: "Queens, New York",
      note: "Formal, dinner-only dining room with a full bar and a curated chef's tasting menu.",
    },
    { name: "Rahi", role: "Kitchen", location: "New York City" },
    { name: "Adda", role: "Kitchen", location: "New York City" },
  ],
  recognition: [
    { title: "Bib Gourmand", issuer: "Michelin Guide", note: "Angel Indian Restaurant" },
    { title: "Michelin Guide listing", issuer: "Michelin Guide", note: "New York City" },
    {
      title: "“This is the pride of India.”",
      issuer: "Chef Vikas Khanna",
      note: "Speaking at the opening of Angel's new dining room, July 2025",
    },
  ],
};
