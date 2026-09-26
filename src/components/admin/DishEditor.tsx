"use client";

import { startTransition, useActionState, useMemo, useState } from "react";
import type { DishPatch } from "@/lib/content/dishes";
import { idleState, type EditorState } from "@/lib/content/state";
import { resetDishToOriginal, saveDish } from "@/app/admin/(dashboard)/dishes/actions";
import { ImagePicker, type ImageChoice } from "./ImagePicker";
import { Panel } from "./Panel";
import { SaveBar, useUnsavedChangesWarning } from "./SaveBar";
import { TagPicker, TextArea, TextField, Toggle, type DietaryValue } from "./FormControls";

/**
 * The dish editor.
 *
 * Same shape as the menu editor — everything in one client-held draft,
 * submitted as a single validated JSON field — because they are the same job
 * and a chef should not have to learn two ways of editing his own content.
 */

export type DishDraft = {
  name: string;
  tagline: string;
  description: string;
  tags: DietaryValue[];
  signature: boolean;
  order: number;
  imageKey: string;
};

export function DishEditor({
  id,
  initial,
  images,
  isEdited,
}: {
  id: string;
  initial: DishDraft;
  images: ImageChoice[];
  isEdited: boolean;
}) {
  const [state, formAction, pending] = useActionState<EditorState, FormData>(saveDish, idleState);
  const [resetState, resetAction, resetPending] = useActionState<EditorState, FormData>(
    resetDishToOriginal,
    idleState,
  );

  const [draft, setDraft] = useState<DishDraft>(initial);
  const [baseline, setBaseline] = useState<DishDraft>(initial);
  const [seen, setSeen] = useState(0);

  // The server re-renders this page after a save, so the "unsaved changes"
  // comparison moves on to the values that were just written rather than the
  // ones the page originally loaded with.
  const latest = (resetState.at ?? 0) > (state.at ?? 0) ? resetState : state;
  if (latest.at && latest.at !== seen && latest.status !== "error") {
    setSeen(latest.at);
    setDraft(initial);
    setBaseline(initial);
  }

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(baseline), [draft, baseline]);
  useUnsavedChangesWarning(dirty);

  const update = <K extends keyof DishDraft>(key: K, value: DishDraft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const patch: DishPatch = {
    name: draft.name,
    tagline: draft.tagline,
    description: draft.description,
    tags: draft.tags,
    signature: draft.signature,
    order: draft.order,
    imageKey: draft.imageKey || undefined,
  };

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="payload" value={JSON.stringify(patch)} />

      <Panel title="The dish" hint="How this dish is written on the menus and the home page.">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            label="Name"
            value={draft.name}
            maxLength={90}
            onChange={(value) => update("name", value)}
          />
          <TextField
            label="Tagline"
            value={draft.tagline}
            maxLength={120}
            onChange={(value) => update("tagline", value)}
            hint={'The short line under the name, e.g. "The Indian classic".'}
          />
          <TextArea
            label="Description"
            value={draft.description}
            rows={4}
            maxLength={600}
            onChange={(value) => update("description", value)}
            hint="One or two sentences. This is what a guest reads before ordering."
            className="md:col-span-2"
          />
          <div className="md:col-span-2">
            <TagPicker
              label="Dietary tags"
              hint="Shown as badges beside the dish, and used by the dietary key on the menus page."
              selected={draft.tags}
              onChange={(tags) => update("tags", tags)}
            />
          </div>
        </div>
      </Panel>

      <Panel title="Where it appears" hint="Whether this dish is one of the signatures, and in what order.">
        <div className="grid gap-4 md:grid-cols-2">
          <Toggle
            label="A signature dish"
            hint="Signature dishes appear in the showcase on the home page and on the Angel page."
            checked={draft.signature}
            onChange={(value) => update("signature", value)}
          />
          <TextField
            label="Position"
            value={String(draft.order)}
            onChange={(value) => {
              // Anything that is not a number is ignored rather than written
              // as NaN, which would sort the dish to an unpredictable place.
              const next = Number(value.replace(/[^0-9]/g, ""));
              if (Number.isFinite(next)) update("order", Math.min(99, Math.max(1, next || 1)));
            }}
            hint="1 comes first. Dishes are listed in this order everywhere on the site."
          />
        </div>
      </Panel>

      <Panel title="Photograph" hint="Pick from the site's pictures. New photography is added in Gallery.">
        <ImagePicker
          label="Picture"
          choices={images}
          value={draft.imageKey}
          onChange={(key) => update("imageKey", key)}
        />
      </Panel>

      <SaveBar
        state={latest}
        pending={pending}
        dirty={dirty}
        resetPending={resetPending}
        canReset={isEdited}
        onReset={() => {
          if (!window.confirm("Put this dish back to the version that ships with the site? Your edits to it will be lost.")) return;
          const data = new FormData();
          data.set("id", id);
          startTransition(() => resetAction(data));
        }}
      />
    </form>
  );
}
