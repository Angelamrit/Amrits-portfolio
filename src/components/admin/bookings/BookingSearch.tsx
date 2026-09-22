"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { LoaderCircle, Search, X } from "lucide-react";

/**
 * Search across bookings by name, email, phone or reference.
 *
 * The query lives in the URL, like the status filter beside it, so a search
 * survives a refresh and the back button undoes it. Typing waits a moment
 * before asking the server, so a name typed at speed is one request, not ten.
 */
export function BookingSearch({ initial }: { initial: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [value, setValue] = useState(initial);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const trimmed = value.trim();
    if (trimmed === (params.get("q") ?? "")) return;

    const timer = window.setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (trimmed) next.set("q", trimmed);
      else next.delete("q");
      const query = next.toString();
      startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false }));
    }, 280);
    return () => window.clearTimeout(timer);
  }, [value, params, pathname, router]);

  return (
    <div className="relative w-full sm:w-72">
      {pending ? (
        <LoaderCircle
          aria-hidden
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-gold/70"
          strokeWidth={1.8}
        />
      ) : (
        <Search
          aria-hidden
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-fg/35"
          strokeWidth={1.8}
        />
      )}
      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Name, email, phone or APS-…"
        aria-label="Search bookings"
        className="w-full rounded-pill border border-fg/12 bg-fg/[0.04] py-2.5 pl-10 pr-9 text-[0.85rem] text-fg placeholder:text-fg/30 transition-colors duration-300 focus:border-gold/60 focus:bg-fg/[0.07] focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue("")}
          aria-label="Clear the search"
          className="absolute right-2.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full text-fg/40 transition-colors duration-200 hover:text-fg"
        >
          <X aria-hidden className="size-3.5" strokeWidth={2} />
        </button>
      )}
    </div>
  );
}
