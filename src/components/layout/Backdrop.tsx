/**
 * The site's backdrop: one lit sheet of honey oak behind every page.
 *
 * It is a real fixed element rather than `background-attachment: fixed` on the
 * body, because iOS Safari quietly downgrades that to `scroll` and stretches
 * the light over the whole document instead of the viewport. Fixed here means
 * the warm pools stay still while the page scrolls over them, on every device.
 *
 * Gold sections are transparent windows onto this (see `surface-gold`); the
 * brown sections are opaque and cut into it.
 */
export function Backdrop() {
  return (
    <div aria-hidden className="backdrop-oak pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Both orbs add light rather than shadow: cocoa text reads on this
          surface, so nothing here is allowed to darken it. */}
      <span className="orb orb-gold -left-[15%] -top-[22%] size-[70vw] max-w-[900px] opacity-40" />
      <span className="orb orb-ivory -right-[14%] bottom-[-18%] size-[65vw] max-w-[820px] opacity-55 animate-float-slow" />
    </div>
  );
}
