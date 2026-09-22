"use client";

import Image from "next/image";
import { useState } from "react";
import { Check, Search } from "lucide-react";
import { cn } from "@/lib/cn";

export type ImageChoice = { key: string; src: string; alt: string; label: string };

/**
 * Choosing a photograph, by looking at photographs.
 *
 * The chef picks from the pictures the site already has rather than typing a
 * path. That is not only kinder — it is what makes the choice safe: every
 * option carries its own alt text, dimensions and credit, so a dish can never
 * end up pointing at a missing file or at an image with no description for a
 * screen reader.
 *
 * Uploading new photography is the gallery's job, and anything added there
 * appears in this list.
 */
export function ImagePicker({
  label,
  hint,
  choices,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  choices: ImageChoice[];
  value: string | undefined;
  onChange: (key: string) => void;
}) {
  const [query, setQuery] = useState("");

  const needle = query.trim().toLowerCase();
  const shown = needle
    ? choices.filter((choice) => `${choice.label} ${choice.alt}`.toLowerCase().includes(needle))
    : choices;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow text-[0.6rem] text-fg/55">{label}</p>
          {hint && <p className="mt-1 text-[0.72rem] text-fg/35">{hint}</p>}
        </div>

        {choices.length > 12 && (
          <div className="relative">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-fg/30"
              strokeWidth={1.8}
            />
            <input
              type="search"
              value={query}
              placeholder="Find a picture"
              aria-label="Search the pictures"
              onChange={(event) => setQuery(event.target.value)}
              className="w-56 rounded-pill border border-fg/12 bg-fg/[0.04] py-2 pl-9 pr-3 text-[0.8rem] text-fg placeholder:text-fg/25 transition-colors duration-300 focus:border-gold/60 focus:outline-none"
            />
          </div>
        )}
      </div>

      {shown.length === 0 ? (
        <p className="rounded-xl border border-dashed border-fg/12 px-5 py-8 text-center text-[0.82rem] text-fg/40">
          No pictures match that.
        </p>
      ) : (
        <ul className="grid max-h-[22rem] grid-cols-3 gap-2.5 overflow-y-auto pr-1 sm:grid-cols-4 lg:grid-cols-6">
          {shown.map((choice) => {
            const selected = choice.key === value;
            return (
              <li key={choice.key}>
                <button
                  type="button"
                  onClick={() => onChange(choice.key)}
                  aria-pressed={selected}
                  title={choice.alt}
                  className={cn(
                    "group relative block w-full overflow-hidden rounded-xl border transition-all duration-400 ease-luxe focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
                    selected ? "border-gold shadow-glow" : "border-fg/10 hover:border-gold/45",
                  )}
                >
                  <span className="relative block aspect-square bg-sand">
                    <Image
                      src={choice.src}
                      alt=""
                      fill
                      sizes="140px"
                      className={cn(
                        "object-cover transition-transform duration-[900ms] ease-luxe group-hover:scale-105",
                        !selected && "opacity-75 group-hover:opacity-100",
                      )}
                    />
                    {selected && (
                      <span className="absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-gold text-charcoal">
                        <Check aria-hidden className="size-3" strokeWidth={3} />
                      </span>
                    )}
                  </span>
                  <span className="block truncate px-2 py-1.5 text-left text-[0.65rem] text-fg/50">
                    {choice.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
