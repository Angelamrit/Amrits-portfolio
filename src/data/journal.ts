import type { Article } from "@/types/content";
import { images } from "./images";

/**
 * Journal articles. The five titles below follow the project brief and are
 * written in Chef Amrit's voice from verified facts. They are `draft` and
 * `isPlaceholder` until the chef reviews and approves them. Flip `status`
 * to "published" and `isPlaceholder` to false to release each one.
 */
export const articles: Article[] = [
  {
    slug: "the-art-of-plating",
    title: "The Art of Plating",
    excerpt: "Why the plate at Angel stays quiet, and what a chaat taught me about restraint.",
    date: "2026-09-01",
    readingTime: 4,
    cover: images.platedFine,
    status: "draft",
    isPlaceholder: true,
    blocks: [
      { type: "p", text: "In Punjab, food is not plated. It is served. A thali arrives with everything at once and the eye finds its own order. When I opened Angel I wanted to keep that generosity, but I also wanted each dish to have a moment of its own." },
      { type: "h2", text: "Simple but good, on the plate" },
      { type: "p", text: "My mother's rule was simple but good. On a plate that means fewer elements, each one doing real work. A Dahi Batata Puri needs the puri, the potato, the yogurt, the chutneys. It does not need a flower." },
      { type: "quote", text: "If a garnish does not change the taste, it does not go on the plate." },
      { type: "p", text: "At the new dining room, where the tasting menu is served, plating becomes a pace. Seven courses arrive one at a time, and the space around each dish is as deliberate as the dish itself." },
    ],
  },
  {
    slug: "five-seasonal-ingredients-i-love",
    title: "5 Seasonal Ingredients I Love",
    excerpt: "Kale, cauliflower, fresh paneer and two more that decide what Angel cooks each season.",
    date: "2026-08-15",
    readingTime: 5,
    cover: images.prepOverhead,
    status: "draft",
    isPlaceholder: true,
    blocks: [
      { type: "p", text: "A predominantly vegetarian kitchen lives and dies by its vegetables. These are the ingredients I look for first when the season turns." },
      { type: "h2", text: "1. Kale" },
      { type: "p", text: "Our Kale Pakora happened because the leaves fry to a shatter that spinach never quite manages. Chickpea flour, a little ajwain, very hot oil." },
      { type: "h2", text: "2. Cauliflower" },
      { type: "p", text: "Lassuni Gobi is the dish guests come back for. It needs a firm, tight head of cauliflower that chars without collapsing, and a lot of garlic." },
      { type: "h2", text: "3. Milk, for paneer" },
      { type: "p", text: "We make paneer in-house every day. Good, fresh milk is the whole recipe." },
      { type: "h2", text: "4. Basmati rice" },
      { type: "p", text: "Aged basmati is what lets a Vegetable Dum Biryani steam into separate, fragrant grains under seal." },
      { type: "h2", text: "5. Fresh coriander" },
      { type: "p", text: "The last thing on almost every plate. Chopped the same morning, never the night before." },
    ],
  },
  {
    slug: "behind-my-signature-dish",
    title: "Behind My Signature Dish",
    excerpt: "Lassuni Gobi: garlic, cauliflower and the fire of a six-burner stove in a tiny Jackson Heights kitchen.",
    date: "2026-07-20",
    readingTime: 4,
    cover: images.lassuniGobi,
    status: "draft",
    isPlaceholder: true,
    blocks: [
      { type: "p", text: "When Angel opened in October 2019 we had a six-burner stove, one tandoor and one fridge. Lassuni Gobi was on the menu from the first night because it could be cooked fast, hot and honestly on that stove." },
      { type: "p", text: "Lassuni means garlic. The cauliflower is roasted until the edges catch, then tossed in a tangy, garlic-heavy sauce that is bold without being heavy. It is simple but good, which is the only rule I cook by." },
      { type: "quote", text: "It was a two-person restaurant. I cooked, I took orders, I cleaned. That dish paid the rent.", by: "Chef Amrit" },
    ],
  },
  {
    slug: "how-i-design-a-tasting-menu",
    title: "How I Design a Tasting Menu",
    excerpt: "Seven courses, one journey: from the street food of Punjab to the slow-cooked dishes of the regions.",
    date: "2026-06-30",
    readingTime: 6,
    cover: images.thaliOverhead,
    status: "draft",
    isPlaceholder: true,
    blocks: [
      { type: "p", text: "The chef's tasting menu at our new location is the first time I have been able to tell the whole story in order. It begins where I began, with street food, and ends with the slow, regional cooking I learned to respect at Rahi and Adda." },
      { type: "h2", text: "Start light, start loud" },
      { type: "p", text: "A tasting menu should open with a jolt. Dahi Batata Puri does that: cold yogurt, crisp puri, sweet and sour chutney in one bite." },
      { type: "h2", text: "Build toward the tandoor" },
      { type: "p", text: "Kale Pakora, then Lassuni Gobi, then paneer from the tandoor. Each course a little hotter, a little deeper." },
      { type: "h2", text: "Rest on rice" },
      { type: "p", text: "Vegetable Dum Biryani is the anchor. After that, the meal slows down for a regional course and a sweet." },
    ],
  },
  {
    slug: "a-night-in-the-kitchen",
    title: "A Night in the Kitchen",
    excerpt: "From lighting the tandoor at four to the last order at eleven: a dinner service at Angel.",
    date: "2026-06-10",
    readingTime: 5,
    cover: images.kitchenLine,
    status: "draft",
    isPlaceholder: true,
    blocks: [
      { type: "p", text: "The tandoor is lit first, because it takes the longest to come up to heat. Then the paneer is pressed, the chutneys are blended, and the coriander is chopped." },
      { type: "p", text: "Today more than twenty people work at Angel. In 2019 there were two of us. The rhythm of a service has not changed much; there are just more hands to keep it." },
      { type: "quote", text: "The dining room is named after my daughter. I cook every plate as if she were at the table." },
    ],
  },
];

export const articleBySlug = (slug: string) => articles.find((a) => a.slug === slug);
