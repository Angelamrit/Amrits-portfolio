"use client";

import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";

/** How long a panel takes to slide open or shut. Matches `.accordion` in globals.css. */
const SLIDE_MS = 520;

/**
 * One-open-at-a-time accordion for the phone layouts of the dish showcase and
 * the menu courses, tuned so that opening a photograph stays smooth on a phone.
 *
 * Opening a row used to set three things moving at once: the new panel sliding
 * open, the previous one sliding shut, and half a second later a smooth scroll
 * to chase the tapped row, which the panel shutting above it had dragged up the
 * screen. Each of those re-lays out and repaints the page on every frame. A
 * laptop absorbs that; a phone drops frames, and the photograph stutters open.
 *
 * Now, when the open panel is above the tapped row, it closes at once and the
 * page is scrolled by exactly the height it gave up, in the same frame, so the
 * tapped row stays under the finger and nothing needs chasing. Only the new
 * panel slides. Afterwards the page scrolls only if the opened panel does not
 * fit on screen, by just enough to show it. A panel below the tapped row, or
 * one tapped shut, still slides closed as before: it moves nothing above it.
 */
export function useAccordion(items: RefObject<(HTMLElement | null)[]>, { initial = 0 as number | null, reduce = false } = {}) {
  const [open, setOpen] = useState<number | null>(initial);
  /** The panel that is sliding shut, kept rendered until its transition ends. */
  const [closing, setClosing] = useState<number | null>(null);
  /** The tapped row and where it was on screen, to hold it there after the commit. */
  const anchor = useRef<{ index: number; top: number } | null>(null);
  const followUp = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (closing === null) return;
    const t = window.setTimeout(() => setClosing(null), SLIDE_MS);
    return () => window.clearTimeout(t);
  }, [closing]);

  useEffect(() => () => window.clearTimeout(followUp.current), []);

  // Runs after React has applied the change and before the browser paints it,
  // so the correction and the change land in the same frame: no visible jump.
  useLayoutEffect(() => {
    const held = anchor.current;
    if (!held) return;
    anchor.current = null;
    const row = items.current?.[held.index];
    if (!row) return;
    const shift = row.getBoundingClientRect().top - held.top;
    if (Math.abs(shift) >= 1) window.scrollTo({ top: window.scrollY + shift, behavior: "instant" });
  });

  const toggle = (index: number) => {
    const opening = open !== index;
    const previous = open;
    const row = items.current?.[index];

    if (opening && previous !== null && previous < index && row) {
      anchor.current = { index, top: row.getBoundingClientRect().top };
      setClosing(null);
    } else {
      setClosing(previous);
    }
    setOpen(opening ? index : null);

    window.clearTimeout(followUp.current);
    if (!opening || !row) return;
    followUp.current = window.setTimeout(
      () => {
        const box = row.getBoundingClientRect();
        if (box.bottom > window.innerHeight || box.top < 0) {
          row.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
        }
      },
      reduce ? 0 : SLIDE_MS,
    );
  };

  return { open, setOpen, closing, toggle };
}
