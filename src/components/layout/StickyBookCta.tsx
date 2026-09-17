"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/cn";

export function StickyBookCta() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 0.8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (pathname === "/contact") return null;

  return (
    <div
      className={cn(
        "fixed inset-x-3 bottom-3 z-[70] transition-transform duration-500 ease-luxe md:hidden",
        show ? "translate-y-0" : "translate-y-[140%]",
      )}
      aria-hidden={!show}
    >
      <Link
        href="/contact"
        tabIndex={show ? 0 : -1}
        // `relative overflow-hidden` because btn-primary paints its hover metal
        // in an inset ::before that has to be clipped to the pill.
        className="tone-dark btn-primary relative flex items-center justify-between gap-4 overflow-hidden rounded-pill px-6 py-4 font-sans text-[0.68rem] font-semibold uppercase tracking-[0.22em] transition-all duration-500 ease-luxe"
      >
        {/* Positioned so they paint above btn-primary's inset ::before. */}
        <span className="relative">Request a Private Experience</span>
        <ArrowUpRight className="relative size-4 shrink-0" strokeWidth={1.75} />
      </Link>
    </div>
  );
}
