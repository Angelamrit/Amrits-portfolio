import type { ImageAsset } from "@/types/content";
import { withPlaceholders } from "@/lib/images/placeholders";

/**
 * IMAGE REGISTRY
 * ---------------------------------------------------------------------------
 * Every photograph on the site is referenced from here, and every one of them
 * is the chef's own. The stock placeholders the site was built with (and their
 * folder, /public/images/placeholders) have been removed.
 *
 * TO ADD A PHOTOGRAPH:
 *   1. Drop the file in /public/images/<group>/ (e.g. /public/images/chef/portrait.jpg)
 *   2. Replace the entry below with:
 *        { src: "/images/chef/portrait.jpg", alt: "...", width: 1600, height: 2000 }
 *   3. Nothing else needs to change.
 * ---------------------------------------------------------------------------
 */

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

const registry = {
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
   * The gallery's "Open flame" tile: the chef in a black cap at the range,
   * flame rising from the pan. A different photograph from the home hero.
   * Supplied by the chef. (Its old file in /images/placeholders was deleted by
   * mistake in d13009d; this web copy was restored from that file's history.)
   */
  chefFlame: {
    src: "/images/chef/chef-flame.jpg",
    alt: "Chef Amrit Pal Singh at the range, flame rising from the pan in his hand",
    width: 1453,
    height: 1082,
  },
  // ---- Dishes ----
  /**
   * Chole Bhatura at Angel (chole_bhature), supplied by the chef. Not a placeholder. It is the
   * same 4:3 shape as the signature-dish frame, so it fills that frame without being cropped.
   */
  choleBhatura: {
    src: "/images/food/chole-bhatura.jpg",
    alt: "Chole bhatura at Angel: a copper bowl of spiced chickpeas topped with red onion and coriander, beside two golden puffed bhature on a steel platter",
    width: 1448,
    height: 1086,
  },
  /**
   * Vegetable Dum Biryani (veg_biryani), supplied by the chef. Not a placeholder.
   * The original is 16:9 and the dish frames are 4:3, and no crop of it kept
   * the whole bowl: the rim was cut and the bowl sat on the frame's edge. So
   * this copy is 4:3 already: the photograph's own dark background continues
   * above, below and to the left, feathered in, with the bowl centred. Made
   * from real_pictures/veg_biryani.WEBP; nothing of the dish is altered.
   */
  vegetableDumBiryani: {
    src: "/images/food/veg-biryani-4x3.webp",
    alt: "A dark bowl of vegetable dum biryani: saffron-gold basmati with carrots, crisp fried onions and fresh coriander on top",
    width: 1200,
    height: 900,
  },
  /**
   * Chicken Dum Biryani (chicken_dum), supplied by the chef. Not a placeholder. A 3:2 photograph
   * shown in 4:3 frames: the bowl is centred, so the default centred crop trims only the table at
   * either side and keeps the whole rim in view.
   */
  chickenDumBiryani: {
    src: "/images/food/chicken-dum-biryani.jpg",
    alt: "A dark bowl of chicken dum biryani: saffron basmati with pieces of chicken, crisp fried onions and fresh coriander, on a marble table",
    width: 1536,
    height: 1024,
  },
  /**
   * Amritsari Aloo Kulcha (amristarti_aloo), supplied by the chef. Not a placeholder. The
   * original is a tall portrait and the dish frames are 4:3, so this copy is cut to exactly 4:3
   * at full width, filling the frame edge to edge. The cut is placed to keep both bowls whole and
   * the kulcha with both pats of butter; it loses only the spoon and empty plate at the top and
   * the kulcha's bottom crust.
   */
  /**
   * Amritsari Paneer Kulcha (paneer), supplied by the chef. Not a placeholder. The original is
   * 3:2, a little wider than the 4:3 dish frames, so this copy is cut to exactly 4:3 by trimming
   * only plain table on the right: the plate, the kulcha, both bowls and the chillies show whole.
   */
  amritsariPaneerKulcha: {
    src: "/images/food/amritsari-paneer-kulcha.jpg",
    alt: "Amritsari paneer kulcha on a white plate, topped with cubes of paneer and rings of onion, with a bowl of chickpea curry, a bowl of pickled onion and green chillies on a wooden table",
    width: 1365,
    height: 1024,
  },
  amritsariAlooKulcha: {
    src: "/images/food/amritsari-aloo-kulcha-full.jpg",
    alt: "Amritsari aloo kulcha on a white plate, flecked with herbs and topped with two pats of butter, beside a bowl of chickpea curry and a bowl of onion and tomato in tangy water",
    width: 1199,
    height: 899,
  },
  /**
   * Mix Veg Kulcha (mix_veg), supplied by the chef. Not a placeholder. The original is a little
   * taller than 4:3, so this copy is cut to exactly 4:3 at full width, taking only bare table from
   * the top and bottom: the whole foil plate, the kulcha with its butter and both bowls stay in.
   */
  mixVegKulcha: {
    src: "/images/food/mix-veg-kulcha.jpg",
    alt: "Mix veg kulcha cut into wedges on a foil-lined plate, flecked with herbs and topped with a pat of butter, beside a bowl of chickpea curry and a bowl of chopped onion and tomato, on a wooden table",
    width: 1408,
    height: 1056,
  },
  /**
   * Goat Dum Biryani (goat_dum), supplied by the chef. Not a placeholder. Already 4:3, the dish
   * frames' own shape, so nothing is cropped: the whole pot, its bread lid and the raita show.
   */
  goatDumBiryani: {
    src: "/images/food/goat-dum-biryani.jpg",
    alt: "Goat dum biryani in a pot sealed with baked bread, the crust lifted to show saffron rice, goat and fried onions, with a bowl of raita, on a red wood table",
    width: 1448,
    height: 1086,
  },
  // ---- Restaurant & bar ----
  /** Real photograph of Angel's new dining room, supplied by the chef. Not a placeholder. */
  angelDiningRoom: {
    src: "/images/restaurant/angel-dining-room.jpg",
    alt: "Angel's new dining room: the gold script sign, a long banquette and pendant lights running down the room",
    width: 932,
    height: 563,
  },
  /**
   * The Contact page's opening photograph (FE4D6BFF…), supplied by the chef. Not a placeholder.
   * Its own entry so it can change without touching the Angel page or the gallery.
   */
  contactHero: {
    src: "/images/restaurant/dining-room-display-case.jpg",
    alt: "Angel's dining room in warm light: a glass display case of gold figurines, round pendant lamps, and black-backed chairs along a tan leather banquette",
    width: 1024,
    height: 1536,
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
  /**
   * Real photograph of Angel's bar (12E9DD63…, replacing CC29AD12…), supplied by the chef. Not a
   * placeholder. On the Angel page beside "In the guide, and among peers." and the gallery's
   * "The bar" tile.
   */
  bar: {
    src: "/images/restaurant/bar-bright.jpg",
    alt: "The bar at Angel: Edison bulbs hanging from a wooden slat ceiling, lit shelves of bottles, a photograph of the chef and framed press features on the wall, and a slatted wood counter",
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
  /** The storefront again, on the Angel page's story and a draft journal post's cover. */
  kitchenLine: storefront,
  /**
   * Angel's front on 37th Avenue by day (8D6CFA21…), supplied by the chef. Not a placeholder.
   * On the gallery's storefront tile. 3:4, the gallery's "tall" tile shape, so it shows whole.
   */
  storefrontDay: {
    src: "/images/restaurant/storefront-day.jpg",
    alt: "Angel Indian Restaurant by day at 75-18 37th Avenue: the Angel sign under two black lamps, a green awning with the street number and 347-848-0098, a lit OPEN sign and the glass door, under a brick building",
    width: 1086,
    height: 1448,
  },
} satisfies Record<string, ImageAsset>;

/**
 * The registry above with each photograph's blurred placeholder attached, so
 * a picture never arrives as a pop into an empty frame. The placeholders are
 * built by `node scripts/image-placeholders.mjs`; run it after adding or
 * replacing a file under /public/images.
 */
export const images = withPlaceholders(registry);

export type ImageKey = keyof typeof images;
