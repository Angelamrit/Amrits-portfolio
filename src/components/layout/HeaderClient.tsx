"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, m, useScroll, useSpring } from "motion/react";
import { MapPin, Star } from "lucide-react";
import type { NavItem } from "@/types/content";
import { cn } from "@/lib/cn";
import { site } from "@/data/site";
import { Button } from "@/components/ui/Button";
import { NavLink } from "./NavLink";
import { MobileMenu } from "./MobileMenu";
import { Wordmark } from "./Wordmark";
import { MegaMenu, type MegaPanelData } from "./MegaMenu";

type Indicator = { left: number; width: number; ready: boolean };

const OPEN_DELAY = 110;
const CLOSE_DELAY = 220;

export function HeaderClient({
  items,
  mobileItems,
  panels = [],
}: {
  items: NavItem[];
  mobileItems: NavItem[];
  panels?: MegaPanelData[];
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const [panelKey, setPanelKey] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [indicator, setIndicator] = useState<Indicator>({ left: 0, width: 0, ready: false });

  const listRef = useRef<HTMLUListElement>(null);
  const openTimer = useRef<number | undefined>(undefined);
  const closeTimer = useRef<number | undefined>(undefined);

  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.3 });

  const navItems = items.filter((i) => i.href !== "/");
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));
  const activeHref = navItems.find((i) => isActive(i.href))?.href ?? null;
  const currentHref = hovered ?? activeHref;
  const panelFor = (href: string) => panels.find((p) => p.key === href);

  /* ---------------- scroll state ---------------- */
  useEffect(() => {
    let last = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const y = window.scrollY;
        setScrolled(y > 40);
        setHidden(y > 240 && y > last + 4);
        last = y;
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  /* ---------------- sliding gold indicator ---------------- */
  useEffect(() => {
    const measure = () => {
      const list = listRef.current;
      if (!list) return;
      const target = currentHref ? list.querySelector<HTMLElement>(`[data-nav-item="${currentHref}"]`) : null;
      if (!target) {
        setIndicator((i) => (i.ready ? { ...i, ready: false } : i));
        return;
      }
      const lr = list.getBoundingClientRect();
      const tr = target.getBoundingClientRect();
      setIndicator({ left: tr.left - lr.left, width: tr.width, ready: true });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [currentHref]);

  /* ---------------- mega panel open / close ---------------- */
  const clearTimers = () => {
    window.clearTimeout(openTimer.current);
    window.clearTimeout(closeTimer.current);
  };

  const requestOpen = (href: string) => {
    clearTimers();
    if (!panelFor(href)) {
      openTimer.current = window.setTimeout(() => setPanelKey(null), OPEN_DELAY);
      return;
    }
    openTimer.current = window.setTimeout(() => setPanelKey(href), OPEN_DELAY);
  };

  const requestClose = () => {
    clearTimers();
    closeTimer.current = window.setTimeout(() => setPanelKey(null), CLOSE_DELAY);
  };

  useEffect(() => clearTimers, []);

  // Close the panel whenever the route changes (adjusted during render, not in an effect).
  const [seenPath, setSeenPath] = useState(pathname);
  if (seenPath !== pathname) {
    setSeenPath(pathname);
    setPanelKey(null);
    setHovered(null);
  }

  useEffect(() => {
    if (!panelKey) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPanelKey(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [panelKey]);

  const close = useCallback(() => setOpen(false), []);
  const activePanel = panelKey ? panelFor(panelKey) : undefined;

  return (
    <>
      <header
        className={cn(
          "tone-dark fixed inset-x-0 top-0 z-[80] transition-transform duration-700 ease-luxe",
          hidden && !open && !panelKey && "-translate-y-full",
        )}
        onMouseLeave={() => {
          requestClose();
          setHovered(null);
        }}
      >
        {/* ---------- background ---------- */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div
            className={cn(
              "absolute inset-0 bg-brown/92 backdrop-blur-2xl transition-opacity duration-700 ease-luxe",
              scrolled || panelKey ? "opacity-100" : "opacity-0",
            )}
          />
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-b from-brown-deep/85 via-brown-deep/35 to-transparent transition-opacity duration-700",
              scrolled || panelKey ? "opacity-0" : "opacity-100",
            )}
          />
          <div
            className={cn(
              "absolute inset-0 shadow-[0_24px_60px_-40px_rgba(0,0,0,0.95)] transition-opacity duration-700",
              scrolled ? "opacity-100" : "opacity-0",
            )}
          />
        </div>

        {/* ---------- credentials strip ---------- */}
        <div
          className={cn(
            "overflow-hidden border-b border-fg/[0.07] transition-all duration-700 ease-luxe",
            scrolled ? "max-h-0 opacity-0" : "max-h-12 opacity-100",
          )}
        >
          <div className="mx-auto flex w-full max-w-wide items-center justify-between gap-6 px-5 py-2.5 sm:px-8 lg:px-12">
            <p className="flex items-center gap-2 eyebrow text-[0.52rem] text-gold/85">
              <Star aria-hidden className="size-3 shrink-0" strokeWidth={1.5} fill="currentColor" />
              <span className="whitespace-nowrap">Michelin Guide · Bib Gourmand</span>
            </p>
            <p className="hidden items-center gap-2 eyebrow text-[0.52rem] text-fg/45 md:flex">
              <MapPin aria-hidden className="size-3 shrink-0" strokeWidth={1.5} />
              <span className="whitespace-nowrap">
                {site.restaurant.address.street}, {site.restaurant.address.city}
              </span>
            </p>
            <p className="flex items-center gap-4">
              <span className="hidden eyebrow text-[0.52rem] text-fg/45 lg:inline">{site.restaurant.hours}</span>
              {site.restaurant.resyUrl && (
                <a
                  href={site.restaurant.resyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="eyebrow whitespace-nowrap text-[0.52rem] text-gold-light/90 transition-colors hover:text-fg"
                >
                  Reserve via Resy
                </a>
              )}
            </p>
          </div>
        </div>

        {/* ---------- main bar ---------- */}
        <div
          className={cn(
            "mx-auto flex w-full max-w-wide items-center justify-between gap-6 px-5 transition-[padding] duration-500 ease-luxe sm:px-8 lg:px-12",
            scrolled ? "py-3" : "py-4",
          )}
        >
          <Wordmark />

          <nav aria-label="Primary" className="hidden lg:block">
            <ul ref={listRef} className="glass relative flex items-center gap-0.5 rounded-pill p-1.5">
              {/* sliding indicator */}
              <span
                aria-hidden
                className={cn(
                  "pointer-events-none absolute inset-y-1.5 z-[1] rounded-pill bg-gradient-to-r from-gold-light via-gold to-gold-deep shadow-[0_8px_24px_-8px_rgba(226,189,108,0.9)] transition-all duration-500 ease-luxe",
                  indicator.ready ? "opacity-100" : "opacity-0",
                )}
                style={{ left: indicator.left, width: indicator.width }}
              />
              {navItems.map((item) => (
                <li key={item.href}>
                  <NavLink
                    href={item.href}
                    label={item.label}
                    active={isActive(item.href)}
                    highlighted={currentHref === item.href && indicator.ready}
                    hasPanel={Boolean(panelFor(item.href))}
                    panelOpen={panelKey === item.href}
                    onEnter={() => {
                      setHovered(item.href);
                      requestOpen(item.href);
                    }}
                    onFocusItem={() => {
                      setHovered(item.href);
                      requestOpen(item.href);
                    }}
                  />
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-3">
            <Button href={site.cta.href} size="sm" className="hidden md:inline-flex" icon={false}>
              Book
            </Button>
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              aria-expanded={open}
              className="group relative grid size-11 place-items-center rounded-full border border-fg/15 bg-fg/[0.04] backdrop-blur transition-all duration-500 ease-luxe hover:border-gold hover:shadow-glow lg:hidden"
            >
              <span aria-hidden className="flex w-5 flex-col items-end gap-[5px]">
                <span className="block h-px w-full bg-gold-light transition-all duration-500 ease-luxe group-hover:w-3/5" />
                <span className="block h-px w-3/5 bg-gold-light transition-all duration-500 ease-luxe group-hover:w-full" />
                <span className="block h-px w-full bg-gold-light transition-all duration-500 ease-luxe group-hover:w-2/5" />
              </span>
            </button>
          </div>
        </div>

        {/* ---------- scroll progress ---------- */}
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-px">
          <div className="absolute inset-0 hairline-center opacity-70" />
          <m.div
            className="absolute inset-y-0 left-0 w-full origin-left bg-gradient-to-r from-gold-deep via-gold to-gold-light shadow-[0_0_12px_rgba(226,189,108,0.85)]"
            style={{ scaleX: progress }}
          />
        </div>

        {/* ---------- mega menu ---------- */}
        <AnimatePresence>
          {activePanel && (
            <div
              key={activePanel.key}
              onMouseEnter={clearTimers}
              onMouseLeave={requestClose}
              className="absolute inset-x-0 top-full hidden lg:block"
            >
              <MegaMenu panel={activePanel} onNavigate={() => setPanelKey(null)} />
            </div>
          )}
        </AnimatePresence>
      </header>

      {/* dim the page behind the mega menu */}
      <AnimatePresence>
        {activePanel && (
          <m.div
            aria-hidden
            className="fixed inset-0 z-[70] hidden bg-brown-deep/55 backdrop-blur-[2px] lg:block"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            onMouseEnter={requestClose}
          />
        )}
      </AnimatePresence>

      <MobileMenu open={open} onClose={close} items={mobileItems} />
    </>
  );
}
