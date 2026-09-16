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
    quote: "This is the pride of India. Possibly one of the finest Indian chefs in the U.S.",
    author: "Chef Vikas Khanna",
    role: "Michelin-starred chef and author",
    context: "Speaking at the opening of Angel's new dining room, July 2025",
  },
];
