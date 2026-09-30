"use client";

import { startTransition, useActionState, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { VenuePatch } from "@/lib/content/venue";
import { idleState, type EditorState } from "@/lib/content/state";
import { resetVenueToOriginal, saveVenue } from "@/app/admin/(dashboard)/restaurant/actions";
import { Panel } from "./Panel";
import { SaveBar, useUnsavedChangesWarning } from "./SaveBar";
import { TextField, useFieldSetters } from "./FormControls";

/**
 * The restaurant's details.
 *
 * Worth saying what is at stake on this screen, because it is not obvious from
 * the fields: the address here is the one search engines read out of the
 * site's structured data, the reservations link is every "Reserve" button on the
 * site, and the opening hours sit in the header of every page. An edit here
 * reaches further than anywhere else in the dashboard, which is why each
 * field says where it shows up.
 */

export type VenueDraft = Required<Omit<VenuePatch, "notes">> & { notes: string[] };

export function VenueEditor({ initial, isEdited }: { initial: VenueDraft; isEdited: boolean }) {
  const [state, formAction, pending] = useActionState<EditorState, FormData>(saveVenue, idleState);
  const [resetState, resetAction, resetPending] = useActionState<EditorState, void>(
    resetVenueToOriginal,
    idleState,
  );

  const [draft, setDraft] = useState<VenueDraft>(initial);
  const [baseline, setBaseline] = useState<VenueDraft>(initial);
  const [seen, setSeen] = useState(0);

  const latest = (resetState.at ?? 0) > (state.at ?? 0) ? resetState : state;
  if (latest.at && latest.at !== seen && latest.status !== "error") {
    setSeen(latest.at);
    setDraft(initial);
    setBaseline(initial);
  }

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(baseline), [draft, baseline]);
  useUnsavedChangesWarning(dirty);

  // One stable handler per field, so a keystroke re-renders only its own field.
  const set = useFieldSetters(initial, setDraft);

  const patch: VenuePatch = { ...draft, notes: draft.notes.map((note) => note.trim()).filter(Boolean) };

  // The server's rules, shown on the field that breaks them. A link typed as
  // "resy.com/…" without the https:// used to fail with a sentence in the save
  // bar that did not say which of five links it meant.
  const link = (value: string) =>
    value.trim() && !/^https?:\/\//.test(value.trim()) ? "Links must start with https://" : undefined;
  const errors = {
    name: draft.name.trim() ? undefined : "The restaurant needs a name.",
    contactEmail:
      draft.contactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.contactEmail.trim())
        ? "That is not an email address."
        : undefined,
    resyUrl: link(draft.resyUrl),
    menuUrl: link(draft.menuUrl),
    mapsUrl: link(draft.mapsUrl),
    instagram: link(draft.instagram),
    facebook: link(draft.facebook),
  };
  const problem = Object.values(errors).some(Boolean) ? "Fix the field marked in red before saving." : undefined;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="payload" value={JSON.stringify(patch)} />

      <Panel title="The restaurant" hint="Shown in the footer, the header bar and the structured data search engines read.">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Name" value={draft.name} maxLength={90} error={errors.name} onChange={set.name} className="md:col-span-2" />
          <TextField label="Street" value={draft.street} maxLength={120} onChange={set.street} className="md:col-span-2" />
          <TextField label="City" value={draft.city} maxLength={80} onChange={set.city} />
          <TextField label="State" value={draft.region} maxLength={40} onChange={set.region} hint={'Two letters, e.g. "NY".'} />
          <TextField label="ZIP code" value={draft.postal} maxLength={20} onChange={set.postal} />
          <TextField label="Country" value={draft.country} maxLength={40} onChange={set.country} hint={'Two letters, e.g. "US".'} />
          <TextField
            label="Opening hours"
            value={draft.hours}
            maxLength={120}
            onChange={set.hours}
            hint={'Free text, shown in the header bar. e.g. "Dinner only".'}
            className="md:col-span-2"
          />
        </div>
      </Panel>

      <Panel title="How guests reach you" hint="Every empty field simply hides its button rather than leaving a dead link.">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            label="Telephone"
            value={draft.phone}
            maxLength={40}
            onChange={set.phone}
            hint="Shown on the Contact page, and when the contact form cannot send."
          />
          <TextField
            label="Contact email shown to guests"
            value={draft.contactEmail}
            maxLength={160}
            error={errors.contactEmail}
            onChange={set.contactEmail}
            hint="Where contact-form messages are actually delivered is set on the server, not here."
          />
          <TextField
            label="Reservations link"
            value={draft.resyUrl}
            maxLength={300}
            error={errors.resyUrl}
            placeholder="https://resy.com/…"
            onChange={set.resyUrl}
            hint='Every "Reserve a Table" button on the site.'
            className="md:col-span-2"
          />
          <TextField
            label="Full menu link"
            value={draft.menuUrl}
            maxLength={300}
            error={errors.menuUrl}
            placeholder="https://…"
            onChange={set.menuUrl}
            hint='Every "View the full menu at Angel" button.'
            className="md:col-span-2"
          />
          <TextField
            label="Map link"
            value={draft.mapsUrl}
            maxLength={300}
            error={errors.mapsUrl}
            placeholder="https://maps.google.com/…"
            onChange={set.mapsUrl}
            className="md:col-span-2"
          />
          <TextField label="Instagram" value={draft.instagram} maxLength={300} error={errors.instagram} placeholder="https://instagram.com/…" onChange={set.instagram} />
          <TextField label="Facebook" value={draft.facebook} maxLength={300} error={errors.facebook} placeholder="https://facebook.com/…" onChange={set.facebook} />
        </div>
      </Panel>

      <Panel title="What the kitchen is known for" hint="Short phrases, shown as badges beside the restaurant.">
        <div className="flex flex-col gap-2">
          {draft.notes.map((note, index) => (
            <div key={index} className="flex items-start gap-2">
              <input
                type="text"
                value={note}
                maxLength={80}
                aria-label={`Badge ${index + 1}`}
                onChange={(event) =>
                  set.notes(draft.notes.map((existing, i) => (i === index ? event.target.value : existing)))
                }
                className="w-full rounded-xl border border-fg/12 bg-fg/[0.04] px-3.5 py-2.5 font-sans text-[0.9rem] text-fg transition-all duration-300 hover:border-fg/20 focus:border-gold/70 focus:bg-fg/[0.07] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => set.notes(draft.notes.filter((_, i) => i !== index))}
                aria-label={`Remove badge ${index + 1}`}
                className="mt-1 grid size-8 shrink-0 place-items-center rounded-lg text-fg/40 transition-colors duration-300 hover:bg-red-400/10 hover:text-red-200"
              >
                <Trash2 aria-hidden className="size-4" strokeWidth={1.8} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => set.notes([...draft.notes, ""])}
            disabled={draft.notes.length >= 8}
            className="mt-1 inline-flex w-fit items-center gap-2 rounded-pill border border-fg/15 px-3.5 py-2 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-fg/55 transition-colors duration-300 hover:border-gold/50 hover:text-gold-light disabled:pointer-events-none disabled:opacity-35"
          >
            <Plus aria-hidden className="size-3.5" strokeWidth={2} />
            Add badge
          </button>
        </div>
      </Panel>

      <SaveBar
        state={latest}
        pending={pending}
        dirty={dirty}
        resetPending={resetPending}
        canReset={isEdited}
        problem={problem}
        onReset={() => {
          if (!window.confirm("Put the restaurant details back to the version that ships with the site?")) return;
          startTransition(() => resetAction());
        }}
      />
    </form>
  );
}
