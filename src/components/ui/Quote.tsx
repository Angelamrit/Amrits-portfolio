import { cn } from "@/lib/cn";

type Props = {
  quote: string;
  author: string;
  role?: string;
  context?: string;
  size?: "md" | "lg";
  tone?: "light" | "dark";
  className?: string;
};

export function Quote({ quote, author, role, context, size = "lg", className }: Props) {
  return (
    <figure className={cn("relative", className)}>
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute -left-2 -top-12 select-none font-display leading-none text-gold-gradient opacity-40 md:-left-12",
          size === "lg" ? "text-[9rem] md:text-[14rem]" : "text-[5rem]",
        )}
      >
        “
      </span>
      <blockquote
        className={cn(
          "relative font-display font-light italic text-balance",
          size === "lg" ? "text-display-md md:text-display-lg" : "text-display-sm",
        )}
      >
        <span className={size === "lg" ? "text-gold-gradient" : "text-fg"}>{quote}</span>
      </blockquote>
      <figcaption className="mt-8 flex flex-col gap-1">
        <span className="eyebrow">{author}</span>
        {role && <span className="text-sm text-fg/60">{role}</span>}
        {context && <span className="mt-2 max-w-md text-sm leading-relaxed text-fg/45">{context}</span>}
      </figcaption>
    </figure>
  );
}
