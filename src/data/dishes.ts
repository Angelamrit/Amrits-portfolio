import type { Dish } from "@/types/content";
import { images } from "./images";

/**
 * The Chef's Special section of Angel's printed menu, in menu order.
 * Prices are deliberately not carried here: the printed menu is the only
 * place they are published, so they cannot go stale on the site.
 */
export const dishes: Dish[] = [
  {
    id: "chole-bhatura",
    name: "Chole Bhatura",
    tagline: "The Indian classic",
    description:
      "Chickpeas simmered until the spice has gone all the way through, served with fried flat bread straight from the pan.",
    image: images.pavBhaji,
    tags: ["vegetarian", "halal"],
    signature: true,
    order: 1,
  },
  {
    id: "amritsari-paneer-kulcha",
    name: "Amritsari Paneer Kulcha",
    tagline: "Stuffed the Amritsari way",
    description:
      "Paneer-stuffed bread, served with chickpeas, pickle, yogurt and spices.",
    image: images.paneerCurry,
    tags: ["vegetarian", "halal", "dairy"],
    signature: true,
    order: 2,
  },
  {
    id: "amritsari-aloo-kulcha",
    name: "Amritsari Aloo Kulcha",
    tagline: "Bread, the way Amritsar bakes it",
    description:
      "Potato-stuffed bread, served with chickpeas, pickle, yogurt and spices.",
    image: images.naanDal,
    tags: ["vegetarian", "halal", "dairy"],
    signature: true,
    order: 3,
  },
  {
    id: "mix-veg-kulcha",
    name: "Mix Veg Kulcha",
    tagline: "Everything the season gives",
    description:
      "Mixed vegetable–stuffed bread, served with chickpeas, pickle, yogurt and spices.",
    image: images.curryNaan,
    tags: ["vegetarian", "halal", "dairy"],
    signature: true,
    order: 4,
  },
  {
    id: "vegetable-dum-biryani",
    name: "Vegetable Dum Biryani",
    tagline: "Slow-cooked under seal",
    description:
      "Fresh vegetables and paneer layered with saffron basmati rice, sealed and slow-cooked in the dum tradition, served with raita.",
    image: images.vegetableDumBiryani,
    tags: ["vegetarian", "halal", "dairy"],
    signature: true,
    order: 5,
  },
  {
    id: "chicken-dum-biryani",
    name: "Chicken Dum Biryani",
    tagline: "Sealed, steamed, served",
    description:
      "Chicken layered with saffron basmati rice, sealed and slow-cooked in the dum tradition, served with raita.",
    image: images.ricePlate,
    tags: ["halal", "dairy"],
    signature: true,
    order: 6,
  },
  {
    id: "goat-dum-biryani",
    name: "Goat Dum Biryani",
    tagline: "The one worth the wait",
    description:
      "Goat layered with saffron basmati rice, sealed and slow-cooked in the dum tradition, served with raita.",
    image: images.curriesRice,
    tags: ["halal", "dairy"],
    signature: true,
    order: 7,
  },
];

export const signatureDishes = dishes.filter((d) => d.signature).sort((a, b) => a.order - b.order);

export const dishById = (id: string) => dishes.find((d) => d.id === id);
