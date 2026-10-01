"use client";

import { useEffect, useState } from "react";
import { CircleAlert, CircleCheck, LoaderCircle, RotateCcw, Save } from "lucide-react";
import { cn } from "@/lib/cn";
import type { EditorState } from "@/lib/content/state";
import { relativeTime } from "./format";

/**
 * The bar that sits at the foot of every editor.
 *
 * It is fixed to the bottom of the screen rather than placed after the last
 * field, because these forms are long: a save button below a list of seven
 * courses is a button the chef has to go looking for, and a form whose save
 * button is off-screen is a form people abandon half-finished.
 *
 * It also answers the question a long form always raises — "did that save?" —
 * without a toast that disappears before it is read. The state is on the bar:
 * unsaved changes, saving, or the time of the last save.
 */
export function SaveBar({
  state,
  pending,
  dirty,
  onReset,
  resetLabel = "Reset to original",
  resetPending,
  canReset,
  problem,
  submitLabel = "Save changes",
  pendingLabel = "Saving",
  idleMessage = "No changes yet",
}: {
  state: EditorState;
  pending: boolean;
  dirty: boolean;
  onReset?: () => void;
  resetLabel?: string;
  resetPending?: boolean;
  canReset?: boolean;
  /** A field the form already knows the server will refuse. Shown in place of saving, and blocks it. */
  problem?: string;
  /** e.g. "Add dish" on a form that creates rather than edits. */
  submitLabel?: string;
  pendingLabel?: string;
  /** Shown before anything has been changed. */
  idleMessage?: string;
}) {
  const [now, setNow] = useState(() => state.at ?? 0);

  useEffect(() => {
    if (!state.at) return;
    const timer = window.setInterval(() => setNow(Date.now()), 20_000);
    return () => window.clearInterval(timer);
  }, [state.at]);

  const message =
    state.status === "error" ? (
      <span className="flex items-center gap-2 text-[#e59a93]">
        <CircleAlert aria-hidden className="size-3.5 shrink-0" strokeWidth={1.8} />
        {state.message}
      </span>
    ) : problem && dirty ? (
      <span className="flex items-center gap-2 text-[#e59a93]">
        <CircleAlert aria-hidden className="size-3.5 shrink-0" strokeWidth={1.8} />
        {problem}
      </span>
    ) : dirty ? (
      <span className="text-gold-light/80">Unsaved changes</span>
    ) : state.at ? (
      <span className="flex items-center gap-2 text-[#7fc39b]">
        <CircleCheck aria-hidden className="size-3.5 shrink-0" strokeWidth={1.8} />
        {state.status === "reset" ? "Reset" : "Saved"} {relativeTime(state.at, Math.max(now, state.at))}
      </span>
    ) : (
      <span className="text-fg/45">{idleMessage}</span>
    );

  return (
    <>
      {/* Keeps the last field clear of the bar rather than hidden behind it. */}
      <div aria-hidden className="h-24" />

      {/* On a phone it floats above the tab bar at the foot of the screen,
          with the message on its own line and the two buttons sharing the
          width beneath it — side by side they are wider than a phone, and the
          save button used to hang off the right edge. */}
      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-40 px-3 pb-3 sm:px-8 lg:bottom-0 lg:pb-4 lg:pl-[calc(264px+2rem)]">
        <div className="glass-strong border-gradient mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-x-3 gap-y-2.5 rounded-frame px-4 py-3 sm:px-5 sm:py-3.5">
          <p aria-live="polite" className="min-w-0 flex-1 basis-full text-[0.8rem] sm:basis-0">
            {message}
          </p>

          <div className="flex w-full items-center gap-2 sm:w-auto sm:shrink-0">
            {onReset && (
              <button
                type="button"
                onClick={onReset}
                disabled={!canReset || resetPending || pending}
                title={resetLabel}
                className="inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-pill border border-fg/15 px-4 py-2.5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-fg/55 transition-colors duration-300 hover:border-fg/30 hover:text-fg disabled:pointer-events-none disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold sm:flex-none"
              >
                {resetPending ? (
                  <LoaderCircle aria-hidden className="size-3.5 animate-spin" strokeWidth={2} />
                ) : (
                  <RotateCcw aria-hidden className="size-3.5" strokeWidth={1.8} />
                )}
                <span className="sm:hidden">Reset</span>
                <span className="hidden sm:inline">{resetLabel}</span>
              </button>
            )}

            <button
              type="submit"
              disabled={pending || !dirty || Boolean(problem)}
              className={cn(
                "btn-primary inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-pill px-4 py-2.5 font-sans text-[0.68rem] font-semibold uppercase tracking-[0.12em] sm:flex-none sm:px-6 sm:tracking-[0.18em]",
                "disabled:pointer-events-none disabled:opacity-40",
              )}
            >
              {pending ? (
                <LoaderCircle aria-hidden className="size-3.5 animate-spin" strokeWidth={2} />
              ) : (
                <Save aria-hidden className="size-3.5" strokeWidth={1.8} />
              )}
              {pending ? pendingLabel : submitLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * How many editors on screen are holding work that has not been saved.
 *
 * Module scope, because the question is asked by the dashboard's navigation,
 * which sits in the shell far above any one form.
 */
let unsavedEditors = 0;

/**
 * Warns before unsaved work is thrown away.
 *
 * Two ways out of a page, two guards. Closing or reloading the tab gets the
 * browser's own dialog — a custom one cannot stop a tab from closing. Moving
 * to another screen inside the dashboard is a client-side navigation the
 * browser never sees, so the shell's links ask `confirmLeave` instead;
 * without that, a click on "Dishes" in the sidebar silently discarded a half
 * edited menu. Both are active only while there is something to lose.
 */
export function useUnsavedChangesWarning(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    unsavedEditors += 1;
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      unsavedEditors -= 1;
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [dirty]);
}

/** For a dashboard link's `onNavigate`: asks before leaving a screen with unsaved changes. */
export function confirmLeave(event: { preventDefault(): void }) {
  if (unsavedEditors > 0 && !window.confirm("You have changes that are not saved. Leave this screen and lose them?")) {
    event.preventDefault();
  }
}
