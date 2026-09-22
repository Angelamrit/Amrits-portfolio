import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * The card everything on the dashboard sits in.
 *
 * Every panel carries a plain title and one short line saying what it is for.
 * That line is not decoration: a panel labelled only "Sources" makes the reader
 * work out what they are looking at, and a dashboard is read in glances.
 */
export function Panel({
  title,
  hint,
  action,
  className,
  bodyClassName,
  children,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "glass border-gradient group relative flex min-w-0 flex-col rounded-frame transition-shadow duration-700 ease-luxe hover:shadow-glow",
        className,
      )}
    >
      <header className="flex items-start justify-between gap-4 px-6 pt-6">
        <div className="min-w-0">
          <h2 className="font-display text-[1.35rem] leading-tight text-fg">{title}</h2>
          {hint && <p className="mt-1 text-[0.78rem] leading-relaxed text-fg/45">{hint}</p>}
        </div>
        {action}
      </header>
      <div className={cn("px-6 pb-6 pt-5", bodyClassName)}>{children}</div>
    </section>
  );
}

/** Shown in place of a chart or a list when the range holds nothing yet. */
export function PanelEmpty({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-28 items-center justify-center rounded-xl border border-dashed border-fg/12 px-5 py-8 text-center text-[0.82rem] text-fg/40">
      {children}
    </div>
  );
}
