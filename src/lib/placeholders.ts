/**
 * Content marked `isPlaceholder: true` is hidden in production unless
 * NEXT_PUBLIC_SHOW_PLACEHOLDERS=true. This guarantees no invented
 * testimonials or unpublished drafts reach visitors by accident.
 */
export const showPlaceholders = process.env.NEXT_PUBLIC_SHOW_PLACEHOLDERS === "true";

export function filterPlaceholders<T extends { isPlaceholder?: boolean }>(items: T[]): T[] {
  return showPlaceholders ? items : items.filter((item) => !item.isPlaceholder);
}
