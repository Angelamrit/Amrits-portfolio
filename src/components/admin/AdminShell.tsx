"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  ChefHat,
  ExternalLink,
  Images,
  LayoutDashboard,
  LogOut,
  Menu as MenuIcon,
  Store,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { signOut } from "@/app/admin/actions";

/**
 * The frame every dashboard page sits in.
 *
 * A client component because two things here depend on where the reader is and
 * what they have clicked — the active rail in the navigation, and the drawer on
 * a phone. Nothing private is rendered here; the pages inside it are server
 * components that check the session themselves.
 */

type Item = { href: string; label: string; icon: typeof LayoutDashboard; hint: string; soon?: boolean };

const items: Item[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, hint: "Who is visiting the site" },
  { href: "/admin/menus", label: "Menus", icon: UtensilsCrossed, hint: "Courses and menu notes" },
  { href: "/admin/dishes", label: "Dishes", icon: ChefHat, hint: "Names, descriptions, diet tags" },
  { href: "/admin/restaurant", label: "Restaurant", icon: Store, hint: "Address, hours, contact" },
  { href: "/admin/gallery", label: "Gallery", icon: Images, hint: "Photographs and captions" },
];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

function NavList({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1" aria-label="Dashboard">
      {items.map(({ href, label, icon: Icon, hint, soon }) => {
        const active = isActive(pathname, href);

        // A link to a page that does not exist yet is worse than a disabled
        // row: it reads as broken rather than as coming.
        if (soon) {
          return (
            <span
              key={href}
              className="flex cursor-default items-center gap-3 rounded-xl px-3.5 py-3 text-sm text-fg/30"
              title={`${hint} — coming soon`}
            >
              <Icon className="size-4 shrink-0" strokeWidth={1.5} aria-hidden />
              <span className="flex-1">{label}</span>
              <span className="rounded-pill border border-fg/12 px-2 py-0.5 text-[0.55rem] font-semibold uppercase tracking-[0.18em]">
                Soon
              </span>
            </span>
          );
        }

        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            title={hint}
            data-active={active}
            aria-current={active ? "page" : undefined}
            className={cn(
              "nav-rail group relative flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm transition-all duration-400 ease-luxe",
              active
                ? "bg-gold/[0.11] text-fg shadow-[inset_0_1px_0_rgba(246,239,226,0.07)]"
                : "text-fg/55 hover:bg-fg/[0.05] hover:text-fg",
            )}
          >
            <Icon
              className={cn(
                "size-4 shrink-0 transition-colors duration-400",
                active ? "text-gold" : "text-fg/40 group-hover:text-gold/80",
              )}
              strokeWidth={1.5}
              aria-hidden
            />
            <span className="flex-1">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function Rail({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-8 p-6">
      <Link href="/admin" onClick={onNavigate} className="group flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full border border-gold/30 bg-gold/10 font-display text-lg text-gold transition-shadow duration-500 group-hover:shadow-glow">
          A
        </span>
        <span className="min-w-0">
          <span className="block truncate font-display text-lg leading-tight text-fg">Amrit Pal Singh</span>
          <span className="eyebrow block text-[0.55rem] text-gold/70">Studio</span>
        </span>
      </Link>

      <NavList pathname={pathname} onNavigate={onNavigate} />

      <div className="mt-auto flex flex-col gap-2">
        <span aria-hidden className="hairline-full mb-2" />
        <Link
          href="/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm text-fg/55 transition-colors duration-300 hover:bg-fg/[0.05] hover:text-fg"
        >
          <ExternalLink className="size-4 shrink-0 text-fg/40" strokeWidth={1.5} aria-hidden />
          View the site
        </Link>
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm text-fg/55 transition-colors duration-300 hover:bg-red-400/10 hover:text-red-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            <LogOut className="size-4 shrink-0 text-fg/40" strokeWidth={1.5} aria-hidden />
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/admin";
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Escape closes the drawer, and the page underneath must not scroll while it
  // is open — otherwise a swipe on the overlay moves the content behind it.
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [drawerOpen]);

  return (
    <div className="admin-room tone-dark relative min-h-dvh">
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <span className="orb orb-gold -left-[14%] -top-[24%] size-[52vw] max-w-[760px] opacity-[0.22]" />
        <span className="orb orb-ember -bottom-[26%] right-[-10%] size-[48vw] max-w-[700px] opacity-40 animate-float-slow" />
      </div>

      <a
        href="#dashboard"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-charcoal focus:px-4 focus:py-2 focus:text-ivory focus:outline-gold"
      >
        Skip to dashboard
      </a>

      {/* Desktop rail */}
      <aside className="glass fixed inset-y-0 left-0 z-30 hidden w-[264px] border-y-0 border-l-0 lg:block">
        <Rail pathname={pathname} />
      </aside>

      {/* Phone / tablet bar */}
      <header className="glass sticky top-0 z-30 flex items-center gap-3 border-x-0 border-t-0 px-4 py-3 lg:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open the dashboard menu"
          aria-expanded={drawerOpen}
          className="grid size-10 place-items-center rounded-xl border border-fg/10 text-fg/70 transition-colors duration-300 hover:border-gold/40 hover:text-gold"
        >
          <MenuIcon className="size-4.5" strokeWidth={1.6} aria-hidden />
        </button>
        <span className="font-display text-lg text-fg">Studio</span>
      </header>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close the dashboard menu"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-charcoal/80 backdrop-blur-sm"
          />
          <div className="glass-strong absolute inset-y-0 left-0 w-[min(84vw,300px)] border-y-0 border-l-0">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close the dashboard menu"
              className="absolute right-3 top-4 grid size-9 place-items-center rounded-xl text-fg/60 transition-colors duration-300 hover:text-gold"
            >
              <X className="size-4" strokeWidth={1.6} aria-hidden />
            </button>
            <Rail pathname={pathname} onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      <div id="dashboard" className="relative z-10 lg:pl-[264px]">
        <div className="mx-auto w-full max-w-[1500px] px-5 pb-20 pt-6 sm:px-8 lg:pt-10">{children}</div>
      </div>
    </div>
  );
}
