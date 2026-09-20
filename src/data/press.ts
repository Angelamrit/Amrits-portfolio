import type { PressItem } from "@/types/content";

/**
 * GENUINE RECOGNITION ONLY.
 *
 * Every item below was read at the source before being added. Each `excerpt`
 * marked `verbatim` is the publication's own wording, copied exactly.
 *
 * TWO STANDING ACCURACY RULES FOR THIS PAGE
 *
 * 1. The Bib Gourmand is year-anchored, never present tense. Angel was awarded
 *    a Bib Gourmand in the MICHELIN Guide's 2021 New York selection. It does
 *    not currently resolve in the guide: the restaurant page returns
 *    "Restaurant not found" and Angel is absent from both the current Queens
 *    selection and the current New York Bib Gourmand list, while other
 *    restaurants from the same 2021 class still resolve. That is consistent
 *    with the move from 74-14 37th Road to 75-18 37th Avenue. So write
 *    "awarded in the 2021 New York selection", never "holds" or "since".
 *
 * 2. The Michelin award attaches to the original 37th Road room, not to the
 *    current 37th Avenue address.
 *
 * DELIBERATELY NOT INCLUDED, because they could not be verified at the source:
 *  - The New Yorker. Claimed on angelindianrestaurant.com with no link
 *    anywhere, and nothing findable in search.
 *  - Eater NY. Very likely real, but ny.eater.com could not be fetched and a
 *    domain-scoped search surfaced nothing, so it is unseen rather than
 *    disproven.
 *  - Conde Nast Traveller India. Unfetchable. Note that the line the
 *    restaurant credits to them, "plate after plate will demonstrate the real
 *    magic of going meatless", is in fact the MICHELIN inspectors' own
 *    sentence, and appears below under Michelin.
 *  - Directories and user-review aggregators (Uber Eats, MapQuest,
 *    Restaurantji, TrustTheCrowd, Atly, Wheree, Yahoo Local, TripExpert).
 *    Listings, not press.
 */
