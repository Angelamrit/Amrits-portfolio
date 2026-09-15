import { useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = {
  /** Text that runs around the ring. End it with " · " so the loop reads cleanly. */
  text: string;
  size?: number;
  className?: string;
  children?: ReactNode;
};

/** Rotating circular-text badge with a glass core. Purely decorative unless children carry meaning. */
export function Medallion({ text, size = 160, className, children }: Props) {
  const id = useId().replace(/:/g, "");
  return (
    <div className={cn("relative grid shrink-0 place-items-center", className)} style={{ width: size, height: size }}>
      <span aria-hidden className="absolute inset-0 rounded-full bg-gold/15 blur-2xl animate-pulse-glow" />
      <svg viewBox="0 0 100 100" aria-hidden className="absolute inset-0 size-full animate-spin-slower motion-reduce:animate-none">
        <defs>
          <path id={`ring-${id}`} d="M50,50 m-40,0 a40,40 0 1,1 80,0 a40,40 0 1,1 -80,0" />
        </defs>
        <text className="fill-current font-sans text-[5.6px] font-semibold uppercase tracking-[0.24em]">
          <textPath href={`#ring-${id}`}>{text}</textPath>
        </text>
      </svg>
      <span aria-hidden className="absolute inset-[19%] rounded-full border border-current/40" />
      <span aria-hidden className="glass-strong absolute inset-[24%] rounded-full shadow-glow" />
      <div className="relative">{children}</div>
    </div>
  );
}
