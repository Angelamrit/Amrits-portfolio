"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

type Props = {
  href: string;
  label: string;
  /** The route the visitor is currently on. */
  active?: boolean;
  /** The gold indicator pill is currently sitting under this item. */
  highlighted?: boolean;
  hasPanel?: boolean;
  panelOpen?: boolean;
  tone?: "light" | "dark";
  onClick?: () => void;
  onEnter?: (el: HTMLElement) => void;
  onFocusItem?: (el: HTMLElement) => void;
  className?: string;
};

export function NavLink({
  href,
  label,
  active = false,
  highlighted = false,
  hasPanel = false,
  panelOpen = false,
  onClick,
  onEnter,
  onFocusItem,
  className,
}: Props) {
  return (
    <Link
      href={href}
      onClick={onClick}
      onMouseEnter={(e) => onEnter?.(e.currentTarget)}
      onFocus={(e) => onFocusItem?.(e.currentTarget)}
      aria-current={active ? "page" : undefined}
      aria-expanded={hasPanel ? panelOpen : undefined}
      data-nav-item={href}
      className={cn(
        "relative z-[2] inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill px-4 py-2.5 font-sans text-[0.64rem] font-semibold uppercase tracking-[0.2em] transition-colors duration-500 ease-luxe",
        highlighted ? "text-charcoal" : active ? "text-gold-light" : "text-fg/70 hover:text-fg",
        className,
      )}
    >
      {label}
      {hasPanel && (
        <ChevronDown
          aria-hidden
          className={cn("size-3 opacity-50 transition-transform duration-500 ease-luxe", panelOpen && "rotate-180 opacity-90")}
          strokeWidth={2}
        />
      )}
    </Link>
  );
}
