/**
 * The round gold button that opens the assistant, shared by the real widget and
 * the lightweight stand-in `ChatLauncher` shows until the widget has loaded, so
 * the swap from one to the other is invisible.
 *
 * On mobile it sits above the sticky booking bar, which owns the bottom edge.
 */
export const LAUNCHER_CLASS = [
  "fixed right-3 bottom-22 z-[75] flex size-13 items-center justify-center rounded-pill md:right-6 md:bottom-6",
  "bg-gradient-to-r from-gold-light via-gold to-gold-deep text-charcoal",
  "shadow-glow transition-all duration-500 ease-luxe",
  "hover:-translate-y-0.5 hover:shadow-glow-lg focus-visible:outline-gold",
].join(" ");
