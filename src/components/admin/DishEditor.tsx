"use client";

import Image from "next/image";
import Link from "next/link";
import { startTransition, useActionState, useMemo, useState } from "react";
import { ArrowUpRight, CircleAlert, EyeOff, LoaderCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Appearance } from "@/lib/content/dish-usage";
import type { DishForm } from "@/lib/content/dishes";
import { idleState, type EditorState } from "@/lib/content/state";
import { DietaryBadges } from "@/components/ui/Badge";
import {
  createDishAction,
  deleteDishAction,
  resetDishAction,
  saveDishAction,
} from "@/app/admin/(dashboard)/dishes/actions";
import type { ImageChoice } from "./ImagePicker";
import { Panel } from "./Panel";
import { PhotoField } from "./PhotoField";
import { SaveBar, useUnsavedChangesWarning } from "./SaveBar";
import { TagPicker, TextArea, TextField, Toggle, useFieldSetters, type DietaryValue } from "./FormControls";

/**
 * Adding a dish, or editing one.
 *
 * Built around the two questions the chef actually has: "what will guests
 * see?" and "where will they see it?". The preview beside the form is the
 * dish as the website draws it, updating as he types; the switches under it
 * say in words which pages it appears on. The photograph comes first and is
 * changed in one step — straight from the phone or computer, or from the
 * pictures already on the site — rather than through a long grid.
 */

export type DishDraft = DishForm & { tags: DietaryValue[] };

