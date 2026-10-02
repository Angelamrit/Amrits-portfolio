"use client";

import { getImageProps } from "next/image";
import { useEffect } from "react";
import { capPixelDensity } from "./sizes";

type Connection = { saveData?: boolean; effectiveType?: string };

type Options = {
  /** Same `quality` as the `<Image>` that will show these pictures. */
  quality?: number;
  /** Only prefetch while this media query matches (the layout that shows them). */
  media?: string;
  enabled?: boolean;
};

/**
 * Downloads photographs that are not on the page yet but are about to be: the
 * next dish in the rotating showcase, a course photo the visitor may tap open,
 * the next picture in the gallery viewer. Without it each of those started
 * downloading only at the moment it was shown, and from a server on the other
 * side of the world that meant a blurred placeholder for a second or more at
 * every switch.
 *
 * It asks for exactly the file the real `<Image>` will ask for: the same
 * `getImageProps` builds the `srcset`, with the same `sizes` and `quality`, and
 * the browser makes the same choice from it for this screen, so when the
 * picture appears it comes straight out of the browser's cache. Pass the
 * `sizes` exactly as written on that `<Image>`.
 *
 * Waits for the page to finish loading and for the browser to be idle, asks at
 * low priority, and does nothing for a visitor saving data or on 2G.
 */
export function usePrefetchImages(images: readonly { src: string }[], sizes: string, { quality, media, enabled = true }: Options = {}) {
  const key = [...new Set(images.map((image) => image.src))].join("\n");

  useEffect(() => {
    if (!enabled || !key) return;
    if (media && !window.matchMedia(media).matches) return;
    const connection = (navigator as Navigator & { connection?: Connection }).connection;
    if (connection?.saveData || /2g/.test(connection?.effectiveType ?? "")) return;

    let cancelled = false;
    let idle: number | undefined;
    // Held until each one finishes, so nothing collects a request mid-flight.
    const inFlight = new Set<HTMLImageElement>();

    const run = () => {
      if (cancelled) return;
      for (const src of key.split("\n")) {
        const { props } = getImageProps({ src, alt: "", fill: true, sizes: capPixelDensity(sizes), quality });
        const img = new window.Image();
        img.decoding = "async";
        img.fetchPriority = "low";
        // sizes and srcset before src, or Safari starts on src alone.
        if (props.sizes) img.sizes = props.sizes;
        if (props.srcSet) img.srcset = props.srcSet;
        const done = () => inFlight.delete(img);
        img.addEventListener("load", done, { once: true });
        img.addEventListener("error", done, { once: true });
        inFlight.add(img);
        img.src = props.src;
      }
    };
    const schedule = () => {
      if (cancelled) return;
      idle = typeof window.requestIdleCallback === "function" ? window.requestIdleCallback(run, { timeout: 2000 }) : window.setTimeout(run, 300);
    };

    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });

    return () => {
      cancelled = true;
      window.removeEventListener("load", schedule);
      if (idle !== undefined) {
        if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idle);
        window.clearTimeout(idle);
      }
    };
  }, [key, sizes, quality, media, enabled]);
}
