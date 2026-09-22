"use client";

import { startTransition, useActionState, useOptimistic, useState } from "react";
import { Check, LoaderCircle, Send, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { idleState, type EditorState } from "@/lib/content/state";
import type { BookingNote, BookingStatus } from "@/lib/bookings/bookings";
import {
  addBookingNote,
  changeBookingStatus,
  deleteBookingNote,
  removeBooking,
} from "@/app/admin/(dashboard)/bookings/actions";
import { relativeTime } from "../format";
import { statusLabel, statusStyle } from "./status";

/**
 * The interactive parts of a booking: moving it along, writing notes about it,
 * and deleting it.
 *
 * Status changes are optimistic — the button lights up the moment it is
 * pressed and the server catches up behind it. A chef working through a list
 * of enquiries after service should not wait on a round trip to see that a
 * click registered. If the save fails the optimistic state falls away and the
 * error is shown in its place.
 */

const ORDER: BookingStatus[] = ["new", "contacted", "confirmed", "completed", "declined"];

export function StatusControl({
  id,
  status,
  hints,
}: {
  id: string;
  status: BookingStatus;
  hints: Record<BookingStatus, string>;
}) {
  const [state, action, pending] = useActionState<EditorState, FormData>(changeBookingStatus, idleState);
  const [shown, setShown] = useOptimistic(status);

  const choose = (next: BookingStatus) => {
    if (next === shown) return;
    const data = new FormData();
    data.set("id", id);
    data.set("status", next);
    startTransition(() => {
      setShown(next);
      action(data);
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5" role="radiogroup" aria-label="Booking status">
        {ORDER.map((option) => {
          const selected = option === shown;
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => choose(option)}
              className={cn(
                "group flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-[0.72rem] font-semibold uppercase tracking-[0.12em] transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
                selected
                  ? cn(statusStyle[option].pill, "shadow-[0_0_24px_-8px_currentColor]")
                  : "border-fg/10 text-fg/45 hover:border-fg/25 hover:text-fg/80",
              )}
            >
              <span aria-hidden className={cn("size-1.5 rounded-pill", selected ? statusStyle[option].dot : "bg-fg/25")} />
              {statusLabel[option]}
            </button>
          );
        })}
      </div>
      <p aria-live="polite" className="flex min-h-5 items-center gap-2 text-[0.78rem] text-fg/50">
        {pending ? (
          <>
            <LoaderCircle aria-hidden className="size-3.5 animate-spin" strokeWidth={2} />
            Saving
          </>
        ) : state.status === "error" ? (
          <span className="text-[#e59a93]">{state.message}</span>
        ) : (
          hints[shown]
        )}
      </p>
    </div>
  );
}

export function NotesPanel({ id, notes }: { id: string; notes: BookingNote[] }) {
  const [state, action, pending] = useActionState<EditorState, FormData>(addBookingNote, idleState);
  const [, removeAction] = useActionState<EditorState, FormData>(deleteBookingNote, idleState);
  const [text, setText] = useState("");
  const [seen, setSeen] = useState(0);

  // Cleared only once the server has the note — a refused note stays in the
  // box to be fixed rather than vanishing.
  if (state.at && state.at !== seen) {
    setSeen(state.at);
    if (state.status !== "error") setText("");
  }

  return (
    <div className="flex flex-col gap-4">
      {notes.length === 0 ? (
        <p className="rounded-xl border border-dashed border-fg/12 px-4 py-6 text-center text-[0.8rem] text-fg/40">
          No notes yet. Anything written here stays in the dashboard — the guest never sees it.
        </p>
      ) : (
        <ol className="flex flex-col gap-2.5">
          {[...notes].reverse().map((note) => (
            <li key={note.id} className="group/note rounded-xl border border-fg/10 bg-fg/[0.03] px-4 py-3">
              <p className="whitespace-pre-wrap text-[0.86rem] leading-relaxed text-fg/85">{note.text}</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <time dateTime={new Date(note.at).toISOString()} className="text-[0.68rem] text-fg/35">
                  {/* Restaurant time, like every other time on a booking — and a
                      fixed zone, so the server and the browser print the same text. */}
                  {new Date(note.at).toLocaleString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "America/New_York",
                  })}
                </time>
                <button
                  type="button"
                  onClick={() => {
                    if (!window.confirm("Delete this note?")) return;
                    const data = new FormData();
                    data.set("id", id);
                    data.set("noteId", note.id);
                    startTransition(() => removeAction(data));
                  }}
                  aria-label="Delete this note"
                  className="grid size-7 place-items-center rounded-lg text-fg/25 opacity-0 transition-all duration-200 hover:bg-red-400/10 hover:text-red-200 focus-visible:opacity-100 group-hover/note:opacity-100"
                >
                  <Trash2 aria-hidden className="size-3.5" strokeWidth={1.8} />
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          startTransition(() => action(data));
        }}
        className="flex flex-col gap-2"
      >
        <input type="hidden" name="id" value={id} />
        <label htmlFor="booking-note" className="sr-only">
          Add a note
        </label>
        <textarea
          id="booking-note"
          name="note"
          rows={3}
          maxLength={2000}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Add a note — a call, a deposit, a menu idea…"
          className="w-full resize-y rounded-xl border border-fg/12 bg-fg/[0.04] px-3.5 py-2.5 font-sans text-[0.88rem] leading-relaxed text-fg placeholder:text-fg/25 transition-all duration-300 focus:border-gold/70 focus:bg-fg/[0.07] focus:outline-none"
        />
        <div className="flex items-center justify-between gap-3">
          <p aria-live="polite" className={cn("text-[0.74rem]", state.status === "error" ? "text-[#e59a93]" : "text-fg/35")}>
            {state.status === "error" ? state.message : state.at ? `Added ${relativeTime(state.at, state.at)}` : ""}
          </p>
          <button
            type="submit"
            disabled={pending || text.trim().length === 0}
            className="inline-flex items-center gap-2 rounded-pill border border-gold/40 px-4 py-2 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-gold-light transition-colors duration-300 hover:border-gold/70 hover:bg-gold/10 disabled:opacity-40"
          >
            {pending ? (
              <LoaderCircle aria-hidden className="size-3.5 animate-spin" strokeWidth={2} />
            ) : (
              <Send aria-hidden className="size-3.5" strokeWidth={1.8} />
            )}
            Add note
          </button>
        </div>
      </form>
    </div>
  );
}

export function DeleteBooking({ id, name }: { id: string; name: string }) {
  const [state, action, pending] = useActionState<EditorState, FormData>(removeBooking, idleState);

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (
            !window.confirm(
              `Delete the booking from ${name} permanently?\n\nFor a booking that simply is not going ahead, mark it Declined instead — that keeps the record.`,
            )
          )
            return;
          const data = new FormData();
          data.set("id", id);
          startTransition(() => action(data));
        }}
        className="inline-flex w-fit items-center gap-2 rounded-pill border border-[#e59a93]/30 px-4 py-2.5 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[#e59a93] transition-colors duration-300 hover:border-[#e59a93]/60 hover:bg-[#e59a93]/10 disabled:opacity-40"
      >
        {pending ? (
          <LoaderCircle aria-hidden className="size-3.5 animate-spin" strokeWidth={2} />
        ) : (
          <Trash2 aria-hidden className="size-3.5" strokeWidth={1.8} />
        )}
        Delete booking
      </button>
      {state.status === "error" && <p className="text-[0.74rem] text-[#e59a93]">{state.message}</p>}
    </div>
  );
}

/** A copy-to-clipboard button for an email address or phone number. */
export function CopyValue({ value, label }: { value: string; label: string }) {
  return (
    <button
      type="button"
      onClick={(event) => {
        void navigator.clipboard?.writeText(value);
        const button = event.currentTarget;
        button.dataset.copied = "true";
        window.setTimeout(() => delete button.dataset.copied, 1400);
      }}
      aria-label={`Copy ${label}`}
      className="group/copy relative grid size-7 shrink-0 place-items-center rounded-lg text-fg/30 transition-colors duration-200 hover:bg-fg/[0.06] hover:text-gold-light"
    >
      <Check aria-hidden className="hidden size-3.5 text-[#7fc39b] group-data-[copied=true]/copy:block" strokeWidth={2.4} />
      <svg aria-hidden viewBox="0 0 24 24" className="size-3.5 group-data-[copied=true]/copy:hidden" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <rect x="9" y="9" width="12" height="12" rx="2" />
        <path d="M5 15V5a2 2 0 0 1 2-2h10" />
      </svg>
    </button>
  );
}
