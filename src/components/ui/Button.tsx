import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "outline" | "ghost" | "link" | "glass";
type Tone = "light" | "dark";
type Size = "md" | "sm";

const base =
  "group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-pill font-sans text-[0.7rem] font-semibold uppercase tracking-[0.22em] transition-all duration-500 ease-luxe focus-visible:outline-gold disabled:pointer-events-none disabled:opacity-50";

const sizes: Record<Size, string> = {
  md: "px-8 py-[1.1rem]",
  sm: "px-5 py-3 text-[0.64rem]",
};

/* Variants are tone-agnostic in the dark system; `tone` is kept for API compatibility. */
const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-gold-light via-gold to-gold-deep text-charcoal shadow-[0_10px_30px_-10px_rgba(201,169,98,0.7)] hover:shadow-[0_18px_40px_-10px_rgba(201,169,98,0.9)] hover:-translate-y-0.5",
  outline: "border border-fg/25 text-fg hover:border-accent hover:text-accent hover:shadow-glow",
  glass: "glass text-fg hover:border-gold/60 hover:text-gold-light",
  ghost: "px-0 py-0 text-fg hover:text-accent rounded-none",
  link: "px-0 py-0 rounded-none text-fg border-b border-accent pb-1 hover:text-accent",
};

type Props = {
  variant?: Variant;
  tone?: Tone;
  size?: Size;
  href?: string;
  icon?: boolean;
  external?: boolean;
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<"button">, "children">;

export function Button({
  variant = "primary",
  size = "md",
  href,
  icon = true,
  external,
  className,
  children,
  type = "button",
  tone: _tone,
  ...rest
}: Props) {
  void _tone;
  const isText = variant === "ghost" || variant === "link";
  const classes = cn(base, !isText && sizes[size], variants[variant], className);
  const content = (
    <>
      {variant === "primary" && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/45 to-transparent transition-transform duration-[900ms] ease-luxe group-hover:translate-x-full"
        />
      )}
      <span className="relative">{children}</span>
      {icon && (
        <ArrowUpRight
          aria-hidden
          className="relative size-[0.95em] transition-transform duration-500 ease-luxe group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          strokeWidth={1.75}
        />
      )}
    </>
  );

  if (href) {
    const isExternal = external ?? /^https?:\/\//.test(href);
    if (isExternal) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
          {content}
        </a>
      );
    }
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} {...rest}>
      {content}
    </button>
  );
}