export const press: PressItem[] = [
  {
    id: "michelin-bib-gourmand",
    outlet: "MICHELIN Guide",
    kind: "award",
    headline: "Bib Gourmand — 2021 New York selection",
    excerpt:
      "At chef Amrit Pal Singh's no-frills restaurant, plate after plate will demonstrate the real magic of going meatless. Singh, who grew up in Punjab, keeps his Indian menu small and everything arrives fresh and hot.",
    verbatim: true,
    date: "July 2021",
    url: "https://guide.michelin.com/us/en/article/news-and-views/2021-new-york-michelin-bib-gourmands",
    tier: "flagship",
  },
  {
    id: "michelin-vikas-khanna",
    outlet: "MICHELIN Guide",
    kind: "quote",
    headline: "Chef Vikas Khanna's Favorite New York City Restaurants",
    excerpt:
      "I send everybody to Angel restaurant in Jackson Heights. It's a small restaurant, and the guy does everything himself. For me, that was the first time I felt the taste of home.",
    verbatim: true,
    date: "May 2025",
    url: "https://guide.michelin.com/us/en/article/travel/vikas-khanna-favorite-nyc-restaurants-new-york-indian",
    tier: "flagship",
  },
  {
    id: "bon-appetit-film",
    outlet: "Bon Appétit",
    kind: "video",
    headline: "Trying Everything on the Menu at One of NYC's Best Indian Restaurants",
    excerpt:
      "Bon Appétit brought chefs Meherwan Irani and Lucas Sin to Jackson Heights to eat their way through the entire menu, from pani puri and samosas to biryani, Peshwari naan and gulab jamun.",
    verbatim: false,
    date: "August 2026",
    url: "https://www.youtube.com/watch?v=3w3REWvN2tk",
    tier: "flagship",
  },
  {
    id: "infatuation-review",
    outlet: "The Infatuation",
    kind: "article",
    headline: "Angel — reviewed, 8.6",
    excerpt:
      "By the time your server brings out the show-stopping goat dum biryani at Angel, there's a pretty good chance your party will already be planning a second visit to this Indian restaurant in Jackson Heights.",
    verbatim: true,
    date: "August 2024",
    url: "https://www.theinfatuation.com/new-york/reviews/angel-indian-restaurant",
    tier: "flagship",
  },
  {
    id: "time-out-best-indian",
    outlet: "Time Out New York",
    kind: "listing",
    headline: "Named one of the 18 Best Indian Restaurants in NYC",
    // Time Out's "arguably the best Indian food in all of NYC" line describes
    // Jackson Heights the neighbourhood, not Angel. Do not quote it as praise.
    excerpt: "Angel is listed among Time Out's eighteen best Indian restaurants in New York City, alongside Dhamaka, Semma, Indian Accent and Adda.",
    verbatim: false,
    date: "November 2024",
    url: "https://www.timeout.com/newyork/restaurants/the-best-indian-restaurants-in-nyc",
    tier: "flagship",
  },
  {
    id: "resy-regulars",
    outlet: "Resy",
    kind: "article",
    headline: "The New York Restaurants Where We Want to Be Regulars",
    excerpt:
      "This spot from an Adda veteran is definitely heaven-sent, with its soulful biryani, vindaloos, samosa chaat, and Punjabi lassis.",
    verbatim: true,
    date: "December 2025",
    url: "https://blog.resy.com/2025/12/nyc-restaurants-where-we-want-to-be-regulars/",
    tier: "flagship",
  },
  {
    id: "infatuation-37th-ave",
    outlet: "The Infatuation",
    kind: "article",
    headline: "The new 37th Avenue dining room",
    excerpt:
      "Angel, one of our favorite Indian restaurants, moved a few blocks away in Jackson Heights from its tiny original location. The new space is larger, though still not huge, and a little more upscale.",
    verbatim: true,
    date: "April 2026",
    url: "https://www.theinfatuation.com/new-york/reviews/angel-indian-restaurant-37th-ave",
    tier: "strong",
  },
  {
    id: "hell-gate-review",
    outlet: "Hell Gate NYC",
    kind: "article",
    headline: "Angel Indian Restaurant Still Brings the Heat in Jackson Heights",
    // Paywalled after the third paragraph: only the headline and dek are quotable.
    excerpt: "Bold flavors abound at chef Amrit Pal Singh's Punjabi favorite.",
    verbatim: true,
    date: "February 2025",
    url: "https://hellgatenyc.com/angel-indian-jackson-heights-review/",
    tier: "strong",
  },
  {
    id: "chowhound-best-indian",
    outlet: "Chowhound",
    kind: "listing",
    headline: "9 Of The Best Indian Restaurants In NYC",
    excerpt: "One can describe the wonders plated by Chef Amrit Pal Singh as bold and comforting.",
    verbatim: true,
    date: "August 2025",
    url: "https://www.chowhound.com/1935451/best-indian-food-restaurants-in-nyc/",
    tier: "strong",
  },
  {
    id: "culinary-backstreets",
    outlet: "Culinary Backstreets",
    kind: "article",
    headline: "Angel Indian Restaurant: Divine Eats",
    excerpt:
      "At Angel Indian Restaurant, one of two Indian restaurants with a Michelin distinction in Queens, New York, “simple but good” is chef and owner Amrit Pal Singh's guiding principle.",
    verbatim: true,
    date: "March 2022",
    url: "https://culinarybackstreets.com/cities-category/queens/2022/angel-indian-restaurant/",
    tier: "strong",
  },
  {
    id: "resy-hit-list",
    outlet: "Resy",
    kind: "listing",
    headline: "The Resy Hit List: Where In New York You'll Want to Eat",
    excerpt: "Resy's running list of where to eat in New York included Angel's second Jackson Heights location, noting it carries a different menu from the original.",
    verbatim: false,
    date: "August 2025",
    url: "https://blog.resy.com/2025/01/nyc-restaurants-aug-2025/",
    tier: "strong",
  },
  {
    id: "nyc-tourism",
    outlet: "NYC Tourism + Conventions",
    kind: "listing",
    headline: "In the official New York City visitor guide",
    excerpt: "Chef Amrit Pal Singh, an Adda alum, named it Angel after his young daughter.",
    verbatim: true,
    url: "https://www.nyctourism.com/restaurants/angel-indian-restaurant/",
    tier: "minor",
  },
  {
    id: "qns-michelin-list",
    outlet: "QNS.com",
    kind: "listing",
    headline: "Nearly 20 Queens Restaurants Make Michelin's Affordable Eats 2021 List",
    excerpt: "Queens local news reporting the 2021 Michelin selection, listing Angel on 37th Road as a new addition — independent confirmation of the Bib Gourmand.",
    verbatim: false,
    date: "May 2021",
    url: "https://qns.com/nearly-20-queens-restaurants-make-michelins-affordable-eats-2021-list/",
    tier: "minor",
  },
  {
    id: "indian-food-times",
    outlet: "Indian Food Times",
    kind: "article",
    headline: "A Michelin-recognised culinary dream: the new Jackson Heights branch",
    excerpt:
      "The trade report on the July 2025 opening, at which the outlet quotes chef Vikas Khanna calling Angel “the pride of India” and Chef Amrit “possibly one of the finest Indian chefs in the U.S.”",
    verbatim: false,
    date: "July 2025",
    url: "https://indianfoodtimes.com/angel-indian-restaurant-opens-new-branch-in-jackson-heights-new-york-a-michelin-recognized-culinary-dream-by-chef-amrit",
    tier: "minor",
  },
  {
    id: "fufski-film",
    outlet: "Fufski",
    kind: "video",
    headline: "Is This the Best Indian Food in Queens, NYC?",
    excerpt: "A food film shot at Angel in Jackson Heights, working through the menu.",
    verbatim: false,
    url: "https://www.youtube.com/watch?v=amumrB9Fqzg",
    tier: "minor",
  },
];

