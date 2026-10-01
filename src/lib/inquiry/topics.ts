/**
 * What a guest can write to the chef about. Chef Amrit cooks only at Angel —
 * there is no private dining or event booking — so these are messages, not
 * booking requests. Table reservations go through the restaurant.
 *
 * Kept apart from the Zod schema in `lib/validation/inquiry.ts` so the contact
 * form can show these without shipping Zod to the browser.
 */
export const topicOptions = ["angel", "press", "collaboration", "other"] as const;
export type Topic = (typeof topicOptions)[number];

export const topicLabels: Record<Topic, string> = {
  angel: "Dining at Angel",
  press: "Press & media",
  collaboration: "Collaboration",
  other: "Something else",
};
