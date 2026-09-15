"use client";

import Image from "next/image";
import { MoveHorizontal } from "lucide-react";
import { useCallback, useRef, useState, type PointerEvent } from "react";
import type { ImageAsset } from "@/types/content";
import { cn } from "@/lib/cn";

export type CompareSide = { image: ImageAsset; label: string; caption: string };

type Props = {
  before: CompareSide;
  after: CompareSide;
  /** Tailwind aspect class for the frame. */
  ratio?: string;
  initial?: number;
  className?: string;
  sizes?: string;
};

/**
 * Before / after slider. Drag the handle (mouse or touch), or focus it and use
 * the arrow keys. The "before" image is clipped to the left of the handle.
 */
export function CompareSlider({ before, after, ratio = "aspect-[4/3]", initial = 55, className, sizes = "(min-width: 1024px) 50vw, 100vw" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const [pos, setPos] = useState(initial);

  const update = useCallback((clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos(Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100)));
  }, []);

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    update(e.clientX);
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (dragging.current) update(e.clientX);
  };
  const onUp = () => {
    dragging.current = false;
  };

  return (
    <div className={cn("tone-dark", className)}>
      <div
        ref={ref}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        className={cn("group relative cursor-ew-resize touch-pan-y select-none overflow-hidden rounded-frame border-gradient bg-sand shadow-glow-lg", ratio)}
      >
        {/* after (full) */}
        <Image src={after.image.src} alt={after.image.alt} fill sizes={sizes} className="object-cover" draggable={false} />
        {/* before (clipped) */}
        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          <Image src={before.image.src} alt={before.image.alt} fill sizes={sizes} className="object-cover" draggable={false} />
          <div aria-hidden className="absolute inset-0 bg-brown-deep/20" />
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brown-deep/85 via-transparent to-brown-deep/20" />

        {/* labels */}
        <span className="glass pointer-events-none absolute left-4 top-4 z-[3] rounded-pill px-3 py-1.5 eyebrow text-[0.58rem] text-gold-light">{before.label}</span>
        <span className="glass pointer-events-none absolute right-4 top-4 z-[3] rounded-pill px-3 py-1.5 eyebrow text-[0.58rem] text-gold-light">{after.label}</span>

        {/* captions */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] grid grid-cols-2 gap-4 p-4 md:p-6">
          <p className="text-xs leading-relaxed text-fg/85 transition-opacity duration-300 md:text-sm" style={{ opacity: pos > 22 ? 1 : 0.25 }}>
            {before.caption}
          </p>
          <p className="text-right text-xs leading-relaxed text-fg/85 transition-opacity duration-300 md:text-sm" style={{ opacity: pos < 78 ? 1 : 0.25 }}>
            {after.caption}
          </p>
        </div>

        {/* handle */}
        <div aria-hidden className="pointer-events-none absolute inset-y-0 z-[4]" style={{ left: `${pos}%` }}>
          <span className="absolute inset-y-0 -left-px w-0.5 bg-gradient-to-b from-gold-light/0 via-gold-light to-gold-light/0 shadow-[0_0_14px_rgba(240,217,160,0.9)]" />
          <span className="glass-strong absolute top-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-gold-light shadow-glow transition-transform duration-300 group-hover:scale-110">
            <MoveHorizontal className="size-5" strokeWidth={1.5} />
          </span>
        </div>

        {/* keyboard control */}
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(pos)}
          onChange={(e) => setPos(Number(e.target.value))}
          aria-label={`Compare ${before.label} and ${after.label}`}
          className="absolute inset-x-0 bottom-0 z-[5] h-8 w-full cursor-ew-resize opacity-0 focus-visible:opacity-100"
        />
      </div>
    </div>
  );
}
