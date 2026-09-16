"use client";

import { AnimatePresence, m, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ImageSequence } from "@/types/content";
import { platingSequence } from "@/data/sequences";
import { cn } from "@/lib/cn";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Em } from "@/components/ui/Heading";

const ease = [0.16, 1, 0.3, 1] as const;

const frameSrc = (seq: ImageSequence, i: number) => `${seq.prefix}${String(i + 1).padStart(3, "0")}.jpg`;

/**
 * Apple-style scroll-scrubbed sequence: the section pins for ~3 screens while
 * the frames of a dish being plated are drawn to a canvas in step with scroll.
 * Captions change at the phase thresholds defined in the sequence data.
 */
export function PlatingSequence({ sequence = platingSequence }: { sequence?: ImageSequence }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<HTMLImageElement[]>([]);
  const lastDrawn = useRef(-1);
  const [loaded, setLoaded] = useState(0);
  const [ready, setReady] = useState(false);
  const [phase, setPhase] = useState(0);
  const reduce = useReducedMotion();

  /*
    Phones and tablets get the still version. The scrub pins the page for 340vh
    and preloads all 48 frames (~2.8MB) to drive a canvas — on a touch device
    that is a long stretch of momentum scrolling against a pinned stage, paid
    for over mobile data. Starts false so the desktop render and the server
    render agree, then flips after mount; the preload below waits for it.
  */
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px), (pointer: coarse)");
    const update = () => setCompact(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const { scrollYProgress } = useScroll({ target: wrapRef, offset: ["start start", "end end"] });
  const frameIndex = useTransform(scrollYProgress, [0, 1], [0, sequence.count - 1]);
  const barScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  const draw = useCallback(
    (raw: number, force = false) => {
      const i = Math.max(0, Math.min(sequence.count - 1, Math.round(raw)));
      if (!force && i === lastDrawn.current) return;
      const canvas = canvasRef.current;
      const img = framesRef.current[i];
      if (!canvas || !img || !img.complete || img.naturalWidth === 0) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const cw = canvas.width;
      const ch = canvas.height;
      const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
      const w = img.naturalWidth * s;
      const h = img.naturalHeight * s;
      ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
      lastDrawn.current = i;
    },
    [sequence.count],
  );

  // Preload every frame once the section approaches the viewport.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || reduce || compact) return;
    let cancelled = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        let n = 0;
        framesRef.current = Array.from({ length: sequence.count }, (_, i) => {
          const img = new window.Image();
          img.decoding = "async";
          img.src = frameSrc(sequence, i);
          const done = () => {
            n += 1;
            if (cancelled) return;
            setLoaded(n);
            if (i === 0) draw(0, true);
            if (n === sequence.count) setReady(true);
          };
          img.onload = done;
          img.onerror = done;
          return img;
        });
      },
      { rootMargin: "120% 0px" },
    );
    io.observe(el);
    return () => {
      cancelled = true;
      io.disconnect();
    };
  }, [sequence, reduce, compact, draw]);

  // Size the canvas to the stage (capped DPR keeps memory sane on phones).
  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;
    const ro = new ResizeObserver(() => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(stage.clientWidth * dpr);
      canvas.height = Math.round(stage.clientHeight * dpr);
      draw(frameIndex.get(), true);
    });
    ro.observe(stage);
    return () => ro.disconnect();
  }, [draw, frameIndex]);

  useEffect(() => {
    if (ready) draw(frameIndex.get(), true);
  }, [ready, draw, frameIndex]);

  useMotionValueEvent(frameIndex, "change", (v) => draw(v));
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    let idx = 0;
    for (let i = 0; i < sequence.phases.length; i++) if (p >= sequence.phases[i].at) idx = i;
    setPhase(idx);
  });

  const current = sequence.phases[phase];

  /* Still of the finished dish and the four captions, no pinning. */
  if (reduce || compact) {
    return (
      <section id="plating" className="tone-dark relative overflow-hidden surface-brown-deep py-section">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={frameSrc(sequence, sequence.count - 1)}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover opacity-60"
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-brown-deep via-brown-deep/60 to-brown-deep/30" />
        <Container className="relative z-[2]">
          <Eyebrow>Interlude · The plating</Eyebrow>
          <ol className="mt-10 grid gap-8 sm:grid-cols-2 sm:gap-10 md:grid-cols-4 md:gap-8">
            {sequence.phases.map((ph, i) => (
              <li key={ph.title}>
                <p className="eyebrow text-[0.58rem] text-gold-light">
                  {String(i + 1).padStart(2, "0")} · {ph.eyebrow}
                </p>
                <p className="mt-2 font-display text-display-sm font-light text-gold-gradient">{ph.title}</p>
                <p className="mt-2 text-sm text-fg/70">{ph.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>
    );
  }

  return (
    <section id="plating" ref={wrapRef} className="tone-dark relative surface-brown-deep" style={{ height: "340vh" }} aria-label="A dish being plated">
      <div ref={stageRef} className="sticky top-0 h-[100svh] overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-brown-deep/85 via-brown-deep/30 to-transparent" />
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-brown-deep/90 to-transparent" />
        <div aria-hidden className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-brown-deep to-transparent" />

        <Container className="relative z-[2] flex h-full flex-col justify-end pb-14 pt-32 md:justify-center md:pb-0">
          <div className="max-w-xl">
            <Eyebrow>Interlude · The plating</Eyebrow>
            <div className="mt-8 min-h-[14rem] md:min-h-[16rem]">
              <AnimatePresence mode="wait">
                <m.div
                  key={current.title}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.6, ease }}
                >
                  <p className="eyebrow text-[0.6rem] text-gold-light">
                    {String(phase + 1).padStart(2, "0")} · {current.eyebrow}
                  </p>
                  <p className="mt-4 font-display text-display-md font-light text-fg md:text-display-lg">
                    {phase === sequence.phases.length - 1 ? <Em shimmer>{current.title}</Em> : current.title}
                  </p>
                  <p className="mt-5 max-w-md text-lead text-fg/75">{current.body}</p>
                </m.div>
              </AnimatePresence>
            </div>

            {/* progress */}
            <div className="mt-8 flex items-center gap-4">
              <ol className="flex items-center gap-2" aria-hidden>
                {sequence.phases.map((ph, i) => (
                  <li
                    key={ph.title}
                    className={cn(
                      "rounded-full transition-all duration-500",
                      i === phase ? "h-2 w-6 bg-gradient-to-r from-gold-light to-gold shadow-[0_0_10px_rgba(226,189,108,0.9)]" : "size-2 bg-fg/30",
                    )}
                  />
                ))}
              </ol>
              <span className="relative block h-px flex-1 overflow-hidden bg-fg/15">
                <m.span className="absolute inset-y-0 left-0 w-full origin-left bg-gold" style={{ scaleX: barScale }} />
              </span>
              <span className="eyebrow text-[0.55rem] text-fg/50">{ready ? "Scroll to plate" : `Loading ${Math.round((loaded / sequence.count) * 100)}%`}</span>
            </div>
          </div>
        </Container>
      </div>
    </section>
  );
}
