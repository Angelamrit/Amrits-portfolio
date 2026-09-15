import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge cannot tell whether a custom `text-*` utility is a size or a
 * colour, so declare the theme's font-size tokens explicitly. Without this,
 * cn("text-display-lg", "text-ivory") would drop the size.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["display-xl", "display-lg", "display-md", "display-sm", "lead", "eyebrow"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
