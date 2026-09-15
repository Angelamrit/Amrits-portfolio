"use client";

import { LazyMotion, domAnimation } from "motion/react";
import { ReactLenis } from "lenis/react";
import { useEffect, useState, type ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  const [smooth, setSmooth] = useState(false);

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

  if (!smooth) return content;

  return (
    <ReactLenis root options={{ lerp: 0.09, smoothWheel: true, anchors: true }}>
      {content}
    </ReactLenis>
  );
}
