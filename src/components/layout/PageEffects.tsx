"use client";

import { useEffect } from "react";

/**
 * Every scroll reveal and every card spotlight on the page, run by one small
 * script instead of one React component per element.
 *
 * Reveals, image frames and spotlight cards used to be client components —
 * a couple of hundred on the longer pages — and each had to hydrate before the
 * page answered a tap. They are now plain server-rendered HTML carrying data
 * attributes, and this component, mounted once in SiteShell, brings them to
 * life:
 *
 * - `[data-reveal]`, `[data-reveal-group]`, `[data-img-reveal]` get
 *   `data-shown` the first time they scroll into view; the transitions are CSS
 *   (globals.css). Elements inside an off-screen lazy section are only watched
 *   once that section is near, because measuring inside it would force the
 *   browser to render it (see `.section-lazy`).
 * - `[data-spotlight]` cards follow the mouse with a soft light and, when
 *   `data-tilt` is set, a slight 3D tilt — through one delegated listener.
 *
 * A MutationObserver picks up content added after the first load (client-side
 * navigation, menu switches, the dish accordion), so nothing needs to register
 * itself.
 */

const REVEAL = "[data-reveal]:not([data-shown]), [data-reveal-group]:not([data-shown]), [data-img-reveal]:not([data-shown])";

export function PageEffects() {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      document.querySelectorAll(REVEAL).forEach((el) => el.setAttribute("data-shown", ""));
      return;
    }

    const show = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-shown", "");
          show.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );

    const waiting = new Map<Element, Element[]>();
    const sections = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          sections.unobserve(entry.target);
          waiting.get(entry.target)?.forEach((el) => show.observe(el));
          waiting.delete(entry.target);
        }
      },
      { rootMargin: "100% 0px 100% 0px" },
    );

    const watch = (el: Element) => {
      // A group's items stagger by their place in it.
      if (el.hasAttribute("data-reveal-group")) {
        el.querySelectorAll<HTMLElement>("[data-reveal-item]").forEach((item, i) => item.style.setProperty("--reveal-i", String(i)));
      }
      const section = el.closest(".section-lazy");
      if (!section) {
        show.observe(el);
        return;
      }
      const list = waiting.get(section);
      if (list) list.push(el);
      else {
        waiting.set(section, [el]);
        sections.observe(section);
      }
    };

    const scan = (root: ParentNode) => {
      if (root instanceof Element && root.matches(REVEAL)) watch(root);
      root.querySelectorAll(REVEAL).forEach(watch);
    };

    scan(document);
    const added = new MutationObserver((records) => {
      for (const record of records) record.addedNodes.forEach((node) => node instanceof Element && scan(node));
    });
    added.observe(document.body, { childList: true, subtree: true });

    return () => {
      show.disconnect();
      sections.disconnect();
      added.disconnect();
    };
  }, []);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
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
      if (e.pointerType !== "mouse" || !fine.matches) return;
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
