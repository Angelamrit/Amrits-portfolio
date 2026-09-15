import { cn } from "@/lib/cn";

type Props = {
  items: string[];
  className?: string;
  tone?: "light" | "dark";
  speed?: "slow" | "normal";
};

export function Marquee({ items, className, speed = "normal" }: Props) {
  const track = [...items, ...items];
  return (
    <div
      aria-label={items.join(", ")}
      className={cn("mask-fade-x relative flex w-full overflow-hidden border-y border-line py-5", className)}
    >
      <ul
        aria-hidden
        className={cn(
          "flex w-max shrink-0 items-center animate-marquee motion-reduce:animate-none hover:[animation-play-state:paused]",
          speed === "slow" && "[animation-duration:70s]",
        )}
      >
        {track.map((item, i) => (
          <li key={i} className="flex items-center whitespace-nowrap">
            <span className="px-7 font-display text-2xl font-light italic text-fg/70">{item}</span>
            <span aria-hidden className="size-1.5 rotate-45 bg-accent shadow-[0_0_12px_rgba(201,169,98,0.9)]" />
          </li>
        ))}
      </ul>
    </div>
  );
}
