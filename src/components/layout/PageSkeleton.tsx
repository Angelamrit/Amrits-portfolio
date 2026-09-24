import { Container } from "@/components/ui/Container";

/**
 * The shape of a page in the site's oak and chocolate, with a gold sheen
 * travelling across it: what a guest sees instead of a frozen or empty screen
 * while a page is still on its way. Shown by `NavigationSkeleton`.
 *
 * Pure CSS (see `.skeleton` in globals.css), so it costs nothing to show.
 */
export function PageSkeleton() {
  return (
    <div className="skeleton-page" role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading the page…</span>
      <span aria-hidden className="skeleton-progress" />

      {/* The page header: eyebrow, a two-line title, a lead and two buttons, beside a tall photograph. */}
      <div aria-hidden className="relative overflow-hidden surface-gold pt-36 pb-16 md:pt-44 md:pb-24">
        <span className="orb orb-gold -right-[10%] -top-[25%] size-[60vw] max-w-[760px] opacity-40" />
        <Container className="relative">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-end lg:gap-16">
            <div className="lg:col-span-7">
              <div className="flex items-center gap-3">
                <span className="skeleton-line-accent h-px w-10" />
                <span className="skeleton skeleton-on-oak h-3 w-40 rounded-full" />
              </div>
              <div className="mt-8 space-y-4">
                <span className="skeleton skeleton-on-oak block h-12 w-[88%] rounded-2xl md:h-16" />
                <span className="skeleton skeleton-on-oak block h-12 w-[62%] rounded-2xl md:h-16" />
              </div>
              <div className="mt-8 max-w-xl space-y-3">
                <span className="skeleton skeleton-on-oak block h-4 w-full rounded-full" />
                <span className="skeleton skeleton-on-oak block h-4 w-[82%] rounded-full" />
              </div>
              <div className="mt-10 flex flex-wrap gap-4">
                <span className="skeleton skeleton-pill h-12 w-44 rounded-full" />
                <span className="skeleton skeleton-on-oak h-12 w-36 rounded-full" />
              </div>
            </div>
            <div className="lg:col-span-5">
              <div className="skeleton skeleton-frame mx-auto aspect-[4/5] w-full max-w-sm rounded-[1.75rem] sm:max-w-md lg:max-w-none" />
            </div>
          </div>
        </Container>
      </div>

      {/* The first section: a heading and a row of cards on chocolate. */}
      <div aria-hidden className="surface-brown py-20 md:py-28">
        <Container>
          <div className="flex flex-col items-center gap-4">
            <span className="skeleton skeleton-on-brown h-3 w-32 rounded-full" />
            <span className="skeleton skeleton-on-brown h-10 w-[70%] max-w-md rounded-2xl" />
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton-card rounded-[1.5rem] p-4" style={{ animationDelay: `${0.25 + i * 0.08}s` }}>
                <span className="skeleton skeleton-on-brown block aspect-[4/3] w-full rounded-2xl" />
                <span className="skeleton skeleton-on-brown mt-6 block h-5 w-[70%] rounded-full" />
                <span className="skeleton skeleton-on-brown mt-3 block h-3.5 w-[90%] rounded-full" />
                <span className="skeleton skeleton-on-brown mt-2 mb-2 block h-3.5 w-[55%] rounded-full" />
              </div>
            ))}
          </div>
        </Container>
      </div>
    </div>
  );
}