/** Headline figures. Each is substantiated by an item above. */
export const pressStats = [
  { value: "2021", label: "MICHELIN Bib Gourmand" },
  { value: "8.6", label: "The Infatuation, 2024" },
  { value: "12", label: "Publications & guides" },
];

/** Outlet names for the "as featured in" wall. Confirmed at the source only. */
export const pressOutlets = [
  "MICHELIN Guide",
  "Bon Appétit",
  "The Infatuation",
  "Time Out New York",
  "Resy",
  "Hell Gate NYC",
  "Chowhound",
  "Culinary Backstreets",
];

/**
 * The full bar launch, announced on angelindianrestaurant.com/full-bar-launch
 * (2 January 2026). First-party restaurant news, not third-party press — kept
 * separate from `press` above so the coverage wall stays "what the critics
 * wrote." Paraphrased from the release; the `quote` line is Chef Amrit's own
 * wording, copied exactly.
 */
export const barLaunch = {
  date: "January 2026",
  quote: "The addition of our full bar allows us to complete the dining experience.",
  offerings: [
    { kind: "wine" as const, label: "Wine", blurb: "Whites and reds chosen to sit with the spice, not fight it." },
    { kind: "cocktails" as const, label: "Cocktails", blurb: "House syrups and fresh spice alongside the classics, done properly." },
    { kind: "beer" as const, label: "Beer", blurb: "Local and imported, built for the tandoor and the biryani." },
    { kind: "mocktails" as const, label: "Mocktails", blurb: "Non-alcoholic, no less considered." },
  ],
};

/** Credentials strip. Genuine facts only. */
export const pressMarquee = [
  "MICHELIN Bib Gourmand · 2021 New York selection",
  "Owner & Head Chef, Angel Indian Restaurant",
  "Jackson Heights, Queens",
  "Trained at Rahi & Adda, New York",
  "Private Dining · Events · Residencies",
];
