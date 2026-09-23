"use client";

import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

type Phase = "idle" | "covering" | "covered";

const ease = [0.76, 0, 0.24, 1] as const;

// Kept short on purpose: this curtain blocks the actual navigation until it
// finishes covering the screen, so every millisecond here is added latency
// on top of whatever Next.js itself takes. Longer values look nicer in
// isolation but make every click feel sluggish.
const COVER_S = 0.15;
const STAGGER_S = 0.03;
const POST_NAV_WAIT_MS = 30;

const curtain = {
  hidden: { y: "100%" },
  show: { y: "0%" },
  exit: { y: "-100%" },
};

/**
 * Chocolate-to-gold wipe between pages. Internal link clicks are intercepted,
 * the curtain rises, the route changes underneath it, then the curtain lifts
 * away to reveal the new page. Hash links, modifier clicks, external links and
 * reduced-motion users bypass it entirely.
 */
export function PageTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("idle");
  const phaseRef = useRef<Phase>("idle");
  const target = useRef<string | null>(null);
  const lastPath = useRef(pathname);

  const go = (next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  };

  useEffect(() => {
    if (reduce) return;
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download") || a.dataset.noTransition !== undefined) return;
      let url: URL;
      try {
        url = new URL(a.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return; // same page: hash / query only
      if (phaseRef.current !== "idle") {
        e.preventDefault();
        return;
      }
      e.preventDefault();
      target.current = url.pathname + url.search + url.hash;
      router.prefetch(url.pathname);
      go("covering");
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router, reduce]);

  // The route changed underneath the curtain: lift it.
  useEffect(() => {
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    if (phaseRef.current !== "idle") {
      const t = window.setTimeout(() => go("idle"), POST_NAV_WAIT_MS);
      return () => window.clearTimeout(t);
    }
  }, [pathname]);

  // Safety net: never leave the curtain up if navigation stalls.
  useEffect(() => {
    if (phase !== "covered") return;
    const t = window.setTimeout(() => go("idle"), 6000);
    return () => window.clearTimeout(t);
  }, [phase]);

  const onCovered = () => {
    if (phaseRef.current !== "covering") return;
    go("covered");
    if (target.current) router.push(target.current);
  };

  return (
    <AnimatePresence>
      {phase !== "idle" && (
        <m.div key="wipe" aria-hidden className="pointer-events-none fixed inset-0 z-[200] overflow-hidden">
          <m.div
            className="absolute inset-0 bg-brown-deep"
            variants={curtain}
            initial="hidden"
            animate="show"
            exit="exit"
            transition={{ duration: COVER_S, ease }}
          />
          <m.div
            className="absolute inset-0 bg-gradient-to-br from-gold-light via-gold to-gold-deep"
            variants={curtain}
            initial="hidden"
            animate="show"
            exit="exit"
            transition={{ duration: COVER_S, ease, delay: STAGGER_S }}
            onAnimationComplete={(def) => def === "show" && onCovered()}
          />
          <m.div
            className="absolute inset-0 grid place-items-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: COVER_S, delay: STAGGER_S * 2 }}
          >
            <span className="grid size-24 place-items-center rounded-full border border-brown-deep/30 font-display text-5xl font-light text-brown-deep">A</span>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
