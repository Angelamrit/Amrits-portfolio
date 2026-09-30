import test from "node:test";
import assert from "node:assert/strict";
import { MOBILE_BREAKPOINT, focusIsUnclaimed, initialFocusTarget, prefersAutoFocus } from "../src/components/chat/focus.ts";

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

test("launcher must not remain focused when it becomes hidden during chatbot opening", () => {
  // The bug: opening set aria-hidden and scale-0 on the launcher in the same
  // React commit that mounted the panel, then waited 80ms before moving focus.
  // Chrome blocks aria-hidden on an element whose descendant retains focus, and
  // on touch — where the 80ms timer never ran — focus stayed on the invisible
  // launcher for as long as the panel was open.
  //
  // The rule that prevents it: opening must always yield somewhere inside the
  // panel to put focus, whatever the device.
  const panel = el();
  const composer = el();

  assert.notEqual(
    initialFocusTarget(panel, composer, true),
    null,
    "a pointer device must have a focus destination",
  );
  assert.notEqual(
    initialFocusTarget(panel, composer, false),
    null,
    "a touch device must have one too — this is the case that stranded focus",
  );

  // Still nothing to focus if the panel has not mounted; the caller no-ops
  // rather than reaching for the launcher it is about to hide.
  assert.equal(initialFocusTarget(null, null, true), null);
});

test("the open-focus destination suits the device", () => {
  const panel = el();
  const composer = el();

  // Pointer: the composer, so a question can be typed straight away.
  assert.equal(initialFocusTarget(panel, composer, true), composer);

  // Touch: the panel itself. Focusing the composer here summons the virtual
  // keyboard over the conversation before anything has been asked, which is the
  // behaviour the previous fix existed to prevent — it must survive this one.
  assert.equal(initialFocusTarget(panel, composer, false), panel);
  assert.notEqual(
    initialFocusTarget(panel, composer, false),
    composer,
    "touch must never open the keyboard on panel open",
  );

  // A pointer device with no composer yet still lands inside the panel rather
  // than leaving focus on the launcher.
  assert.equal(initialFocusTarget(panel, null, true), panel);
});
