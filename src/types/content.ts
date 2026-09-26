export type ImageAsset = {
  src: string;
  alt: string;
  width: number;
  height: number;
  credit?: string;
  /** true while the image is a stock placeholder awaiting real photography */
  placeholder?: boolean;
};

export type Address = {
  street: string;
  city: string;
  region: string;
  postal: string;
  country: string;
};

export type SiteConfig = {
  name: string;
  shortName: string;
  url: string;
  description: string;
  locale: string;
  restaurant: {
    name: string;
    address: Address;
    phone?: string;
    resyUrl?: string;
    mapsUrl?: string;
    /** The restaurant's own full menu, with prices, on angelindianrestaurant.com. */
    menuUrl?: string;
    hours: string;
    notes: string[];
  };
  social: { instagram?: string; facebook?: string };
  contactEmail?: string;
  cta: { label: string; href: string };
  /** Personal thank-you video sent after a contact message and shown on the success screen. */
  thankYou: { videoUrl: string; poster: ImageAsset; headline: string; message: string };
};

export type NavItem = {
  label: string;
  href: string;
  /** Hidden everywhere (e.g. Testimonials until genuine quotes exist). */
  hidden?: boolean;
  /** Shown in the footer and mobile menu but not in the desktop header. */
  secondary?: boolean;
};

export type RestaurantProfile = {
  name: string;
  shortName: string;
  tagline: string;
  /** e.g. "Named after his daughter" */
  namesake: string;
  founded: string;
  intro: string;
  story: string[];
  features: string[];
  facts: { value: string; label: string }[];
  locations: {
    name: string;
    kind: "original" | "upscale";
    description: string;
    highlights: string[];
    image: ImageAsset;
  }[];
  heroImage: ImageAsset;
  storyImage: ImageAsset;
  barImage: ImageAsset;
  /** Before / after slider: the 2019 kitchen versus the new dining room. */
  thenNow: {
    before: { image: ImageAsset; label: string; caption: string };
    after: { image: ImageAsset; label: string; caption: string };
  };
};

export type TimelineEntry = { year: string; title: string; body: string };

export type ChefProfile = {
  name: string;
  firstName: string;
  title: string;
  positioning: string;
  location: string;
  shortBio: string;
  longBio: string[];
  portrait: ImageAsset;
  heroImage: ImageAsset;
  timeline: TimelineEntry[];
  training: { title: string; body: string }[];
  specialties: string[];
  philosophy: { quote: string; body: string[] };
  stats: { value: string; label: string }[];
  restaurants: { name: string; role: string; location: string; note?: string }[];
  /** Genuine recognition only. Never add unverified awards. */
  recognition: { title: string; issuer: string; note?: string }[];
};

export type DietaryTag = "vegetarian" | "vegan" | "gluten-free" | "contains-nuts" | "halal" | "dairy";

export type Dish = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  image: ImageAsset;
  tags: DietaryTag[];
  signature: boolean;
  order: number;
};

export type MenuCourse = {
  title: string;
  dishId?: string;
  name?: string;
  description?: string;
  tags?: DietaryTag[];
  status: "confirmed" | "draft";
};

export type Menu = {
  slug: string;
  name: string;
  kind: "tasting";
  courseCount: number;
  courseLabel: string;
  intro: string;
  courses: MenuCourse[];
  notes: string[];
  /** Where this menu is served, e.g. "At Angel · Jackson Heights". */
  venue: string;
  pdfUrl?: string;
  featured: boolean;
  image: ImageAsset;
};

export type GalleryCategory =
  | "signature-dishes"
  | "private-dining"
  | "events"
  | "behind-the-scenes"
  | "chef-in-action"
  | "plating";

export type GalleryItem = {
  id: string;
  image: ImageAsset;
  category: GalleryCategory;
  caption?: string;
  featured?: boolean;
  span?: "wide" | "tall" | "square";
};

export type ArticleBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "quote"; text: string; by?: string }
  | { type: "image"; image: ImageAsset };

export type Article = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readingTime: number;
  cover: ImageAsset;
  blocks: ArticleBlock[];
  status: "published" | "draft";
  isPlaceholder?: boolean;
};

export type PressItem = {
  id: string;
  outlet: string;
  kind: "award" | "listing" | "quote" | "article" | "video";
  headline: string;
  excerpt?: string;
  date?: string;
  url?: string;
  /** Flagship items get the large feature treatment on /press. */
  tier?: "flagship" | "strong" | "minor";
  /** true when `excerpt` is quoted verbatim from the source, not a summary. */
  verbatim?: boolean;
};

export type Testimonial = {
  id: string;
  quote: string;
  author: string;
  role?: string;
  context?: string;
  isPlaceholder: boolean;
};