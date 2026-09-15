import type { ImageSequence } from "@/types/content";

/**
 * Scroll-scrubbed plating sequence.
 * The shipped frames are a generated placeholder (a dish emerging from a dark
 * plate). To use real footage: export 48–96 frames of a dish being plated at
 * 1400×875, name them frame-001.jpg … and update `count`.
 */
export const platingSequence: ImageSequence = {
  prefix: "/sequences/plating/frame-",
  count: 48,
  width: 1400,
  height: 875,
  placeholder: true,
  phases: [
    { at: 0, eyebrow: "The base", title: "It starts with the paneer.", body: "Made in-house at dawn, pressed, then charred in the tandoor until the edges catch." },
    { at: 0.3, eyebrow: "The heat", title: "Then the gravy.", body: "Spices ground the same morning, simmered slowly until the sauce clings to the spoon." },
    { at: 0.6, eyebrow: "The finish", title: "Coriander. Lime. Nothing more.", body: "No excess, no shortcuts: just enough to let each ingredient taste like itself." },
    { at: 0.85, eyebrow: "Served", title: "Simple but good.", body: "Exactly as it leaves the pass at Angel, and exactly as it arrives at your table." },
  ],
};
