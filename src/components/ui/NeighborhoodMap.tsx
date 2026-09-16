import { Utensils } from "lucide-react";
import { cn } from "@/lib/cn";

const STREETS = [
  { cls: "nmap-73", label: "73 ST" },
  { cls: "nmap-74", label: "74 ST" },
  { cls: "nmap-75", label: "75 ST" },
  { cls: "nmap-76", label: "76 ST" },
];

const LINES = ["7", "E", "F", "M", "R"];

/**
 * The blocks around Angel, drawn rather than embedded: no map tiles, no API
 * key and no third-party script, so it loads with the footer and keeps the
 * site's own palette.
 *
 * The outer frame takes the card's shape and carries the grid and the corner
 * chrome; the inner `.nmap` is the drawing, which covers the frame at a fixed
 * 3:2 so the streets keep their angles. Geometry lives in globals.css.
 */
export function NeighborhoodMap({ className }: { className?: string }) {
  return (
    <div
      role="img"
      aria-label="Map of the blocks around Angel Indian Restaurant, 75-18 37th Avenue, Jackson Heights — on 37th Avenue between 75th and 76th Street, three minutes from the 74th Street–Broadway subway station."
      className={cn("nmap-frame", className)}
    >
      <span aria-hidden className="nmap-grid" />
      <span aria-hidden className="nmap-borough">
        Jackson
        <br />
        Heights
      </span>

      <div aria-hidden className="nmap">
        <span className="nmap-road nmap-37">
          <b>37TH AVENUE</b>
        </span>
        <span className="nmap-road nmap-roosevelt">
          <b>ROOSEVELT AVENUE</b>
        </span>
        <span className="nmap-road nmap-broadway">
          <b>BROADWAY</b>
        </span>

        {STREETS.map((s) => (
          <span key={s.cls} className={cn("nmap-st", s.cls)}>
            <b>{s.label}</b>
          </span>
        ))}

        <span className="nmap-line" />

        <span className="nmap-station">
          {LINES.map((l) => (
            <i key={l}>{l}</i>
          ))}
          <b>74 St–Broadway</b>
        </span>

        <span className="nmap-pin">
          <i>
            <Utensils className="size-[45%]" strokeWidth={1.75} />
          </i>
          <b>ANGEL</b>
          <small>75-18 37th Ave</small>
        </span>
      </div>

      <span aria-hidden className="nmap-coords">
        40.7498° N · 73.8895° W
      </span>
      <span aria-hidden className="nmap-scale">
        Not to scale
      </span>
    </div>
  );
}
