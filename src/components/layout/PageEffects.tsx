"use client";

import { useEffect } from "react";

/**
 * The cursor spotlight and tilt on every `[data-spotlight]` card, through one
 * delegated pointer listener, so a page full of cards costs no per-card
 * JavaScript. Mouse only: on touch screens there is no cursor to follow.
 *
 * The scroll reveals used to start here as well. They are now run by the
 * inline script in SiteShell, which needs no bundle to have arrived — this
 * component mounts only after hydration, and on a phone that was too late for
 * someone who scrolled straight away.
 */
export function PageEffects() {
  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (!fine.matches) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    let current: HTMLElement | null = null;
    let frame = 0;
    let last: PointerEvent | null = null;

    const reset = () => {
      if (current) current.style.transform = "";
      current = null;
    };

    const update = () => {
      frame = 0;
      const e = last;
      if (!e) return;
      const card = (e.target as Element | null)?.closest?.<HTMLElement>("[data-spotlight]") ?? null;
      if (card !== current) reset();
      if (!card) return;
      current = card;
      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      card.style.setProperty("--mx", `${x}px`);
      card.style.setProperty("--my", `${y}px`);
      const tilt = Number(card.dataset.tilt ?? 0);
      if (!tilt || still.matches) return;
      const rx = (y / r.height - 0.5) * -tilt;
      const ry = (x / r.width - 0.5) * tilt;
      card.style.transform = `perspective(1200px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`;
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      last = e;
      if (!frame) frame = requestAnimationFrame(update);
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", reset);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", reset);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
