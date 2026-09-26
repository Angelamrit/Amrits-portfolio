import test from "node:test";
import assert from "node:assert/strict";
import { MOBILE_BREAKPOINT, focusIsUnclaimed, prefersAutoFocus } from "../src/components/chat/focus.ts";

/** Minimal stand-ins: the rules under test only read these few properties. */
const el = (props: Partial<{ disabled: boolean; connected: boolean }> = {}) =>
  ({
    hasAttribute: (name: string) => name === "disabled" && props.disabled === true,
    isConnected: props.connected !== false,
  }) as unknown as Element;

const panelContaining = (...children: Element[]) =>
  ({ contains: (node: Node | null) => children.includes(node as unknown as Element) });

const body = el();

test("the composer is autofocused only where there is a real pointer", () => {
  const desktop = ((q: string) => ({ matches: q === "(hover: hover) and (pointer: fine)" })) as unknown as typeof window.matchMedia;
  const touch = (() => ({ matches: false })) as unknown as typeof window.matchMedia;

  assert.equal(prefersAutoFocus(desktop), true);
  // Regression: autofocus on open threw the virtual keyboard over the panel
  // before the visitor had asked anything.
  assert.equal(prefersAutoFocus(touch), false);
  assert.equal(prefersAutoFocus(undefined), false, "no matchMedia must not autofocus");
});

test("focus is reclaimed when it has been dropped to the body", () => {
  // What actually happens after submit: the send button disables and the
  // browser moves focus to the body.
  assert.equal(focusIsUnclaimed(panelContaining(), body, body), true);
  assert.equal(focusIsUnclaimed(panelContaining(), null, body), true);
});

test("focus is reclaimed from a control that can no longer hold it", () => {
  const disabledSend = el({ disabled: true });
  assert.equal(focusIsUnclaimed(panelContaining(disabledSend), disabledSend, body), true);

  // A suggestion chip that was clicked and then removed from the DOM.
  const removedChip = el({ connected: false });
  assert.equal(focusIsUnclaimed(panelContaining(removedChip), removedChip, body), true);
});

test("focus is never stolen from something the visitor chose", () => {
  const cta = el();
  assert.equal(
    focusIsUnclaimed(panelContaining(cta), cta, body),
    false,
    "a live control inside the panel keeps focus",
  );

  const outside = el();
  assert.equal(
    focusIsUnclaimed(panelContaining(), outside, body),
    false,
    "focus outside the panel is never reclaimed",
  );

  assert.equal(focusIsUnclaimed(null, outside, body), false, "no panel means no reclaim");
});

test("the mobile breakpoint matches the panel's full-bleed layout", () => {
  // The panel is full-bleed below Tailwind's `sm`, which is where the virtual
  // keyboard and the visual-viewport sizing matter.
  assert.equal(MOBILE_BREAKPOINT, 640);
});
