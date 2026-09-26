"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowUpRight, MapPin, Phone, X } from "lucide-react";
import type { NavItem } from "@/types/content";
import { site } from "@/data/site";
import { Button } from "@/components/ui/Button";
import { FacebookIcon, InstagramIcon } from "@/components/ui/SocialIcons";
import { Wordmark } from "./Wordmark";
import { useVenue } from "@/components/layout/VenueContext";

type Props = { open: boolean; onClose: () => void; items: NavItem[] };

/** Long enough for the drawer to slide back out; see `.menu-closing` in globals.css. */
const CLOSE_MS = 280;

function isCurrent(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * The phone and tablet navigation: a chocolate-lacquer drawer that slides in
 * from the right. On a phone it takes the whole screen; from `sm` up it is a
 * panel over the dimmed page, so an iPad keeps a glimpse of where you were.
 *
 * The panel is fully opaque on purpose. Phones and tablets drop backdrop blur
 * for speed (see globals.css), and a translucent panel without the blur let the
 * page's own headings read straight through the links.
 */
export function MobileMenu({ open, onClose, items }: Props) {
  const venue = useVenue();
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const [closing, setClosing] = useState(false);

  // A menu opened again after closing starts fresh.
  if (!open && closing) setClosing(false);

  const requestClose = useCallback(() => {
    setClosing(true);
    window.setTimeout(onClose, CLOSE_MS);
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
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
    const t = window.setTimeout(() => panelRef.current?.querySelector<HTMLElement>("a[href]")?.focus({ preventScroll: true }), 60);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
    };
  }, [open, requestClose]);

  if (!open) return null;

  const { phone, mapsUrl, address, social } = venue;
  const socials = [
    social.instagram && { label: "Instagram", href: social.instagram, Icon: InstagramIcon },
    social.facebook && { label: "Facebook", href: social.facebook, Icon: FacebookIcon },
  ].filter((s): s is { label: string; href: string; Icon: typeof InstagramIcon } => Boolean(s));
  const addressLine = `${address.street}, ${address.city}, ${address.region} ${address.postal}`;

  return (
    <div className={closing ? "menu-closing fixed inset-0 z-[90]" : "fixed inset-0 z-[90]"}>
      {/* The page behind, dimmed; tapping it closes the drawer. */}
      <div aria-hidden onClick={requestClose} className="menu-scrim absolute inset-0" />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        className="menu-panel tone-dark absolute inset-y-0 right-0 flex w-full flex-col overflow-x-hidden overflow-y-auto overscroll-contain sm:w-[min(30rem,86vw)]"
      >
        {/* A large engraved monogram, barely there, anchoring the lower corner. */}
        <span aria-hidden className="menu-monogram pointer-events-none absolute -right-4 bottom-24 select-none font-display text-[18rem] italic leading-none">
          A
        </span>

        <div className="relative z-[2] flex items-center justify-between px-5 pt-5 pb-4 sm:px-7 sm:pt-6">
          <Wordmark onNavigate={requestClose} />
          <button type="button" onClick={requestClose} aria-label="Close menu" className="menu-close group grid size-11 shrink-0 place-items-center rounded-full">
            <X className="size-[1.1rem] transition-transform duration-500 ease-luxe group-hover:rotate-90" strokeWidth={1.4} />
          </button>
        </div>
        <span aria-hidden className="menu-rule relative z-[2] mx-5 sm:mx-7" />

        <nav className="relative z-[2] flex flex-1 flex-col justify-center px-3 py-4 sm:px-5" aria-label="Mobile">
          <ul>
            {items.map((item, i) => {
              const current = isCurrent(pathname, item.href);
              return (
                <li key={item.href} className="menu-item" style={{ "--menu-i": i } as CSSProperties}>
                  <Link
                    href={item.href}
                    onClick={requestClose}
                    aria-current={current ? "page" : undefined}
                    className="menu-link group relative flex items-center gap-4 overflow-hidden rounded-2xl px-4 py-[0.8rem]"
                  >
                    <span aria-hidden className="menu-marker" />
                    <span aria-hidden className="menu-sheen" />
                    <span className="menu-num relative w-7 shrink-0 font-display text-base italic text-gold-gradient">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="menu-label relative font-display text-[1.85rem] font-light leading-none sm:text-[2.05rem]">{item.label}</span>
                    <span aria-hidden className="menu-arrow relative ml-auto grid size-9 shrink-0 place-items-center rounded-full">
                      <ArrowUpRight className="size-4" strokeWidth={1.5} />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="menu-card menu-item relative z-[2] m-4 mt-2 rounded-[1.5rem] p-5 sm:m-6 sm:mt-2" style={{ "--menu-i": items.length } as CSSProperties}>
          <div className="grid gap-3 text-sm text-fg/70">
            {mapsUrl ? (
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 transition-colors hover:text-gold-light">
                <MapPin className="mt-0.5 size-4 shrink-0 text-gold" strokeWidth={1.5} />
                <span>{addressLine}</span>
              </a>
            ) : (
              <p className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-gold" strokeWidth={1.5} />
                <span>{addressLine}</span>
              </p>
            )}
            {phone && (
              <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="flex items-center gap-3 transition-colors hover:text-gold-light">
                <Phone className="size-4 shrink-0 text-gold" strokeWidth={1.5} />
                {phone}
              </a>
            )}
          </div>
          <div className="mt-5 flex items-center gap-3">
            <Button href={venue.resyUrl ?? site.cta.href} className="flex-1">
              {site.cta.label}
            </Button>
            {socials.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="menu-arrow grid size-12 shrink-0 place-items-center rounded-full"
              >
                <Icon className="size-[1.1rem]" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
