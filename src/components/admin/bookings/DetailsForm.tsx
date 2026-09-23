"use client";

import { startTransition, useActionState, useState } from "react";
import { LoaderCircle, Save } from "lucide-react";
import { cn } from "@/lib/cn";
import { idleState, type EditorState } from "@/lib/content/state";
import type { BookingStatus } from "@/lib/bookings/bookings";
import { createBookingByHand, saveBookingDetails } from "@/app/admin/(dashboard)/bookings/actions";
import { statusLabel } from "./status";

/**
 * A booking's details, as a form — used both to correct a booking that came in
 * from the website and to write one in by hand when a guest telephones.
 *
 * Plain named inputs this time rather than a JSON payload: every field is flat,
 * so the browser's own `FormData` does the collecting.
 *
 * Submitted by hand rather than through `<form action>`. React resets a form
 * after its action runs — including when the server said no — so a phone
 * booking typed out in full and refused for a missing phone number would come
 * back blank. Dispatching the action ourselves keeps every field as typed.
 */

export type BookingFormValues = {
  name: string;
  email: string;
  phone: string;
  eventDate: string;
  location: string;
  guests: number;
  experience: string;
  budget: string;
  dietary: string;
  message: string;
};

const input =
  "w-full rounded-xl border border-fg/12 bg-fg/[0.04] px-3.5 py-2.5 font-sans text-[0.9rem] text-fg placeholder:text-fg/25 transition-all duration-300 hover:border-fg/20 focus:border-gold/70 focus:bg-fg/[0.07] focus:shadow-[0_0_0_3px_rgba(226,189,108,0.14)] focus:outline-none [color-scheme:dark]";

const selectArrow =
  "cursor-pointer appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23e2bd6c%22 stroke-width=%221.5%22><path d=%22M6 9l6 6 6-6%22/></svg>')] bg-[length:12px] bg-[right_0.9rem_center] bg-no-repeat pr-9 [&>option]:bg-surface-2";

function Field({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="eyebrow text-[0.6rem] text-fg/55">
        {label}
      </label>
      {children}
    </div>
  );
}

export function DetailsForm({
  mode,
  id,
  initial,
  experiences,
  budgets,
}: {
  mode: "edit" | "create";
  id?: string;
  initial: BookingFormValues;
  experiences: { value: string; label: string }[];
  budgets: { value: string; label: string }[];
}) {
  const [state, action, pending] = useActionState<EditorState, FormData>(
    mode === "edit" ? saveBookingDetails : createBookingByHand,
    idleState,
  );
  const [dirty, setDirty] = useState(mode === "create");
  const [seen, setSeen] = useState(0);

  // A successful save makes the form clean again, so the button goes quiet
  // until the next change instead of inviting a second, pointless save.
  if (mode === "edit" && state.at && state.at !== seen) {
    setSeen(state.at);
    if (state.status !== "error") setDirty(false);
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(() => action(data));
      }}
      onChange={() => setDirty(true)}
      className="flex flex-col gap-4"
    >
      {id && <input type="hidden" name="id" value={id} />}

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Guest name" htmlFor="b-name">
          <input id="b-name" name="name" required maxLength={80} defaultValue={initial.name} className={input} />
        </Field>
        <Field label="Guests" htmlFor="b-guests">
          <input
            id="b-guests"
            name="guests"
            type="number"
            required
            min={1}
            max={1000}
            defaultValue={initial.guests || ""}
            className={input}
          />
        </Field>
        <Field label="Email" htmlFor="b-email">
          <input id="b-email" name="email" type="email" maxLength={254} defaultValue={initial.email} className={input} />
        </Field>
        <Field label="Phone" htmlFor="b-phone">
          <input id="b-phone" name="phone" type="tel" maxLength={40} defaultValue={initial.phone} className={input} />
        </Field>
        <Field label="Date" htmlFor="b-date">
          <input id="b-date" name="eventDate" type="date" defaultValue={initial.eventDate} className={input} />
        </Field>
        <Field label="Where" htmlFor="b-location">
          <input
            id="b-location"
            name="location"
            maxLength={120}
            placeholder="At Angel, or the guest's address"
            defaultValue={initial.location}
            className={input}
          />
        </Field>
        <Field label="Experience" htmlFor="b-experience">
          <select id="b-experience" name="experience" defaultValue={initial.experience} className={cn(input, selectArrow)}>
            {experiences.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Budget" htmlFor="b-budget">
          <select id="b-budget" name="budget" defaultValue={initial.budget} className={cn(input, selectArrow)}>
            <option value="">Not given</option>
            {budgets.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Dietary requirements" htmlFor="b-dietary" className="md:col-span-2">
          <input id="b-dietary" name="dietary" maxLength={500} defaultValue={initial.dietary} className={input} />
        </Field>
        <Field label={mode === "create" ? "What they asked for" : "Their message"} htmlFor="b-message" className="md:col-span-2">
          <textarea
            id="b-message"
            name="message"
            rows={4}
            maxLength={2000}
            defaultValue={initial.message}
            className={cn(input, "resize-y leading-relaxed")}
          />
        </Field>

        {mode === "create" && (
          <>
            <Field label="Status" htmlFor="b-status">
              <select id="b-status" name="status" defaultValue="contacted" className={cn(input, selectArrow)}>
                {(["new", "contacted", "confirmed"] as BookingStatus[]).map((status) => (
                  <option key={status} value={status}>
                    {statusLabel[status]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Private note" htmlFor="b-note">
              <input
                id="b-note"
                name="note"
                maxLength={2000}
                placeholder="e.g. Rang on Friday, deposit to follow"
                className={input}
              />
            </Field>
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending || !dirty}
          className="btn-primary inline-flex items-center gap-2 rounded-pill px-6 py-3 font-sans text-[0.68rem] font-semibold uppercase tracking-[0.18em] disabled:pointer-events-none disabled:opacity-40"
        >
          {pending ? (
            <LoaderCircle aria-hidden className="size-3.5 animate-spin" strokeWidth={2} />
          ) : (
            <Save aria-hidden className="size-3.5" strokeWidth={1.8} />
          )}
          {mode === "create" ? "Add booking" : "Save details"}
        </button>
        <p
          aria-live="polite"
          className={cn("text-[0.8rem]", state.status === "error" ? "text-[#e59a93]" : "text-[#7fc39b]")}
        >
          {state.status === "error" ? state.message : state.message ?? ""}
        </p>
      </div>
    </form>
  );
}
