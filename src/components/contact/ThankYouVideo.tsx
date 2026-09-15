"use client";

import Image from "next/image";
import { Play } from "lucide-react";
import { useRef, useState } from "react";
import { site } from "@/data/site";
import { cn } from "@/lib/cn";

/**
 * Chef Amrit's personal thank-you clip. Plays inline from the poster; if the
 * file has not been uploaded yet, it falls back to the poster and written note.
 */
export function ThankYouVideo({ className }: { className?: string }) {
  const { videoUrl, poster, headline } = site.thankYou;
  const ref = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<"poster" | "playing" | "missing">("poster");

  const play = () => {
    const v = ref.current;
    if (!v) return;
    v.play()
      .then(() => setState("playing"))
      .catch(() => setState("missing"));
  };

  return (
    <div className={cn("tone-dark relative overflow-hidden rounded-[1.5rem] border-gradient bg-sand shadow-glow-lg", className)}>
      <div className="relative aspect-video">
        {state !== "playing" && <Image src={poster.src} alt={poster.alt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" priority />}
        <video
          ref={ref}
          className={cn("absolute inset-0 h-full w-full object-cover", state === "playing" ? "opacity-100" : "opacity-0")}
          playsInline
          controls={state === "playing"}
          preload="metadata"
          onError={() => setState("missing")}
          onEnded={() => setState("poster")}
        >
          <source src={videoUrl} type="video/mp4" />
        </video>
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brown-deep/85 via-brown-deep/10 to-transparent" />

        {state !== "playing" && (
          <button
            type="button"
            onClick={play}
            className="group absolute inset-0 grid place-items-center"
            aria-label={state === "missing" ? "Video coming soon" : `Play: ${headline}`}
          >
            <span className="glass-strong grid size-20 place-items-center rounded-full text-gold-light shadow-glow transition-transform duration-500 ease-luxe group-hover:scale-110">
              <span aria-hidden className="absolute inset-0 rounded-full bg-gold/30 blur-xl animate-pulse-glow" />
              <Play className="relative ml-1 size-7" strokeWidth={1.25} fill="currentColor" />
            </span>
          </button>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 p-5 md:p-6">
          <p className="eyebrow text-[0.58rem] text-gold-light">{state === "missing" ? "Video message · coming soon" : "Video message"}</p>
          <p className="mt-2 font-display text-display-sm font-light text-fg">{headline}</p>
        </div>
      </div>
    </div>
  );
}
