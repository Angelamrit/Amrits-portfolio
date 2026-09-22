"use client";

import { LazyMotion, domAnimation } from "motion/react";
import { ReactLenis } from "lenis/react";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  const [smooth, setSmooth] = useState(false);

  // Smooth scrolling is part of the public site's cinematic feel. The
  // dashboard is a working tool: there it takes over the mouse wheel, makes
  // every scroll feel a beat behind the hand, and stops inner scrolling areas —
  // the photo picker, the table under a chart — from answering the wheel. So
  // it is off anywhere under /admin, and the dashboard scrolls natively.
  const pathname = usePathname();
  const inDashboard = pathname?.startsWith("/admin") ?? false;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarse = window.matchMedia("(pointer: coarse)");
    const update = () => setSmooth(!mq.matches && !coarse.matches);
    update();
    mq.addEventListener("change", update);
    coarse.addEventListener("change", update);
    return () => {
      mq.removeEventListener("change", update);
      coarse.removeEventListener("change", update);
    };
  }, []);

  const content = <LazyMotion features={domAnimation} strict>{children}</LazyMotion>;

  if (!smooth || inDashboard) return content;

  return (
    <ReactLenis root options={{ lerp: 0.09, smoothWheel: true, anchors: true }}>
      {content}
    </ReactLenis>
  );
}
