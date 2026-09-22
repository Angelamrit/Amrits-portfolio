"use client";

import { startTransition, useActionState, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, GripVertical, Plus, Trash2 } from "lucide-react";
import type { MenuPatch } from "@/lib/content/menus";
import { idleState, type EditorState } from "@/lib/content/state";
import { saveMenu, resetMenuToOriginal } from "@/app/admin/(dashboard)/menus/actions";
import { Panel } from "./Panel";
import { SaveBar, useUnsavedChangesWarning } from "./SaveBar";
import { SelectField, TagPicker, TextArea, TextField, Toggle, type DietaryValue } from "./FormControls";

/**
 * The menu editor.
 *
 * The form holds the whole menu in React state and submits it as one JSON
 * field. That is a deliberate choice over named inputs: courses are an ordered
 * list that can be added to, removed from and reordered, and encoding that in
 * `courses[3].tags[1]` field names means reindexing every input on every
 * change and reassembling it on the server. One value, validated by the same
 * schema the rest of the content layer uses, is both simpler and stricter —
 * the server never trusts it, and a hand-crafted submission fails the same
 * validation the form does.
 */

export type CourseDraft = {
  title: string;
  dishId?: string;
  name?: string;
  description?: string;
  tags?: DietaryValue[];
  status: "confirmed" | "draft";
};

export type MenuDraft = {
  name: string;
  courseLabel: string;
  venue: string;
  intro: string;
  notes: string[];
  featured: boolean;
  courses: CourseDraft[];
};

const WRITTEN_OUT = "";

