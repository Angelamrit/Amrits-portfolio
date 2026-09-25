"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  BarChart3,
  ChefHat,
  ExternalLink,
  House,
  Images,
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
 * Built around one question — "where do I go to do this?" — for someone who
 * will open the dashboard a few times a week, not a developer who lives in it.
 * So the navigation is short, grouped by what the chef is thinking about
 * rather than by how the code is organised, and labelled in plain words: the
 * the people visiting the site and the site itself.
 *
 * On a phone the four things used most sit in a tab bar at the bottom of the
 * screen, where a thumb already is, and everything else is one tap away in
 * the drawer.
 */

type Item = { href: string; label: string; icon: typeof House };

const groups: { heading?: string; items: Item[] }[] = [
  {
    items: [
      { href: "/admin", label: "Home", icon: House },
      { href: "/admin/visitors", label: "Visitors", icon: BarChart3 },
    ],
  },
  {
    heading: "Your website",
    items: [
      { href: "/admin/menus", label: "Menus", icon: UtensilsCrossed },
      { href: "/admin/dishes", label: "Dishes", icon: ChefHat },
      { href: "/admin/restaurant", label: "Restaurant details", icon: Store },
      { href: "/admin/gallery", label: "Photos", icon: Images },
    ],
  },
];

/** What the phone tab bar shows. "More" opens the drawer for the rest. */
const tabs: Item[] = [
  { href: "/admin", label: "Home", icon: House },
  { href: "/admin/visitors", label: "Visitors", icon: BarChart3 },
  { href: "/admin/menus", label: "Menus", icon: UtensilsCrossed },
];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}

function NavList({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-5" aria-label="Dashboard">
      {groups.map((group, index) => (
        <div key={group.heading ?? index} className="flex flex-col gap-1">
          {group.heading && <p className="eyebrow mb-1 px-3.5 text-[0.55rem] text-fg/30">{group.heading}</p>}
          {group.items.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                onClick={onNavigate}
                data-active={active}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "nav-rail group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[0.88rem] transition-all duration-400 ease-luxe",
                  active
                    ? "bg-gold/[0.11] text-fg shadow-[inset_0_1px_0_rgba(246,239,226,0.07)]"
                    : "text-fg/60 hover:bg-fg/[0.05] hover:text-fg",
                )}
              >
                <Icon
                  className={cn(
                    "size-[1.05rem] shrink-0 transition-colors duration-400",
                    active ? "text-gold" : "text-fg/40 group-hover:text-gold/80",
                  )}
                  strokeWidth={1.5}
                  aria-hidden
                />
                <span className="flex-1">{label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function Rail({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col gap-8 overflow-y-auto p-6">
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

      <div className="mt-auto flex flex-col gap-1">
        <span aria-hidden className="hairline-full mb-2" />
        <Link
          href="/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[0.88rem] text-fg/60 transition-colors duration-300 hover:bg-fg/[0.05] hover:text-fg"
        >
          <ExternalLink className="size-[1.05rem] shrink-0 text-fg/40" strokeWidth={1.5} aria-hidden />
          View the website
        </Link>
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-[0.88rem] text-fg/60 transition-colors duration-300 hover:bg-red-400/10 hover:text-red-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            <LogOut className="size-[1.05rem] shrink-0 text-fg/40" strokeWidth={1.5} aria-hidden />
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

  const moreActive = !tabs.some((tab) => isActive(pathname, tab.href));

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

      {/* Phone / tablet top bar */}
      <header className="glass sticky top-0 z-30 flex items-center gap-3 border-x-0 border-t-0 px-4 py-3 lg:hidden">
        <Link href="/admin" className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-full border border-gold/30 bg-gold/10 font-display text-base text-gold">
            A
          </span>
          <span className="font-display text-lg text-fg">Studio</span>
        </Link>
      </header>

      {/* Phone / tablet tab bar */}
      <nav
        aria-label="Main sections"
        className="glass-strong fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-x-0 border-b-0 pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex flex-col items-center gap-1 px-2 pb-2.5 pt-3 text-[0.64rem] transition-colors duration-300",
                active ? "text-gold-light" : "text-fg/50",
              )}
            >
              <span className="relative">
                <Icon aria-hidden className="size-5" strokeWidth={active ? 1.9 : 1.5} />
              </span>
              {label}
              {active && <span aria-hidden className="absolute inset-x-6 top-0 h-0.5 rounded-pill bg-gold" />}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-expanded={drawerOpen}
          className={cn(
            "relative flex flex-col items-center gap-1 px-2 pb-2.5 pt-3 text-[0.64rem] transition-colors duration-300",
            moreActive ? "text-gold-light" : "text-fg/50",
          )}
        >
          <MenuIcon aria-hidden className="size-5" strokeWidth={1.5} />
          More
          {moreActive && <span aria-hidden className="absolute inset-x-6 top-0 h-0.5 rounded-pill bg-gold" />}
        </button>
      </nav>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close the menu"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-charcoal/80 backdrop-blur-sm"
          />
          <div className="glass-strong absolute inset-y-0 left-0 w-[min(84vw,300px)] border-y-0 border-l-0">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close the menu"
              className="absolute right-3 top-4 z-10 grid size-9 place-items-center rounded-xl text-fg/60 transition-colors duration-300 hover:text-gold"
            >
              <X className="size-4" strokeWidth={1.6} aria-hidden />
            </button>
            <Rail pathname={pathname} onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      <div id="dashboard" className="relative z-10 lg:pl-[264px]">
        {/* Extra room at the foot on phones so the last thing on a page is never under the tab bar. */}
        <div className="mx-auto w-full max-w-[1500px] px-5 pb-28 pt-6 sm:px-8 lg:pb-20 lg:pt-10">{children}</div>
      </div>
    </div>
  );
}
