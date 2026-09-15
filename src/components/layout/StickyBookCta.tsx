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
        className="flex items-center justify-between rounded-pill bg-gradient-to-r from-gold-light via-gold to-gold-deep px-6 py-4 font-sans text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-charcoal shadow-[0_18px_40px_-10px_rgba(201,169,98,0.8)]"
      >
        Request a Private Experience
        <ArrowUpRight className="size-4" strokeWidth={1.75} />
      </Link>
    </div>
  );
}
