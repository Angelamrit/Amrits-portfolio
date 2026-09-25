"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/**
 * Whether the visitor has asked for reduced motion. The server (and the first
 * client render) assume they have not; the value settles right after hydration.
 * Visual motion is switched off in CSS anyway — this is for behaviour that CSS
 * cannot reach, like auto-advancing slideshows.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
