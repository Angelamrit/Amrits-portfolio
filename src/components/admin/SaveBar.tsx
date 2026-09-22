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
}: {
  state: EditorState;
  pending: boolean;
  dirty: boolean;
  onReset?: () => void;
  resetLabel?: string;
  resetPending?: boolean;
  canReset?: boolean;
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
    ) : dirty ? (
      <span className="text-gold-light/80">Unsaved changes</span>
    ) : state.at ? (
      <span className="flex items-center gap-2 text-[#7fc39b]">
        <CircleCheck aria-hidden className="size-3.5 shrink-0" strokeWidth={1.8} />
        {state.status === "reset" ? "Reset" : "Saved"} {relativeTime(state.at, Math.max(now, state.at))}
      </span>
    ) : (
      <span className="text-fg/35">No changes yet</span>
    );

  return (
    <>
      {/* Keeps the last field clear of the bar rather than hidden behind it. */}
      <div aria-hidden className="h-24" />

      {/* On a phone it floats above the tab bar at the foot of the screen. */}
      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-40 px-3 pb-3 sm:px-8 lg:bottom-0 lg:pb-4 lg:pl-[calc(264px+2rem)]">
        <div className="glass-strong border-gradient mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3 rounded-frame px-5 py-3.5">
          <p aria-live="polite" className="min-w-0 flex-1 text-[0.8rem]">
            {message}
          </p>

          <div className="flex shrink-0 items-center gap-2">
            {onReset && (
              <button
                type="button"
                onClick={onReset}
                disabled={!canReset || resetPending || pending}
                className="inline-flex items-center gap-2 rounded-pill border border-fg/15 px-4 py-2.5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-fg/55 transition-colors duration-300 hover:border-fg/30 hover:text-fg disabled:pointer-events-none disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              >
                {resetPending ? (
                  <LoaderCircle aria-hidden className="size-3.5 animate-spin" strokeWidth={2} />
                ) : (
                  <RotateCcw aria-hidden className="size-3.5" strokeWidth={1.8} />
                )}
                {resetLabel}
              </button>
            )}

            <button
              type="submit"
              disabled={pending || !dirty}
              className={cn(
                "btn-primary inline-flex items-center gap-2 rounded-pill px-6 py-2.5 font-sans text-[0.68rem] font-semibold uppercase tracking-[0.18em]",
                "disabled:pointer-events-none disabled:opacity-40",
              )}
            >
              {pending ? (
                <LoaderCircle aria-hidden className="size-3.5 animate-spin" strokeWidth={2} />
              ) : (
                <Save aria-hidden className="size-3.5" strokeWidth={1.8} />
              )}
              {pending ? "Saving" : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Warns before the browser throws away unsaved work.
 *
 * Only the native dialog — a custom one cannot stop a tab from closing. It is
 * registered only while there is something to lose, so the prompt never
 * appears on a form nobody has touched.
 */
export function useUnsavedChangesWarning(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);
}
