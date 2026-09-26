/**
 * Focus and viewport rules for the chat panel.
 *
 * Extracted from the widget so the decisions can be tested directly — getting
 * these wrong is either an accessibility regression or, on a phone, a keyboard
 * appearing over the conversation uninvited.
 */

/** Below this width the panel is full-bleed and the virtual keyboard is in play. */
export const MOBILE_BREAKPOINT = 640;

/**
 * True only for devices driven by a real pointer.
 *
 * Autofocusing the composer on a touch device throws the virtual keyboard up
 * over the conversation the moment the panel opens, before the visitor has
 * asked anything. A hover-capable, fine pointer is the closest reliable proxy
 * for "there is a physical keyboard here anyway".
 */
export function prefersAutoFocus(matchMedia: typeof window.matchMedia | undefined = globalThis.window?.matchMedia): boolean {
  if (!matchMedia) return false;
  return matchMedia("(hover: hover) and (pointer: fine)").matches;
}

/**
 * Whether focus is currently nobody's in particular, and so is ours to take back
 * after a reply lands.
 *
 * Submitting disables the send button, which drops focus to the body; the same
 * happens when a suggestion chip is clicked and then removed from the DOM. Those
 * are the cases worth restoring. If the visitor has since focused a real control
 * — a call to action, a link, the close button — it stays theirs, and if they
 * have moved outside the panel entirely we never reach in.
 */
export function focusIsUnclaimed(
  panel: { contains(node: Node | null): boolean } | null,
  active: Element | null = globalThis.document?.activeElement ?? null,
  body: Element | null = globalThis.document?.body ?? null,
): boolean {
  if (!active || active === body) return true;
  if (!panel?.contains(active)) return false;
  // Inside the panel, but on something that can no longer hold focus.
  return active.hasAttribute("disabled") || !active.isConnected;
}
