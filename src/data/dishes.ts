import type { Dish } from "@/types/content";
import { images } from "./images";

export const dishes: Dish[] = [
  {
    id: "dahi-batata-puri",
    name: "Dahi Batata Puri",
    tagline: "Street food, refined",
    description:
      "Yogurt and potato-filled wheat puffs, finished with tamarind and mint. A Punjabi street classic, plated with restraint.",
    image: images.dahiBatataPuri,
    tags: ["vegetarian", "halal", "dairy"],
    signature: true,
    order: 1,
  },
  {
    id: "kale-pakora",
    name: "Kale Pakora",
    tagline: "Crisp, light, addictive",
    description:
      "Crisp chickpea-flour fritters of fresh kale, fried to a shatter and served with house chutneys.",
    image: images.kalePakora,
    tags: ["vegetarian", "vegan", "gluten-free", "halal"],
    signature: true,
    order: 2,
  },
  {
    id: "lassuni-gobi",
    name: "Lassuni Gobi",
    tagline: "The dish guests come back for",
    description:
      "Tangy, garlic-infused cauliflower, roasted until the edges char and tossed in a bright, bold sauce.",
    image: images.lassuniGobi,
    tags: ["vegetarian", "vegan", "halal"],
    signature: true,
    order: 3,
  },
  {
    id: "vegetable-dum-biryani",
    name: "Vegetable Dum Biryani",
    tagline: "Slow-cooked under seal",
    description:
      "Aromatic mixed rice layered with seasonal vegetables and whole spices, sealed and slow-cooked in the dum tradition.",
    image: images.vegetableDumBiryani,
    tags: ["vegetarian", "halal"],
    signature: true,
    order: 4,
  },
  {
    id: "housemade-paneer",
    name: "Housemade Paneer",
    tagline: "Made fresh, every day",
    description:
      "Paneer made in-house each morning, then charred in the tandoor or simmered in a slow, spiced gravy.",
    image: images.housemadePaneer,
    tags: ["vegetarian", "halal", "dairy"],
    signature: true,
    order: 5,
  },
];

export const signatureDishes = dishes.filter((d) => d.signature).sort((a, b) => a.order - b.order);

export const dishById = (id: string) => dishes.find((d) => d.id === id);
