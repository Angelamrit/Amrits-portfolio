import type { VenueDetails } from "@/lib/content/venue";

/**
 * The questions guests ask before a first visit, answered from the
 * restaurant's own verified details. Shown on the Angel page and handed to
 * search engines as structured data, so a search such as "is Angel Jackson
 * Heights halal" can be answered with the site's own words.
 *
 * Built from the live venue details rather than written out, so a change of
 * hours or address in the dashboard changes the answers too. Every claim here
 * must already be made somewhere else on the site.
 */
export function restaurantFaq(venue: VenueDetails): { q: string; a: string }[] {
  const { address } = venue;
  const where = `${address.street}, ${address.city}, ${address.region} ${address.postal}`;
  const resy = venue.resyUrl ? " Tables can be reserved through Resy, which is the quickest way to secure one, especially for the tasting menu." : "";
  const phone = venue.phone ? ` The restaurant's telephone number is ${venue.phone}.` : "";

  return [
    {
      q: "Where is Angel Indian Restaurant?",
      a: `Angel is at ${where}, in Queens, two blocks from the 74 St–Broadway / Jackson Heights–Roosevelt Av subway station (7, E, F, M and R trains).`,
    },
    {
      q: "What are Angel's opening hours?",
      a: `${venue.hours}.${resy}${phone}`,
    },
    {
      q: "Is Angel halal?",
      a: "Yes. Angel's kitchen is 100% Halal. The menu is predominantly vegetarian, and the paneer is made in-house every day.",
    },
    {
      q: "Does Angel have vegetarian dishes?",
      a: "Most of the menu is vegetarian: chole bhatura, Amritsari aloo and paneer kulcha, vegetable dum biryani and slow-cooked regional dishes, alongside a smaller selection of non-vegetarian dishes, all of them Halal.",
    },
    {
      q: "Is there a tasting menu?",
      a: "Yes. Chef Amrit's seven-course chef's tasting menu is served in the new dining room and moves from Indian street food to regional delicacies. The full à la carte menu is available as well.",
    },
    {
      q: "Does Angel have a bar?",
      a: "Yes. The new dining room has a full bar and cocktails, and it is open for dinner alongside the à la carte menu and the tasting menu.",
    },
    {
      q: "Who is the chef at Angel?",
      a: "Angel is owned and run by Chef Amrit Pal Singh, who cooked at Rahi and Adda in New York before opening Angel in October 2019 with a six-burner stove, one tandoor and a fridge. The restaurant has held a Michelin Bib Gourmand since 2021.",
    },
  ];
}
