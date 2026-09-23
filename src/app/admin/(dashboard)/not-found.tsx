import Link from "next/link";
import { Compass } from "lucide-react";

/**
 * A wrong turn inside the dashboard. Kept separate from the site's 404 so a
 * signed-in admin is offered the way back to the dashboard rather than to the
 * booking page.
 */
export default function DashboardNotFound() {
  return (
    <div className="glass border-gradient flex min-h-[50vh] flex-col items-center justify-center gap-5 rounded-frame p-12 text-center">
      <span className="grid size-12 place-items-center rounded-full border border-gold/25 bg-gold/10">
        <Compass className="size-5 text-gold" strokeWidth={1.5} aria-hidden />
      </span>
      <h1 className="font-display text-display-sm text-fg">Nothing here</h1>
      <p className="max-w-sm text-sm text-fg/50">That part of the dashboard does not exist.</p>
      <Link
        href="/admin"
        className="text-xs uppercase tracking-[0.2em] text-gold transition-opacity duration-300 hover:opacity-70"
      >
        Back to home
      </Link>
    </div>
  );
}
