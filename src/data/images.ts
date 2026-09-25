import type { ImageAsset } from "@/types/content";

/**
 * IMAGE REGISTRY
 * ---------------------------------------------------------------------------
 * Every photograph on the site is referenced from here. All entries are
 * currently stock placeholders (Unsplash, stored in /public/images/placeholders)
 * and are flagged placeholder: true.
 *
 * TO SWAP IN REAL PHOTOGRAPHY:
 *   1. Drop the file in /public/images/<group>/ (e.g. /public/images/chef/portrait.jpg)
 *   2. Replace the entry below with:
 *        { src: "/images/chef/portrait.jpg", alt: "...", width: 1600, height: 2000 }
 *   3. Nothing else needs to change.
 * ---------------------------------------------------------------------------
 */

const placeholder = (
  file: string,
  alt: string,
  width = 1600,
  height = 1067,
): ImageAsset => ({
  src: `/images/placeholders/${file}`,
  alt,
  width,
  height,
  credit: "Unsplash",
  placeholder: true,
});

export const images = {
  // ---- Chef ----
  /**
   * Chef Amrit at the range. Supplied by the chef, so it is not a stock
   * placeholder despite sitting in that folder, and must not be swapped out
   * when the rest of the placeholders are replaced.
   */
  hero: {
    src: "/images/placeholders/hero.jpg",
    alt: "Chef Amrit Pal Singh in chef's whites at the range, flames leaping from the pan he is tilting over the burner",
    width: 1453,
    height: 1082,
  },
  chefPortrait: placeholder("chefPortrait.jpg", "Placeholder portrait of a chef in whites, arms folded", 1400, 1750),
  chefPlating: placeholder("chefPlating.jpg", "Chef plating under the heat lamps at the pass", 1600, 1067),
  chefCooking: placeholder("chefCooking.jpg", "Chef working over the stove", 1600, 1067),
  /**
   * The gallery's "Open flame" tile: the same photograph of the chef as the
   * home hero, kept as its own file so the two can diverge later. Supplied by
   * the chef, so not a stock placeholder despite sitting in that folder.
   */
  chefFlame: {
    src: "/images/placeholders/chefFlame.jpg",
    alt: "Chef Amrit Pal Singh at the range, flame rising from the pan in his hand",
    width: 1453,
    height: 1082,
  },
  // ---- Dishes ----
  dahiBatataPuri: placeholder("dahiBatataPuri.jpg", "Chaat plates on a blue table", 1400, 1400),
  kalePakora: placeholder("kalePakora.jpg", "Golden fried snacks with green chilli", 1400, 1400),
  lassuniGobi: placeholder("lassuniGobi.jpg", "Dark bowl of spiced vegetables with lime", 1400, 1400),
  vegetableDumBiryani: placeholder("vegetableDumBiryani.jpg", "Aromatic rice with tomato and herbs", 1400, 1400),
  housemadePaneer: placeholder("housemadePaneer.jpg", "Charred paneer tikka on a sizzling plate", 1400, 1400),
  paneerCurry: placeholder("paneerCurry.jpg", "Paneer curry with rice on a grey plate", 1400, 1400),
  karahi: placeholder("karahi.jpg", "Creamy curry in a copper karahi", 1400, 1400),
  copperPot: placeholder("copperPot.jpg", "Curry in a copper pot with cream swirl", 1400, 1400),
  thaliOverhead: placeholder("thaliOverhead.jpg", "Overhead thali of small bowls on a dark table", 1600, 2000),
  thali: placeholder("thali.jpg", "Steel thali with roti and curries", 1400, 1400),
  naanDal: placeholder("naanDal.jpg", "Fresh naan with bowls of dal", 1400, 1400),
  curryNaan: placeholder("curryNaan.jpg", "Curry served with naan", 1400, 1400),
  curryPan: placeholder("curryPan.jpg", "Vegetable curry in a pan with fresh coriander", 1400, 1400),
  butterPaneerRice: placeholder("butterPaneerRice.jpg", "Butter paneer with rice and papad", 1400, 1400),
  pavBhaji: placeholder("pavBhaji.jpg", "Pav bhaji with buttered buns", 1400, 1400),
  dosa: placeholder("dosa.jpg", "Crisp dosa with chutneys", 1400, 1400),
  curriesRice: placeholder("curriesRice.jpg", "Bowls of curry with rice", 1400, 1400),
  ricePlate: placeholder("ricePlate.jpg", "Spiced rice on a silver plate", 1400, 1400),
  // ---- Restaurant & bar ----
  /** Real photograph of Angel's new dining room, supplied by the chef. Not a placeholder. */
  angelDiningRoom: {
    src: "/images/restaurant/angel-dining-room.jpg",
    alt: "Angel's new dining room: the gold script sign, a long banquette and pendant lights running down the room",
    width: 932,
    height: 563,
  },
  diningRoomGreen: placeholder("diningRoomGreen.jpg", "Dining room with greenery and soft seating", 1600, 1067),
  diningRoomLoft: placeholder("diningRoomLoft.jpg", "Restaurant interior", 1600, 1067),
  bar: placeholder("bar.jpg", "Bar with stools and warm light", 1600, 1067),
  cocktail: placeholder("cocktail.jpg", "A cocktail being poured over ice", 1400, 1750),
  // ---- Tables & events ----
  tableCandles: placeholder("tableCandles.jpg", "Table set with wine glasses", 1600, 1067),
  tableSetting: placeholder("tableSetting.jpg", "Elegant table setting", 1600, 1067),
  tableFlorals: placeholder("tableFlorals.jpg", "Table with florals and glassware", 1600, 1067),
  banquet: placeholder("banquet.jpg", "Banquet tables dressed for an event", 1600, 1067),
  toast: placeholder("toast.jpg", "Guests raising glasses", 1600, 1067),
  restaurantOverhead: placeholder("restaurantOverhead.jpg", "Overhead view of a busy dining room", 1600, 1067),
  villaPool: placeholder("villaPool.jpg", "Villa pool overlooking the sea", 1600, 1067),
  villaInterior: placeholder("villaInterior.jpg", "Sunlit villa interior", 1400, 1750),
  terrace: placeholder("terrace.jpg", "Waterfront terrace set for dinner", 1600, 1067),
  homeKitchen: placeholder("homeKitchen.jpg", "Cooking together in a home kitchen", 1600, 1067),
  brunchSpread: placeholder("brunchSpread.jpg", "Overhead spread of dishes on a table", 1600, 1067),
  // ---- Behind the scenes & plating ----
  chopping: placeholder("chopping.jpg", "Hands chopping herbs on a board", 1400, 1400),
  choppingHerbs: placeholder("choppingHerbs.jpg", "Knife work on fresh coriander", 1400, 1400),
  kitchenLine: placeholder("kitchenLine.jpg", "The kitchen line during service", 1600, 1067),
  prepOverhead: placeholder("prepOverhead.jpg", "Overhead of vegetables being prepped", 1600, 1067),
  platedFine: placeholder("platedFine.jpg", "A plated dish with a glass of wine", 1400, 1400),
  platedDish: placeholder("platedDish.jpg", "Composed plate close-up", 1400, 1400),
  soupBowl: placeholder("soupBowl.jpg", "Soup bowl with herbs", 1400, 1400),
  tableSpread: placeholder("tableSpread.jpg", "Bright table spread of dishes", 1600, 1067),
  guestDining: placeholder("guestDining.jpg", "A guest enjoying a dish", 1600, 1067),
} satisfies Record<string, ImageAsset>;

export type ImageKey = keyof typeof images;
