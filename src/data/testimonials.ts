import type { Testimonial } from "@/types/content";

/**
 * Client testimonials must be genuine, with permission.
 * The site ships with none. When real feedback is available, add it here
 * with `isPlaceholder: false` and un-hide the Testimonials link in nav.ts.
 */
export const testimonials: Testimonial[] = [];

/** Recognition from peers and critics that is publicly documented. */
export const voices = [
  {
    id: "vikas-khanna",
    quote: "One of the finest Indian chefs in the U.S.",
    author: "Chef Vikas Khanna",
    role: "Michelin-starred chef and author",
    context: "Publicly describing Chef Amrit and calling Angel's expansion a “pride of India”",
  },
];
