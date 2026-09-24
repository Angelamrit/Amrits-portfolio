/**
 * Search titles and descriptions for every public page, in one place.
 *
 * Rules these follow, so an edit keeps them working:
 * - Titles are complete as written (no suffix is appended) and stay within
 *   about 60 characters, which is what Google shows before truncating.
 * - Each title leads with what the page is about, then the brand.
 * - Descriptions are 140–160 characters, unique per page, and use the words
 *   people actually search for: Indian restaurant, Jackson Heights, Queens,
 *   Michelin Bib Gourmand, halal, vegetarian.
 * - Nothing here may claim more than the site itself can back up.
 */
export type PageSeo = {
  title: string;
  description: string;
  /** The headline on the page's share card (Open Graph image). */
  card: { eyebrow: string; title: string; accent?: string };
};

export const seo = {
  home: {
    title: "Chef Amrit Pal Singh | Angel Indian Restaurant, Queens NY",
    description:
      "Chef Amrit Pal Singh, owner and head chef of Angel Indian Restaurant in Jackson Heights, Queens: Michelin Bib Gourmand, predominantly vegetarian, 100% Halal.",
    card: { eyebrow: "Owner & Head Chef · Angel Indian Restaurant", title: "Amrit", accent: "Pal Singh" },
  },
  about: {
    title: "About Chef Amrit Pal Singh | From Pathankot to Queens",
    description:
      "Chef Amrit Pal Singh's story: raised in Pathankot, trained in Australia and at NYC's Rahi and Adda, then founder of Michelin Bib Gourmand Angel in Queens.",
    card: { eyebrow: "The Chef", title: "A life built", accent: "around the table." },
  },
  angel: {
    title: "Angel Indian Restaurant, Jackson Heights | Bib Gourmand",
    description:
      "Angel Indian Restaurant, 75-18 37th Ave, Jackson Heights, Queens: Michelin Bib Gourmand Indian cooking, predominantly vegetarian, 100% Halal, full bar.",
    card: { eyebrow: "The Restaurant · Jackson Heights, Queens", title: "Angel Indian", accent: "Restaurant." },
  },
  menus: {
    title: "Tasting Menu & House Specialties | Angel Indian Restaurant",
    description:
      "Chef Amrit Pal Singh's seven-course tasting menu and house specialties at Angel, Jackson Heights: chole bhatura, Amritsari kulcha, dum biryani. 100% Halal.",
    card: { eyebrow: "The Menus · 100% Halal", title: "Two menus,", accent: "course by course." },
  },
  gallery: {
    title: "Photo Gallery: Dishes & Dining Room | Chef Amrit Pal Singh",
    description:
      "Photographs of Chef Amrit Pal Singh's signature dishes, Angel's dining rooms in Jackson Heights, Queens, and the kitchen at work from the tandoor to the pass.",
    card: { eyebrow: "Gallery", title: "Dishes, tables,", accent: "and the hands behind them." },
  },
  press: {
    title: "Press & Michelin Bib Gourmand | Chef Amrit Pal Singh",
    description:
      "Michelin Bib Gourmand, The Infatuation, Bon Appétit, Time Out New York and more: verified press coverage of Chef Amrit Pal Singh and Angel Indian Restaurant.",
    card: { eyebrow: "Press & Recognition", title: "What the critics", accent: "actually wrote." },
  },
  contact: {
    title: "Reserve a Table & Contact | Angel Indian Restaurant, Queens",
    description:
      "Reserve a table at Angel Indian Restaurant, 75-18 37th Ave, Jackson Heights, Queens, or send Chef Amrit Pal Singh a message for press and collaborations.",
    card: { eyebrow: "Contact · Reservations", title: "Reserve a table,", accent: "or say hello." },
  },
  journal: {
    title: "Journal: Notes from the Kitchen | Chef Amrit Pal Singh",
    description:
      "Recipes, stories and kitchen notes from Chef Amrit Pal Singh of Angel Indian Restaurant: plating, seasonal ingredients and how a tasting menu comes together.",
    card: { eyebrow: "Journal", title: "Notes from", accent: "the kitchen." },
  },
  testimonials: {
    title: "Testimonials | Chef Amrit Pal Singh",
    description: "Words about Chef Amrit Pal Singh and Angel Indian Restaurant from peers and guests.",
    card: { eyebrow: "Testimonials", title: "In their", accent: "own words." },
  },
} satisfies Record<string, PageSeo>;
