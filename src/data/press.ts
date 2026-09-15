import type { PressItem } from "@/types/content";

/**
 * GENUINE RECOGNITION ONLY.
 * Add a `url` only once the source has been verified. Never add awards,
 * publications or client logos that cannot be substantiated.
 */
export const press: PressItem[] = [
  {
    id: "michelin-bib-gourmand",
    outlet: "Michelin Guide",
    kind: "award",
    headline: "Bib Gourmand — Angel Indian Restaurant",
    excerpt:
      "The Michelin Guide's Bib Gourmand recognises restaurants offering exceptional food at a remarkable value. Angel earned the distinction for its bold, honest Punjabi cooking in Jackson Heights.",
  },
  {
    id: "michelin-guide-listing",
    outlet: "Michelin Guide",
    kind: "listing",
    headline: "Listed in the Michelin Guide, New York City",
    excerpt:
      "Angel Indian Restaurant holds a place in the Michelin Guide among New York City's most notable kitchens.",
  },
  {
    id: "vikas-khanna",
    outlet: "Chef Vikas Khanna",
    kind: "quote",
    headline: "“One of the finest Indian chefs in the U.S.”",
    excerpt:
      "Legendary chef Vikas Khanna publicly described Chef Amrit as one of the finest Indian chefs in the United States, and called the expansion of Angel a “pride of India.”",
  },
];

/** Credentials strip under the hero. Genuine facts only. */
export const pressMarquee = [
  "Michelin Guide · Bib Gourmand",
  "Owner & Head Chef, Angel Indian Restaurant",
  "Jackson Heights, Queens",
  "Trained at Rahi & Adda, New York",
  "“One of the finest Indian chefs in the U.S.” — Vikas Khanna",
  "Private Dining · Events · Residencies",
];