export function MenuEditor({
  slug,
  initial,
  dishes,
  isEdited,
}: {
  slug: string;
  initial: MenuDraft;
  dishes: { id: string; name: string }[];
  /** Whether this menu currently carries any stored edits — drives the reset button. */
  isEdited: boolean;
}) {
  const [state, formAction, pending] = useActionState<EditorState, FormData>(saveMenu, idleState);
  const [resetState, resetAction, resetPending] = useActionState<EditorState, FormData>(
    resetMenuToOriginal,
    idleState,
  );

  // After a successful save or reset the server re-renders this page with new
  // `initial`/`original` props, so the draft is compared against whichever
  // result is newer rather than against the values the page first loaded with.
  const [draft, setDraft] = useState<MenuDraft>(initial);
  const [baseline, setBaseline] = useState<MenuDraft>(initial);
  const [seen, setSeen] = useState<number>(0);

  const latest = (resetState.at ?? 0) > (state.at ?? 0) ? resetState : state;
  if (latest.at && latest.at !== seen && latest.status !== "error") {
    setSeen(latest.at);
    setDraft(initial);
    setBaseline(initial);
  }

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(baseline), [draft, baseline]);
  useUnsavedChangesWarning(dirty);

  const update = <K extends keyof MenuDraft>(key: K, value: MenuDraft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const updateCourse = (index: number, patch: Partial<CourseDraft>) =>
    setDraft((current) => ({
      ...current,
      courses: current.courses.map((course, i) => (i === index ? { ...course, ...patch } : course)),
    }));

  const moveCourse = (index: number, by: -1 | 1) =>
    setDraft((current) => {
      const target = index + by;
      if (target < 0 || target >= current.courses.length) return current;
      const courses = [...current.courses];
      [courses[index], courses[target]] = [courses[target], courses[index]];
      return { ...current, courses };
    });

  const dishOptions = [
    { value: WRITTEN_OUT, label: "Write it out below" },
    ...dishes.map((dish) => ({ value: dish.id, label: dish.name })),
  ];

  const patch: MenuPatch = {
    name: draft.name,
    courseLabel: draft.courseLabel,
    venue: draft.venue,
    intro: draft.intro,
    notes: draft.notes.map((note) => note.trim()).filter(Boolean),
    featured: draft.featured,
    courses: draft.courses.map((course) => ({
      title: course.title,
      // A course either points at a dish or writes itself out. Sending both
      // would leave the site with two sources for one course's description.
      ...(course.dishId
        ? { dishId: course.dishId }
        : {
            name: course.name?.trim() || undefined,
            description: course.description?.trim() || undefined,
            tags: course.tags?.length ? course.tags : undefined,
          }),
      status: course.status,
    })),
  };

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="payload" value={JSON.stringify(patch)} />

      <Panel title="The menu" hint="How this menu is introduced on the site.">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            label="Name"
            value={draft.name}
            maxLength={80}
            onChange={(value) => update("name", value)}
            hint="Shown in the navigation and at the top of the menu card."
          />
          <TextField
            label="Course count label"
            value={draft.courseLabel}
            maxLength={60}
            onChange={(value) => update("courseLabel", value)}
            hint={'Free text, e.g. "7 Courses" or "Family Style".'}
          />
          <TextField
            label="Where it is served"
            value={draft.venue}
            maxLength={80}
            onChange={(value) => update("venue", value)}
            hint={'e.g. "At Angel · New dining room".'}
            className="md:col-span-2"
          />
          <TextArea
            label="Introduction"
            value={draft.intro}
            rows={4}
            maxLength={1200}
            onChange={(value) => update("intro", value)}
            className="md:col-span-2"
          />
        </div>

        <div className="mt-5">
          <Toggle
            label="Show on the home page"
            hint="Featured menus appear in the menus preview on the home page."
            checked={draft.featured}
            onChange={(value) => update("featured", value)}
          />
        </div>
      </Panel>

      <Panel
        title="Courses"
        hint="In the order they are served. Each course either points at a dish or is written out here."
        action={
          <button
            type="button"
            onClick={() =>
              setDraft((current) => ({
                ...current,
                courses: [...current.courses, { title: "New course", status: "draft" }],
              }))
            }
            className="inline-flex shrink-0 items-center gap-2 rounded-pill border border-gold/35 px-3.5 py-2 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-gold-light transition-colors duration-300 hover:border-gold/70 hover:bg-gold/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            <Plus aria-hidden className="size-3.5" strokeWidth={2} />
            Add course
          </button>
        }
      >
        {draft.courses.length === 0 ? (
          <p className="rounded-xl border border-dashed border-fg/12 px-5 py-8 text-center text-[0.82rem] text-fg/40">
            This menu has no courses yet.
          </p>
        ) : (
          <ol className="flex flex-col gap-3">
            {draft.courses.map((course, index) => (
              <li
                key={index}
                className="rounded-frame border border-fg/10 bg-fg/[0.025] p-4 transition-colors duration-300 hover:border-fg/20"
              >
                <div className="flex items-center gap-2">
                  <GripVertical aria-hidden className="size-4 shrink-0 text-fg/20" strokeWidth={1.5} />
                  <span className="font-sans text-[0.7rem] tnum text-fg/35">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1" />
                  <button
                    type="button"
                    onClick={() => moveCourse(index, -1)}
                    disabled={index === 0}
                    aria-label={`Move ${course.title || "this course"} up`}
                    className="grid size-8 place-items-center rounded-lg text-fg/40 transition-colors duration-300 hover:bg-fg/[0.06] hover:text-fg disabled:pointer-events-none disabled:opacity-25"
                  >
                    <ChevronUp aria-hidden className="size-4" strokeWidth={1.8} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveCourse(index, 1)}
                    disabled={index === draft.courses.length - 1}
                    aria-label={`Move ${course.title || "this course"} down`}
                    className="grid size-8 place-items-center rounded-lg text-fg/40 transition-colors duration-300 hover:bg-fg/[0.06] hover:text-fg disabled:pointer-events-none disabled:opacity-25"
                  >
                    <ChevronDown aria-hidden className="size-4" strokeWidth={1.8} />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        courses: current.courses.filter((_, i) => i !== index),
                      }))
                    }
                    aria-label={`Remove ${course.title || "this course"}`}
                    className="grid size-8 place-items-center rounded-lg text-fg/40 transition-colors duration-300 hover:bg-red-400/10 hover:text-red-200"
                  >
                    <Trash2 aria-hidden className="size-4" strokeWidth={1.8} />
                  </button>
                </div>

                <div className="mt-3 grid gap-4 md:grid-cols-2">
                  <TextField
                    label="Heading"
                    value={course.title}
                    maxLength={80}
                    onChange={(value) => updateCourse(index, { title: value })}
                    hint={'The line above the dish, e.g. "Welcome" or "From the Tandoor".'}
                  />
                  <SelectField
                    label="Dish"
                    value={course.dishId ?? WRITTEN_OUT}
                    onChange={(value) =>
                      updateCourse(index, value ? { dishId: value } : { dishId: undefined })
                    }
                    options={dishOptions}
                    hint="Picking a dish pulls in its photograph, description and dietary tags."
                  />

                  {!course.dishId && (
                    <>
                      <TextField
                        label="Course name"
                        value={course.name ?? ""}
                        maxLength={120}
                        onChange={(value) => updateCourse(index, { name: value })}
                        className="md:col-span-2"
                      />
                      <TextArea
                        label="Description"
                        value={course.description ?? ""}
                        rows={3}
                        maxLength={600}
                        onChange={(value) => updateCourse(index, { description: value })}
                        className="md:col-span-2"
                      />
                      <div className="md:col-span-2">
                        <TagPicker
                          label="Dietary tags"
                          selected={course.tags ?? []}
                          onChange={(tags) => updateCourse(index, { tags })}
                        />
                      </div>
                    </>
                  )}

                  <div className="md:col-span-2">
                    <Toggle
                      label="Confirmed with Chef"
                      hint={
                        course.status === "confirmed"
                          ? "Shown as a normal course."
                          : 'Shown on the site as "to be confirmed with Chef".'
                      }
                      checked={course.status === "confirmed"}
                      onChange={(on) => updateCourse(index, { status: on ? "confirmed" : "draft" })}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Panel>

      <Panel title="Notes" hint="The small print under the menu — dietary notes, how to book.">
        <div className="flex flex-col gap-2">
          {draft.notes.map((note, index) => (
            <div key={index} className="flex items-start gap-2">
              <input
                type="text"
                value={note}
                maxLength={240}
                aria-label={`Note ${index + 1}`}
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
                aria-label={`Remove note ${index + 1}`}
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
            Add note
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
          if (!window.confirm("Put this menu back to the version that ships with the site? Your edits to it will be lost.")) return;
          const data = new FormData();
          data.set("slug", slug);
          // Dispatched by hand rather than by a form submission, so it has to
          // be put inside a transition itself — otherwise React cannot track
          // it and `resetPending` never becomes true.
          startTransition(() => resetAction(data));
        }}
      />
    </form>
  );
}
