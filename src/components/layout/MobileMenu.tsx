"use client";

import Link from "next/link";
import { useEffect, useRef, type CSSProperties } from "react";
import { X } from "lucide-react";
import type { NavItem } from "@/types/content";
import { site } from "@/data/site";
import { Button } from "@/components/ui/Button";
import { Orbs } from "@/components/ui/Orbs";
import { Wordmark } from "./Wordmark";
import { useVenue } from "@/components/layout/VenueContext";

type Props = { open: boolean; onClose: () => void; items: NavItem[] };

export function MobileMenu({ open, onClose, items }: Props) {
  const venue = useVenue();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    const t = window.setTimeout(() => panelRef.current?.querySelector<HTMLElement>("a[href]")?.focus(), 60);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
    };
  }, [open, onClose]);

  return (
    open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
          className="enter tone-dark fixed inset-0 z-[90] flex flex-col bg-brown-deep/95 backdrop-blur-2xl"
          style={{ "--enter-y": "0px" } as CSSProperties}
        >
          <Orbs variant="mixed" pattern />
          <div className="relative z-[2] flex items-center justify-between px-5 py-5 sm:px-8">
            <Wordmark />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="glass grid size-11 place-items-center rounded-full text-fg transition-colors hover:border-gold hover:text-gold-light"
            >
              <X className="size-5" strokeWidth={1.25} />
            </button>
          </div>

          {/* Scrolls rather than centres when the list is taller than the
              screen — a phone in landscape has ~375px of height for it.
              `my-auto` on the list keeps it centred when there is room. */}
          <nav className="relative z-[2] flex flex-1 flex-col overflow-y-auto overscroll-contain px-5 py-2 sm:px-8" aria-label="Mobile">
            <ul className="my-auto space-y-1">
              {items.map((item, i) => (
                <li key={item.href} className="enter" style={{ "--enter-y": "24px", "--enter-delay": `${0.04 + i * 0.03}s` } as CSSProperties}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className="group flex items-baseline gap-4 py-2 font-display text-[2.6rem] font-light leading-none text-fg transition-colors hover:text-gold-light sm:text-[3.4rem]"
                  >
                    <span className="eyebrow w-6 text-gold/70">{String(i + 1).padStart(2, "0")}</span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div
            className="enter relative z-[2] m-4 flex flex-col gap-5 rounded-frame glass p-5 sm:flex-row sm:items-center sm:justify-between"
            style={{ "--enter-y": "12px", "--enter-delay": "0.2s" } as CSSProperties}
          >
            <address className="not-italic text-sm text-fg/60">
              {venue.name}
              <br />
              {venue.address.street}, {venue.address.city}, {venue.address.region}{" "}
              {venue.address.postal}
            </address>
            <Button href={venue.resyUrl ?? site.cta.href}>{site.cta.label}</Button>
          </div>
        </div>
      )
  );
}
