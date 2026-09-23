"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";

/**
 * A crash inside the dashboard.
 *
 * It shows the error's digest and nothing else. The digest is the id Next.js
 * also writes to the server log through `onRequestError`, so it is the thread
 * between what the chef sees and what the developer can look up — without
 * putting a stack trace on screen.
 */
export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[admin]", error);
  }, [error]);

  return (
    <div className="glass border-gradient flex min-h-[50vh] flex-col items-center justify-center gap-5 rounded-frame p-12 text-center">
      <span className="grid size-12 place-items-center rounded-full border border-gold/25 bg-gold/10">
        <TriangleAlert className="size-5 text-gold" strokeWidth={1.5} aria-hidden />
      </span>
      <h1 className="font-display text-display-sm text-fg">Something went wrong</h1>
      <p className="max-w-sm text-sm text-fg/50">
        The dashboard could not load this screen.
        {error.digest && <span className="mt-2 block font-mono text-[0.72rem] text-fg/35">{error.digest}</span>}
      </p>
      <button
        type="button"
        onClick={reset}
        className="btn-primary rounded-pill px-6 py-3 font-sans text-[0.68rem] font-semibold uppercase tracking-[0.2em]"
      >
        Try again
      </button>
    </div>
  );
}
