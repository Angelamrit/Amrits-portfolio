"use client";

import { startTransition, useActionState, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { VenuePatch } from "@/lib/content/venue";
import { idleState, type EditorState } from "@/lib/content/state";
import { resetVenueToOriginal, saveVenue } from "@/app/admin/(dashboard)/restaurant/actions";
import { Panel } from "./Panel";
import { SaveBar, useUnsavedChangesWarning } from "./SaveBar";
import { TextField } from "./FormControls";

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

  const update = <K extends keyof VenueDraft>(key: K, value: VenueDraft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const patch: VenuePatch = { ...draft, notes: draft.notes.map((note) => note.trim()).filter(Boolean) };

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="payload" value={JSON.stringify(patch)} />

      <Panel title="The restaurant" hint="Shown in the footer, the header bar and the structured data search engines read.">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Name" value={draft.name} maxLength={90} onChange={(v) => update("name", v)} className="md:col-span-2" />
          <TextField label="Street" value={draft.street} maxLength={120} onChange={(v) => update("street", v)} className="md:col-span-2" />
          <TextField label="City" value={draft.city} maxLength={80} onChange={(v) => update("city", v)} />
          <TextField label="State" value={draft.region} maxLength={40} onChange={(v) => update("region", v)} hint={'Two letters, e.g. "NY".'} />
          <TextField label="ZIP code" value={draft.postal} maxLength={20} onChange={(v) => update("postal", v)} />
          <TextField label="Country" value={draft.country} maxLength={40} onChange={(v) => update("country", v)} hint={'Two letters, e.g. "US".'} />
          <TextField
            label="Opening hours"
            value={draft.hours}
            maxLength={120}
            onChange={(v) => update("hours", v)}
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
            onChange={(v) => update("phone", v)}
            hint="Shown on the Contact page, and when the contact form cannot send."
          />
          <TextField
            label="Contact email shown to guests"
            value={draft.contactEmail}
            maxLength={160}
            onChange={(v) => update("contactEmail", v)}
            hint="Where contact-form messages are actually delivered is set on the server, not here."
          />
          <TextField
            label="Reservations link"
            value={draft.resyUrl}
            maxLength={300}
            onChange={(v) => update("resyUrl", v)}
            hint='Every "Reserve a Table" button on the site.'
            className="md:col-span-2"
          />
          <TextField
            label="Full menu link"
            value={draft.menuUrl}
            maxLength={300}
            onChange={(v) => update("menuUrl", v)}
            hint='Every "View the full menu at Angel" button.'
            className="md:col-span-2"
          />
          <TextField
            label="Map link"
            value={draft.mapsUrl}
            maxLength={300}
            onChange={(v) => update("mapsUrl", v)}
            className="md:col-span-2"
          />
          <TextField label="Instagram" value={draft.instagram} maxLength={300} onChange={(v) => update("instagram", v)} />
          <TextField label="Facebook" value={draft.facebook} maxLength={300} onChange={(v) => update("facebook", v)} />
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
                  update(
                    "notes",
                    draft.notes.map((existing, i) => (i === index ? event.target.value : existing)),
                  )
                }
                className="w-full rounded-xl border border-fg/12 bg-fg/[0.04] px-3.5 py-2.5 font-sans text-[0.9rem] text-fg transition-all duration-300 hover:border-fg/20 focus:border-gold/70 focus:bg-fg/[0.07] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => update("notes", draft.notes.filter((_, i) => i !== index))}
                aria-label={`Remove badge ${index + 1}`}
                className="mt-1 grid size-8 shrink-0 place-items-center rounded-lg text-fg/40 transition-colors duration-300 hover:bg-red-400/10 hover:text-red-200"
              >
                <Trash2 aria-hidden className="size-4" strokeWidth={1.8} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => update("notes", [...draft.notes, ""])}
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
        onReset={() => {
          if (!window.confirm("Put the restaurant details back to the version that ships with the site?")) return;
          startTransition(() => resetAction());
        }}
      />
    </form>
  );
}
