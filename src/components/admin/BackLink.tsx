"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { confirmLeave } from "./SaveBar";

/**
 * The way back from an editor to its list ("All menus", "All dishes").
 *
 * A client component only so it can ask before leaving: it sits directly above
 * a form, and it is the link most likely to be pressed with changes unsaved.
 */
export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      onNavigate={confirmLeave}
      className="inline-flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.18em] text-fg/45 transition-colors duration-300 hover:text-gold"
    >
      <ArrowLeft aria-hidden className="size-3.5" strokeWidth={1.8} />
      {children}
    </Link>
  );
}