export function DishEditor({
  mode,
  id,
  initial,
  images,
  canReset = false,
  canDelete = false,
  inMenus,
}: {
  mode: "create" | "edit";
  id?: string;
  initial: DishDraft;
  images: ImageChoice[];
  /** A code dish with stored edits. */
  canReset?: boolean;
  /** A dish the chef added himself. */
  canDelete?: boolean;
  /** Menu courses that point at this dish. */
  inMenus: Appearance[];
}) {
  const [state, formAction, pending] = useActionState<EditorState, FormData>(
    mode === "create" ? createDishAction : saveDishAction,
    idleState,
  );
  const [resetState, resetAction, resetPending] = useActionState<EditorState, FormData>(resetDishAction, idleState);
  const [deleteState, deleteAction, deleting] = useActionState<EditorState, FormData>(deleteDishAction, idleState);

  const [draft, setDraft] = useState<DishDraft>(initial);
  const [baseline, setBaseline] = useState<DishDraft>(initial);
  const [seen, setSeen] = useState(0);

  // After a save or reset the server renders this page again with new
  // `initial` values, and the comparison moves on to them. (A failed delete
  // is reported in its own panel, not in the save bar.)
  const latest = (resetState.at ?? 0) > (state.at ?? 0) ? resetState : state;
  if (mode === "edit" && latest.at && latest.at !== seen && latest.status !== "error") {
    setSeen(latest.at);
    setDraft(initial);
    setBaseline(initial);
  }

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(baseline), [draft, baseline]);
  useUnsavedChangesWarning(dirty && !deleting);

  // Stable handlers, one per field, so a keystroke redraws only its own field.
  const set = useFieldSetters(initial, setDraft);

  // Photographs uploaded from this screen, added to the choices on the spot.
  const [uploaded, setUploaded] = useState<ImageChoice[]>([]);
  // Once saved, the server's list includes them too; each photo is listed once.
  const choices = useMemo(
    () => [...uploaded.filter((mine) => !images.some((choice) => choice.key === mine.key)), ...images],
    [uploaded, images],
  );
  const photo = choices.find((choice) => choice.key === draft.imageKey);

  const problem = !draft.name.trim()
    ? "Give the dish a name."
    : !draft.imageKey
      ? "Add a photograph of the dish."
      : undefined;

  const places: string[] = draft.visible
    ? [...(draft.signature ? ["the home page", "the Angel page"] : []), ...inMenus.map((place) => place.label)]
    : [];
  const liveLink = baseline.visible ? (baseline.signature ? "/angel" : inMenus[0]?.href) : undefined;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {id && <input type="hidden" name="id" value={id} />}
      <input type="hidden" name="payload" value={JSON.stringify(draft)} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        {/* ------------------------------------------------ the form */}
        <div className="flex min-w-0 flex-col gap-4">
          <PhotoField
            hint="The picture guests see beside the dish. Upload one from your phone or computer, or pick one already on the website."
            photo={photo}
            altText={draft.name}
            choices={choices}
            value={draft.imageKey}
            onChange={set.imageKey}
            onUploaded={(choice) => {
              setUploaded((current) => [choice, ...current]);
              set.imageKey(choice.key);
            }}
          />

          <Panel title="Name and description" hint="The words guests read on the website.">
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="Name of the dish"
                value={draft.name}
                maxLength={90}
                placeholder="e.g. Paneer Tikka"
                error={mode === "edit" && !draft.name.trim() ? "A dish needs a name." : undefined}
                onChange={set.name}
              />
              <TextField
                label="Short line under the name"
                value={draft.tagline}
                maxLength={120}
                placeholder="e.g. From the tandoor"
                onChange={set.tagline}
                hint="A few words. Optional."
              />
              <TextArea
                label="Description"
                value={draft.description}
                rows={4}
                maxLength={600}
                onChange={set.description}
                hint="One or two sentences — what a guest reads before ordering."
                className="md:col-span-2"
              />
              <div className="md:col-span-2">
                <TagPicker
                  label="Dietary information"
                  hint="Tap every one that applies. Guests see them as small badges beside the dish."
                  selected={draft.tags}
                  onChange={set.tags}
                />
              </div>
            </div>
          </Panel>

          <Panel title="Where guests see it" hint="Switch the dish on or off the website, and choose if it is one of your signature dishes.">
            <div className="grid gap-3 md:grid-cols-2">
              <Toggle
                label="Show on the website"
                hint={draft.visible ? "Guests can see this dish." : "Hidden from every page. Nothing is lost — switch it back on any time."}
                checked={draft.visible}
                onChange={set.visible}
              />
              <Toggle
                label="Signature dish"
                hint="Signature dishes are featured on the home page and on the Angel page."
                checked={draft.signature}
                onChange={set.signature}
              />
            </div>
            <p className="mt-4 text-[0.8rem] leading-relaxed text-fg/60">
              {!draft.visible ? (
                <span className="flex items-center gap-2 text-fg/50">
                  <EyeOff aria-hidden className="size-3.5 shrink-0" strokeWidth={1.8} />
                  Guests will not see this dish anywhere.
                </span>
              ) : places.length > 0 ? (
                <>
                  <span className="text-fg/45">Guests see it on </span>
                  <span className="text-fg/85">{places.join(", ")}</span>.
                </>
              ) : (
                <span className="text-gold-light/85">
                  It will not appear anywhere yet. Switch on “Signature dish”, or add it to a menu in Menus.
                </span>
              )}
            </p>
          </Panel>

          {canDelete && id && (
            <Panel title="Delete this dish" hint="For dishes you added yourself. This cannot be undone.">
              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => {
                    const warning =
                      inMenus.length > 0
                        ? `\n\nIt is used in ${inMenus.map((place) => place.label).join(", ")}. That course will show only its heading until you choose another dish in Menus.`
                        : "";
                    if (!window.confirm(`Delete “${initial.name}” for good?${warning}`)) return;
                    const data = new FormData();
                    data.set("id", id);
                    startTransition(() => deleteAction(data));
                  }}
                  className="inline-flex items-center gap-2 rounded-pill border border-[#e59a93]/35 px-5 py-2.5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#e59a93] transition-colors duration-300 hover:border-[#e59a93]/70 hover:bg-[#e59a93]/10 disabled:pointer-events-none disabled:opacity-40"
                >
                  {deleting ? (
                    <LoaderCircle aria-hidden className="size-3.5 animate-spin" strokeWidth={2} />
                  ) : (
                    <Trash2 aria-hidden className="size-3.5" strokeWidth={1.8} />
                  )}
                  Delete dish
                </button>
                <p className="text-[0.76rem] text-fg/45">To take it off the website but keep it, switch off “Show on the website” instead.</p>
              </div>
              {deleteState.status === "error" && (
                <p role="alert" className="mt-3 flex items-center gap-2 text-[0.78rem] text-[#e59a93]">
                  <CircleAlert aria-hidden className="size-3.5" strokeWidth={1.8} />
                  {deleteState.message}
                </p>
              )}
            </Panel>
          )}
        </div>

        {/* ------------------------------------------------ the preview */}
        <aside className="flex flex-col gap-3 lg:sticky lg:top-8" aria-label="Preview">
          <p className="eyebrow text-[0.6rem] text-fg/45">How guests see it</p>
          <div
            className={cn(
              "glass-strong border-gradient overflow-hidden rounded-frame p-3 transition-opacity duration-500",
              !draft.visible && "opacity-50",
            )}
          >
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-sand">
              {photo ? (
                <Image src={photo.src} alt="" fill sizes="(min-width: 1024px) 22rem, 90vw" className="object-cover" />
              ) : (
                <span className="absolute inset-0 grid place-items-center text-[0.78rem] text-fg/40">No photograph yet</span>
              )}
              {!draft.visible && (
                <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-pill bg-charcoal/85 px-2.5 py-1 text-[0.58rem] uppercase tracking-[0.14em] text-fg/80">
                  <EyeOff aria-hidden className="size-3" strokeWidth={2} />
                  Hidden
                </span>
              )}
            </div>
            <div className="px-2 pb-2 pt-4">
              <p className="eyebrow text-[0.6rem] text-gold-light/80">{draft.tagline || "Short line under the name"}</p>
              <p className={cn("mt-2 font-display text-[1.6rem] leading-tight", draft.name ? "text-gold-gradient" : "text-fg/30")}>
                {draft.name || "Name of the dish"}
              </p>
              {draft.description && <p className="mt-2 text-[0.84rem] leading-relaxed text-fg/70">{draft.description}</p>}
              {draft.tags.length > 0 && (
                <div className="mt-3">
                  <DietaryBadges tags={draft.tags} />
                </div>
              )}
            </div>
          </div>
          {mode === "edit" && liveLink && (
            <Link
              href={liveLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 self-start text-[0.7rem] uppercase tracking-[0.16em] text-gold-light/75 transition-colors hover:text-gold-light"
            >
              See it on the website <ArrowUpRight aria-hidden className="size-3.5" strokeWidth={1.8} />
            </Link>
          )}
        </aside>
      </div>

      <SaveBar
        state={latest}
        pending={pending}
        dirty={dirty}
        problem={problem}
        submitLabel={mode === "create" ? "Add dish" : "Save changes"}
        pendingLabel={mode === "create" ? "Adding" : "Saving"}
        idleMessage={mode === "create" ? "Fill in the name and add a photograph, then press Add dish." : "No changes yet"}
        resetPending={resetPending}
        canReset={canReset}
        onReset={
          mode === "edit" && id && canReset
            ? () => {
                if (!window.confirm("Put this dish back the way it came with the website? Your changes to it will be lost.")) return;
                const data = new FormData();
                data.set("id", id);
                startTransition(() => resetAction(data));
              }
            : undefined
        }
      />
    </form>
  );
}

