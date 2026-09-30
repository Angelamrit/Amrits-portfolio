/**
 * What a dashboard screen looks like while it is still on its way.
 *
 * Every screen here is rendered on request — it reads the store, and the
 * visitor screens roll up a month of the log — so a tap on "Photos" used to
 * leave the previous screen sitting there, unchanged, until the new one had
 * been built. On the development server that can be several seconds while the
 * route compiles, and it reads as a dead page: the tap did nothing. This shows
 * the shape of a screen the instant the tap lands, with the same gold thread
 * the public site uses, and the real screen replaces it when it arrives.
 *
 * Safe to have here where the public site deliberately has none: these routes
 * are dynamic, so there is no prebuilt HTML for a fallback to be written into.
 * The classes are the public skeleton's (see `.skeleton` in globals.css), and
 * everything that moves is a transform.
 */
export default function DashboardLoading() {
  return (
    <div className="skeleton-page flex flex-col gap-8" role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading this screen…</span>
      <span aria-hidden className="skeleton-progress" />

      {/* The heading: eyebrow, title, one line of description. */}
      <div aria-hidden className="flex flex-col gap-3">
        <span className="skeleton skeleton-on-brown h-2.5 w-24 rounded-full" />
        <span className="skeleton skeleton-on-brown h-11 w-[min(100%,20rem)] rounded-2xl md:h-14" />
        <span className="skeleton skeleton-on-brown h-3.5 w-[min(100%,30rem)] rounded-full" />
      </div>

      {/* A row of the cards every screen opens with. The public skeleton's
          cards drift in over most of a second; here they are on screen at
          once, because this state may only exist for a few hundred
          milliseconds and its whole job is to be seen immediately. */}
      <div aria-hidden className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton-card rounded-frame p-4 sm:p-5" style={{ animation: "none" }}>
            <span className="skeleton skeleton-on-brown block size-10 rounded-full" />
            <span className="skeleton skeleton-on-brown mt-4 block h-3.5 w-[70%] rounded-full" />
            <span className="skeleton skeleton-on-brown mt-2 block h-2.5 w-[50%] rounded-full" />
          </div>
        ))}
      </div>

      {/* One wide panel below, where the screen's main content sits. */}
      <div aria-hidden className="skeleton-card rounded-frame p-6" style={{ animation: "none" }}>
        <span className="skeleton skeleton-on-brown block h-5 w-40 rounded-full" />
        <span className="skeleton skeleton-on-brown mt-2 block h-3 w-[min(100%,24rem)] rounded-full" />
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="skeleton skeleton-on-brown block h-11 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
