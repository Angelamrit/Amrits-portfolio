import type { ReactNode } from "react";

/**
 * The top of every dashboard page: what this screen is, in a plain sentence,
 * and the controls that scope it. The sentence is there because "Overview"
 * alone does not tell the chef what he is looking at.
 */
export function PageHeading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <p className="eyebrow text-gold/75">{eyebrow}</p>
        <h1 className="mt-3 font-display text-display-md font-light leading-none text-fg">{title}</h1>
        <p className="mt-3 max-w-xl text-[0.88rem] leading-relaxed text-fg/65">{description}</p>
      </div>
      {children && <div className="flex min-w-0 max-w-full flex-wrap items-center gap-3">{children}</div>}
    </header>
  );
}
