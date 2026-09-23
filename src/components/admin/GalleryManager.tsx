"use client";

import Image from "next/image";
import { startTransition, useActionState, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  ImagePlus,
  LoaderCircle,
  Star,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { idleState, type EditorState } from "@/lib/content/state";
import type { GalleryCategory, GalleryItem } from "@/types/content";
import {
  removeUpload,
  reorderGallery,
  saveGalleryItem,
  toggleGalleryItem,
  uploadPhotographs,
} from "@/app/admin/(dashboard)/gallery/actions";
import { Panel } from "./Panel";
import { SelectField, TextArea, TextField, Toggle } from "./FormControls";

/**
 * The gallery, managed as a wall of pictures rather than a form.
 *
 * Everything here takes effect on its own: hiding a photograph, moving it,
 * deleting an upload. There is no staged "save" over the whole wall, because
 * the actions are individually small and individually reversible, and a chef
 * rearranging twenty pictures should not have to remember to press a button at
 * the end. The one exception is the panel that edits a single picture's
 * caption, which does have a save — text needs finishing before it is stored.
 */

export type AdminGalleryItem = GalleryItem & { hidden: boolean; uploaded: boolean };

type Props = {
  items: AdminGalleryItem[];
  categories: { value: GalleryCategory | "all"; label: string }[];
};

const SPANS = [
  { value: "square", label: "Square" },
  { value: "wide", label: "Wide" },
  { value: "tall", label: "Tall" },
];

export function GalleryManager({ items, categories }: Props) {
  const editable = categories.filter((category) => category.value !== "all");

  const [uploadState, uploadAction, uploading] = useActionState<EditorState, FormData>(
    uploadPhotographs,
    idleState,
  );
  const [itemState, itemAction, savingItem] = useActionState<EditorState, FormData>(saveGalleryItem, idleState);
  const [, toggleAction] = useActionState<EditorState, FormData>(toggleGalleryItem, idleState);
  const [orderState, orderAction, reordering] = useActionState<EditorState, FormData>(reorderGallery, idleState);
  const [deleteState, deleteAction, deleting] = useActionState<EditorState, FormData>(removeUpload, idleState);

  const [filter, setFilter] = useState<GalleryCategory | "all">("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadCategory, setUploadCategory] = useState<string>(String(editable[0]?.value ?? "signature-dishes"));
  const [uploadAlt, setUploadAlt] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  // The wall is reordered here and then sent, so a move is immediate on screen
  // rather than waiting on a round trip.
  const [order, setOrder] = useState<string[]>(items.map((item) => item.id));
  const ranked = [...items].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  const shown = filter === "all" ? ranked : ranked.filter((item) => item.category === filter);

  const open = items.find((item) => item.id === openId) ?? null;

  const move = (id: string, by: -1 | 1) => {
    const next = [...order];
    const from = next.indexOf(id);
    const to = from + by;
    if (from < 0 || to < 0 || to >= next.length) return;
    [next[from], next[to]] = [next[to], next[from]];
    setOrder(next);

    const data = new FormData();
    data.set("order", JSON.stringify(next));
    startTransition(() => orderAction(data));
  };

  const setVisibility = (id: string, hidden: boolean) => {
    const data = new FormData();
    data.set("id", id);
    data.set("hidden", String(hidden));
    startTransition(() => toggleAction(data));
  };

  const latestMessage =
    [deleteState, uploadState, orderState, itemState]
      .filter((state) => state.at)
      .sort((a, b) => (b.at ?? 0) - (a.at ?? 0))[0] ?? null;

  return (
    <div className="flex flex-col gap-4">
      {/* ---------------- upload ---------------- */}
      <Panel title="Add photographs" hint="JPEG, PNG or WebP. They appear on the site as soon as they finish uploading.">
        <form
          action={(data) => {
            for (const file of files) data.append("files", file);
            uploadAction(data);
            setFiles([]);
            setUploadAlt("");
            if (fileInput.current) fileInput.current.value = "";
          }}
          className="flex flex-col gap-4"
        >
          {/* The controls are React-controlled, so the values are carried into
              the submission explicitly rather than by the inputs' own names. */}
          <input type="hidden" name="category" value={uploadCategory} />
          <input type="hidden" name="alt" value={uploadAlt} />

          <div className="grid gap-4 md:grid-cols-2">
            <SelectField
              label="Part of the gallery"
              value={uploadCategory}
              onChange={setUploadCategory}
              options={editable.map((category) => ({ value: String(category.value), label: category.label }))}
            />
            <TextField
              label="Describe the photograph"
              value={uploadAlt}
              maxLength={240}
              onChange={setUploadAlt}
              hint="Read aloud by screen readers, and shown if the picture fails to load."
            />
          </div>

          <label
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-frame border border-dashed px-6 py-10 text-center transition-colors duration-300",
              files.length > 0 ? "border-gold/50 bg-gold/[0.06]" : "border-fg/15 hover:border-gold/40 hover:bg-fg/[0.03]",
            )}
          >
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="sr-only"
              onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
            />
            <span className="grid size-11 place-items-center rounded-full border border-gold/25 bg-gold/10">
              <ImagePlus aria-hidden className="size-5 text-gold" strokeWidth={1.5} />
            </span>
            <span className="text-[0.88rem] text-fg/70">
              {files.length === 0
                ? "Choose photographs, or drop them here"
                : `${files.length} ${files.length === 1 ? "photograph" : "photographs"} ready`}
            </span>
            <span className="text-[0.72rem] text-fg/35">Up to twelve at a time, 12MB each</span>
          </label>

          {files.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {files.map((file, index) => (
                <li
                  key={`${file.name}-${index}`}
                  className="flex items-center gap-2 rounded-pill border border-fg/12 px-3 py-1.5 text-[0.72rem] text-fg/60"
                >
                  <span className="max-w-[12rem] truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => setFiles(files.filter((_, i) => i !== index))}
                    aria-label={`Remove ${file.name}`}
                    className="text-fg/35 transition-colors duration-200 hover:text-red-200"
                  >
                    <X aria-hidden className="size-3" strokeWidth={2.4} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={uploading || files.length === 0 || uploadAlt.trim().length < 3}
              className="btn-primary inline-flex items-center gap-2 rounded-pill px-6 py-3 font-sans text-[0.68rem] font-semibold uppercase tracking-[0.18em] disabled:pointer-events-none disabled:opacity-40"
            >
              {uploading ? (
                <LoaderCircle aria-hidden className="size-3.5 animate-spin" strokeWidth={2} />
              ) : (
                <Upload aria-hidden className="size-3.5" strokeWidth={1.8} />
              )}
              {uploading ? "Uploading" : "Upload"}
            </button>

            {latestMessage && (
              <p
                aria-live="polite"
                className={cn(
                  "text-[0.8rem]",
                  latestMessage.status === "error" ? "text-[#e59a93]" : "text-[#7fc39b]",
                )}
              >
                {latestMessage.message ?? (latestMessage.status === "error" ? "That did not work." : "Saved.")}
              </p>
            )}
          </div>
        </form>
      </Panel>

      {/* ---------------- the wall ---------------- */}
      <Panel
        title="The gallery"
        hint="Drag order, captions and which pictures are shown. Changes are live immediately."
        action={
          reordering ? (
            <span className="flex items-center gap-2 text-[0.72rem] text-fg/45">
              <LoaderCircle aria-hidden className="size-3.5 animate-spin" strokeWidth={2} />
              Saving order
            </span>
          ) : undefined
        }
      >
        <div className="mb-5 flex flex-wrap gap-1.5">
          {categories.map((category) => (
            <button
              key={String(category.value)}
              type="button"
              onClick={() => setFilter(category.value)}
              aria-pressed={filter === category.value}
              className={cn(
                "rounded-pill border px-3.5 py-1.5 text-[0.7rem] transition-all duration-300",
                filter === category.value
                  ? "border-gold/50 bg-gold/15 text-gold-light"
                  : "border-fg/12 text-fg/45 hover:border-fg/25 hover:text-fg/75",
              )}
            >
              {category.label}
            </button>
          ))}
        </div>

        {shown.length === 0 ? (
          <p className="rounded-xl border border-dashed border-fg/12 px-5 py-10 text-center text-[0.82rem] text-fg/40">
            Nothing in this part of the gallery yet.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {shown.map((item) => (
              <li key={item.id}>
                <div
                  className={cn(
                    "group relative overflow-hidden rounded-frame border transition-all duration-500 ease-luxe",
                    item.hidden ? "border-fg/10 opacity-45" : "border-fg/12 hover:border-gold/40 hover:shadow-glow",
                  )}
                >
                  <span className="relative block aspect-square bg-sand">
                    <Image
                      src={item.image.src}
                      alt={item.image.alt}
                      fill
                      sizes="(min-width: 1280px) 18vw, (min-width: 640px) 30vw, 45vw"
                      className="object-cover transition-transform duration-[1200ms] ease-luxe group-hover:scale-105"
                    />
                    <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/10 to-transparent" />

                    <span className="absolute left-2 top-2 flex flex-wrap gap-1">
                      {item.featured && (
                        <span className="grid size-6 place-items-center rounded-full bg-charcoal/75 text-gold-light backdrop-blur" title="Featured">
                          <Star aria-hidden className="size-3 fill-current" strokeWidth={0} />
                        </span>
                      )}
                      {item.uploaded && (
                        <span className="rounded-pill bg-charcoal/75 px-2 py-0.5 text-[0.55rem] uppercase tracking-[0.12em] text-[#7fc39b] backdrop-blur">
                          Yours
                        </span>
                      )}
                    </span>

                    <span className="absolute inset-x-2 bottom-2">
                      <span className="block truncate text-[0.72rem] text-ivory/90">
                        {item.caption ?? item.image.alt}
                      </span>
                    </span>
                  </span>

                  <div className="flex items-center gap-0.5 border-t border-fg/10 p-1.5">
                    <button
                      type="button"
                      onClick={() => move(item.id, -1)}
                      aria-label="Move earlier"
                      className="grid size-7 place-items-center rounded-lg text-fg/40 transition-colors duration-200 hover:bg-fg/[0.06] hover:text-fg"
                    >
                      <ArrowLeft aria-hidden className="size-3.5" strokeWidth={1.8} />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(item.id, 1)}
                      aria-label="Move later"
                      className="grid size-7 place-items-center rounded-lg text-fg/40 transition-colors duration-200 hover:bg-fg/[0.06] hover:text-fg"
                    >
                      <ArrowRight aria-hidden className="size-3.5" strokeWidth={1.8} />
                    </button>

                    <span className="flex-1" />

                    <button
                      type="button"
                      onClick={() => setVisibility(item.id, !item.hidden)}
                      aria-label={item.hidden ? "Show on the site" : "Hide from the site"}
                      title={item.hidden ? "Show on the site" : "Hide from the site"}
                      className="grid size-7 place-items-center rounded-lg text-fg/40 transition-colors duration-200 hover:bg-fg/[0.06] hover:text-gold"
                    >
                      {item.hidden ? (
                        <EyeOff aria-hidden className="size-3.5" strokeWidth={1.8} />
                      ) : (
                        <Eye aria-hidden className="size-3.5" strokeWidth={1.8} />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setOpenId(item.id)}
                      className="rounded-lg px-2 py-1 text-[0.62rem] uppercase tracking-[0.12em] text-fg/45 transition-colors duration-200 hover:bg-fg/[0.06] hover:text-gold-light"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {open && (
        <ItemDialog
          key={open.id}
          item={open}
          categories={editable}
          onClose={() => setOpenId(null)}
          action={itemAction}
          saving={savingItem}
          onDelete={
            open.uploaded
              ? () => {
                  if (!window.confirm("Delete this photograph? It is not in the site's code, so this cannot be undone.")) return;
                  const data = new FormData();
                  data.set("id", open.id);
                  startTransition(() => deleteAction(data));
                  setOpenId(null);
                }
              : undefined
          }
          deleting={deleting}
        />
      )}
    </div>
  );
}

/** The one place in the gallery that is a form: a picture's own words. */
function ItemDialog({
  item,
  categories,
  onClose,
  action,
  saving,
  onDelete,
  deleting,
}: {
  item: AdminGalleryItem;
  categories: { value: GalleryCategory | "all"; label: string }[];
  onClose: () => void;
  action: (payload: FormData) => void;
  saving: boolean;
  onDelete?: () => void;
  deleting: boolean;
}) {
  const [caption, setCaption] = useState(item.caption ?? "");
  const [alt, setAlt] = useState(item.image.alt);
  const [category, setCategory] = useState<string>(item.category);
  const [featured, setFeatured] = useState(Boolean(item.featured));
  const [span, setSpan] = useState<string>(item.span ?? "square");

  const payload = JSON.stringify({ caption, alt, category, featured, span });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-charcoal/85 backdrop-blur-sm" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Edit photograph"
        className="glass-strong border-gradient relative z-10 max-h-[90dvh] w-full max-w-3xl overflow-y-auto rounded-frame"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-20 grid size-9 place-items-center rounded-xl text-fg/60 transition-colors duration-300 hover:text-gold"
        >
          <X aria-hidden className="size-4" strokeWidth={1.8} />
        </button>

        <div className="grid gap-6 p-6 md:grid-cols-[minmax(0,14rem)_1fr]">
          <span className="relative block aspect-square overflow-hidden rounded-frame bg-sand">
            <Image src={item.image.src} alt="" fill sizes="240px" className="object-cover" />
          </span>

          <form
            action={(data) => {
              data.set("id", item.id);
              data.set("payload", payload);
              action(data);
              onClose();
            }}
            className="flex flex-col gap-4"
          >
            <TextField label="Caption" value={caption} maxLength={160} onChange={setCaption} hint="Shown under the picture in the gallery." />
            <TextArea
              label="Description for screen readers"
              value={alt}
              rows={2}
              maxLength={240}
              onChange={setAlt}
              hint="What is in the photograph, in a sentence."
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Part of the gallery"
                value={category}
                onChange={setCategory}
                options={categories.map((entry) => ({ value: String(entry.value), label: entry.label }))}
              />
              <SelectField label="Shape on the wall" value={span} onChange={setSpan} options={SPANS} />
            </div>
            <Toggle
              label="Featured"
              hint="Featured pictures lead the gallery and appear in the home page's editorial strip."
              checked={featured}
              onChange={setFeatured}
            />

            <div className="mt-2 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary inline-flex items-center gap-2 rounded-pill px-6 py-2.5 font-sans text-[0.68rem] font-semibold uppercase tracking-[0.18em] disabled:pointer-events-none disabled:opacity-40"
              >
                {saving ? <LoaderCircle aria-hidden className="size-3.5 animate-spin" strokeWidth={2} /> : null}
                Save
              </button>

              {onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  disabled={deleting}
                  className="inline-flex items-center gap-2 rounded-pill border border-[#e59a93]/30 px-4 py-2.5 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[#e59a93] transition-colors duration-300 hover:border-[#e59a93]/60 hover:bg-[#e59a93]/10 disabled:pointer-events-none disabled:opacity-40"
                >
                  <Trash2 aria-hidden className="size-3.5" strokeWidth={1.8} />
                  Delete
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
