"use client";

import { AnimatePresence, m } from "motion/react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import type { NavItem } from "@/types/content";
import { site } from "@/data/site";
import { Button } from "@/components/ui/Button";
import { Orbs } from "@/components/ui/Orbs";
import { Wordmark } from "./Wordmark";

type Props = { open: boolean; onClose: () => void; items: NavItem[] };

const ease = [0.16, 1, 0.3, 1] as const;

export function MobileMenu({ open, onClose, items }: Props) {
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
    <AnimatePresence>
      {open && (
        <m.div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
          className="tone-dark fixed inset-0 z-[90] flex flex-col bg-brown-deep/95 backdrop-blur-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease }}
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

          <nav className="relative z-[2] flex flex-1 flex-col justify-center px-5 sm:px-8" aria-label="Mobile">
            <ul className="space-y-1">
              {items.map((item, i) => (
                <m.li
                  key={item.href}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, delay: 0.08 + i * 0.05, ease }}
                >
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className="group flex items-baseline gap-4 py-2 font-display text-[2.6rem] font-light leading-none text-fg transition-colors hover:text-gold-light sm:text-[3.4rem]"
                  >
                    <span className="eyebrow w-6 text-gold/70">{String(i + 1).padStart(2, "0")}</span>
                    {item.label}
                  </Link>
                </m.li>
              ))}
            </ul>
          </nav>

          <m.div
            className="relative z-[2] m-4 flex flex-col gap-5 rounded-frame glass p-5 sm:flex-row sm:items-center sm:justify-between"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <address className="not-italic text-sm text-fg/60">
              {site.restaurant.name}
              <br />
              {site.restaurant.address.street}, {site.restaurant.address.city}, {site.restaurant.address.region}{" "}
              {site.restaurant.address.postal}
            </address>
            <Button href={site.cta.href}>{site.cta.label}</Button>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
