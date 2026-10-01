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

/**
 * The original Jackson Heights location's storefront (18A916B0…), supplied by the chef. Not a
 * placeholder. Two entries show it, so it is defined once and they cannot drift apart. The sign
 * sits near the top of the photo, so a centred crop into a wide frame would cut the lettering;
 * the crop is anchored near the top and gives up the sidewalk instead.
 */
const storefront: ImageAsset = {
  src: "/images/restaurant/storefront-wide.jpg",
  alt: "The front of Angel Indian Restaurant at 75-18 37th Avenue: the gold script sign under two lamps, a green awning with the street number and telephone number, and the lit windows and glass door",
  width: 1165,
  height: 913,
  position: "50% 14%",
};

/** Angel's dining room set for service (B24D1BD5…), supplied by the chef. Not a placeholder. */
const banquette: ImageAsset = {
  src: "/images/restaurant/dining-room-banquette.jpg",
  alt: "Angel's dining room set for service: stone pendant lamps over a long banquette, laid tables and a herringbone floor",
  width: 1536,
  height: 1024,
};

export const images = {
  // ---- Chef ----
  /**
   * The home page hero (CB05C53F…): Chef Amrit at the range. Supplied by the chef. Not a
   * placeholder. Anchored a little above centre: on a wide screen the frame crops the top
   * and bottom, and his cap sits near the top, under the header.
   */
  hero: {
    src: "/images/chef/hero-flame.jpg",
    alt: "Chef Amrit Pal Singh in a cap and chef's whites at the range in Angel's kitchen, flames leaping from the pan he is working",
    width: 1448,
    height: 1086,
    position: "50% 25%",
  },
  /** Real photograph of the chef (89845E79…), supplied by him. Not a placeholder. */
  chefPortrait: {
    src: "/images/chef/portrait-gold-wall.jpg",
    alt: "Chef Amrit Pal Singh in chef's whites and a cap, arms folded, against a warm gold wall",
    width: 1024,
    height: 1536,
  },
  /** The About page's opening photograph (30341959…), supplied by the chef. Not a placeholder. */
  chefAtTheBar: {
    src: "/images/chef/bar-cheers-edit.jpg",
    alt: "Chef Amrit Pal Singh behind the bar at Angel in chef's whites and a cap, two guests raising glasses of red wine in the foreground",
    width: 1024,
    height: 1536,
  },
  // The About page's Philosophy photographs, which take turns in one frame. Supplied by the chef. Not placeholders.
  /** A3709FF0… */
  foodDalNaan: {
    src: "/images/food/dal-naan.jpg",
    alt: "A bowl of dal makhani swirled with cream, beside garlic naan and a wedge of lime",
    width: 1448,
    height: 1086,
  },
  /** 56F046F7… */
  foodCopperPanCurry: {
    src: "/images/food/copper-pan-curry.jpg",
    alt: "A curry topped with almonds in a copper pan, with a bowl of basmati rice on a dark wooden table",
    width: 1024,
    height: 1536,
  },
  /** EBBF2892… */
  foodNaanBiryani: {
    src: "/images/food/naan-biryani.jpg",
    alt: "Garlic naan on red-checked paper in a basket, a platter of biryani with tomato and cucumber, and a bowl of curry",
    width: 1122,
    height: 1402,
  },
  /** Chef Amrit behind the bar (1A29881A…), in the gallery. Supplied by the chef. Not a placeholder. */
  chefBehindTheBar: {
    src: "/images/chef/behind-the-bar-edit.jpg",
    alt: "Chef Amrit Pal Singh behind the bar at Angel, hands together, glasses of red wine and a bottle in the foreground",
    width: 1086,
    height: 1448,
  },
  /** The About page's Milestones photograph (8133C34A…), supplied by the chef. Not a placeholder. */
  chefKitchenPrep: {
    src: "/images/chef/onion-prep.jpg",
    alt: "Chef Amrit Pal Singh in a cap and whites, slicing red onions on a board in a darkened kitchen",
    width: 1024,
    height: 1536,
  },
  /** The Press page's opening photograph (press), supplied by the chef. Not a placeholder. */
  chefInterview: {
    src: "/images/chef/press-interview.jpg",
    alt: "Chef Amrit Pal Singh in a black cap and blazer, speaking into a studio microphone during an interview",
    width: 1536,
    height: 1024,
    // His face is in the top third, and the Press hero's wide, parallax-enlarged frame
    // crops from the middle; anchoring near the top keeps his cap and eyes in view.
    position: "50% 8%",
  },
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
  /** The footer's photograph of Angel's dining room. */
  angelDiningTables: banquette,
  /** The same photograph on the Angel page's "Inside" card, kept as its own entry so either can change alone. */
  angelBanquette: banquette,
  /** The "Today" side of the then-and-now slider (12D03CBE…), supplied by the chef. Not a placeholder. */
  angelFullRoom: {
    src: "/images/restaurant/dining-room-full.jpg",
    alt: "A full dining room at Angel: guests at tables along a banquette under pendant lights, a server taking an order",
    width: 1672,
    height: 941,
  },
  /**
   * The storefront at dusk (outside2222), the 2019 side of the then-and-now slider. Supplied by
   * the chef. Not a placeholder. Anchored to keep the three lamps, the sign and the entrance,
   * giving up the upper-floor windows and the sidewalk.
   */
  storefrontEvening: {
    src: "/images/restaurant/storefront-evening.jpg",
    alt: "Angel Indian Restaurant at dusk: the lit sign under three lamps, the green awning with the street number and telephone number, and glowing windows strung with lights",
    width: 1448,
    height: 1086,
    position: "50% 36%",
  },
  /** The Angel page's opening photograph (E38FD530…), supplied by the chef. Not a placeholder. */
  angelInterior: {
    src: "/images/restaurant/angel-interior.jpg",
    alt: "Inside Angel: the gold Angel sign on a wall of honey-oak geometric panels, a stone pendant lamp and a lit display cabinet of brass ornaments",
    width: 1024,
    height: 1536,
  },
  diningRoomGreen: storefront,
  /** Real photograph of Angel's bar (CC29AD12…), supplied by the chef. Not a placeholder. */
  bar: {
    src: "/images/restaurant/bar.jpg",
    alt: "The bar at Angel: Edison bulbs hanging from a wooden slat ceiling, shelves of bottles, framed press features on the wall and a slatted wood counter",
    width: 1024,
    height: 1536,
  },
  // ---- At the bar ----
  /** Real photograph from Angel (M ali), supplied by the chef. Not a placeholder. */
  tableCandles: {
    src: "/images/restaurant/bar-wine-poured.jpg",
    alt: "Two glasses of red wine set down on the bar at Angel for two guests, a bottle and the back bar behind",
    width: 2400,
    height: 1600,
  },
  // ---- Behind the scenes & plating ----
  /** The storefront again, on the gallery's "The line" tile and a draft journal post's cover. */
  kitchenLine: storefront,
  prepOverhead: placeholder("prepOverhead.jpg", "Overhead of vegetables being prepped", 1600, 1067),
  platedDish: placeholder("platedDish.jpg", "Composed plate close-up", 1400, 1400),
  soupBowl: placeholder("soupBowl.jpg", "Soup bowl with herbs", 1400, 1400),
} satisfies Record<string, ImageAsset>;

export type ImageKey = keyof typeof images;
