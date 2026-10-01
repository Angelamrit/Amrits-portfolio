"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  memo,
  startTransition,
  useActionState,
  useCallback,
  useEffect,
  useOptimistic,
  useRef,
  useState,
  type DragEvent,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  CircleAlert,
  CircleCheck,
  Eye,
  EyeOff,
  ImagePlus,
  LoaderCircle,
  PencilLine,
  Star,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { idleState, type EditorState } from "@/lib/content/state";
import { MAX_FILES_PER_BATCH, MAX_ORIGINAL_BYTES, UPLOAD_TYPES } from "@/lib/content/upload-limits";
import { readyForUpload } from "@/lib/content/prepare-upload";
import type { GalleryCategory, GalleryItem } from "@/types/content";
import {
  removeUpload,
  reorderGallery,
  saveGalleryItem,
  toggleGalleryItem,
} from "@/app/admin/(dashboard)/gallery/actions";
import { Panel } from "./Panel";
import { SelectField, TextArea, TextField, Toggle } from "./FormControls";
import { useUnsavedChangesWarning } from "./SaveBar";

/**
 * The gallery, managed as a wall of pictures rather than a form.
 *
 * Everything here takes effect on its own: hiding a photograph, moving it,
 * deleting an upload. There is no staged "save" over the whole wall, because
 * the actions are individually small and individually reversible, and a chef
 * rearranging twenty pictures should not have to remember to press a button at
 * the end. The one exception is the panel that edits a single picture's
 * caption, which does have a save — text needs finishing before it is stored.
 *
 * Moves and hides show on screen the moment they are made (`useOptimistic`)
 * and settle to whatever the server stored once it answers, so a failed write
 * visibly undoes itself rather than leaving the screen claiming a change that
 * never happened.
 */

export type AdminGalleryItem = GalleryItem & { hidden: boolean; uploaded: boolean };

type Category = { value: GalleryCategory | "all"; label: string };

type Props = {
  items: AdminGalleryItem[];
  categories: Category[];
};

const SPANS = [
  { value: "square", label: "Square" },
  { value: "wide", label: "Wide" },
  { value: "tall", label: "Tall" },
];

const MAX_MB = MAX_ORIGINAL_BYTES / 1024 / 1024;

function latestOf(...states: EditorState[]): EditorState | null {
  return states.filter((state) => state.at).sort((a, b) => (b.at ?? 0) - (a.at ?? 0))[0] ?? null;
}

/** One line of feedback: green for done, red for a problem, with the icon carrying the meaning too. */
function Status({ state, pending, pendingLabel }: { state: EditorState | null; pending: boolean; pendingLabel: string }) {
  return (
    <p aria-live="polite" className="flex min-h-5 items-center gap-2 text-[0.78rem]">
      {pending ? (
        <span className="flex items-center gap-2 text-fg/55">
          <LoaderCircle aria-hidden className="size-3.5 animate-spin" strokeWidth={2} />
          {pendingLabel}
        </span>
      ) : state?.status === "error" ? (
        <span className="flex items-start gap-2 text-[#e59a93]">
          <CircleAlert aria-hidden className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.8} />
          {state.message ?? "That did not work."}
        </span>
      ) : state?.message ? (
        <span className="flex items-center gap-2 text-[#7fc39b]">
          <CircleCheck aria-hidden className="size-3.5 shrink-0" strokeWidth={1.8} />
          {state.message}
        </span>
      ) : null}
    </p>
  );
}

export function GalleryManager({ items, categories }: Props) {
  const editable = categories.filter((category) => category.value !== "all");

  const [itemState, itemAction, savingItem] = useActionState<EditorState, FormData>(saveGalleryItem, idleState);
  const [toggleState, toggleAction, toggling] = useActionState<EditorState, FormData>(toggleGalleryItem, idleState);
  const [orderState, orderAction, reordering] = useActionState<EditorState, FormData>(reorderGallery, idleState);
  const [deleteState, deleteAction, deleting] = useActionState<EditorState, FormData>(removeUpload, idleState);

  const [filter, setFilter] = useState<GalleryCategory | "all">("all");
  const [open, setOpen] = useState<{ id: string; at: number } | null>(null);

  // The wall as the server last stored it, with any move or hide still in
  // flight laid over the top.
  const [order, setOptimisticOrder] = useOptimistic(items.map((item) => item.id));
  const [hiddenNow, setOptimisticHidden] = useOptimistic<Record<string, boolean>, [string, boolean]>(
    {},
    (current, [id, hidden]) => ({ ...current, [id]: hidden }),
  );

  // An optimistic order computed before an upload landed does not know about
  // the new picture; anything it leaves out keeps the server's position.
  const byId = new Map(items.map((item) => [item.id, item]));
  const ranked = [
    ...order.map((id) => byId.get(id)).filter((item): item is AdminGalleryItem => Boolean(item)),
    ...items.filter((item) => !order.includes(item.id)),
  ].map((item) => ({ ...item, hidden: hiddenNow[item.id] ?? item.hidden }));

  const shown = filter === "all" ? ranked : ranked.filter((item) => item.category === filter);
  const openItem = open ? (byId.get(open.id) ?? null) : null;

  // Close the caption dialog once its save has landed. Done during render,
  // like the editors' own "saved" bookkeeping, rather than in an effect.
  const [closedFor, setClosedFor] = useState(0);
  if (itemState.status === "saved" && itemState.at && itemState.at !== closedFor) {
    setClosedFor(itemState.at);
    setOpen(null);
  }

  // The handlers below are stable across renders so that a tile whose own
  // picture has not changed is skipped (see `WallTile`). They read the wall as
  // it is at the moment of the press, through this ref, rather than closing
  // over one render's copy of it.
  const wall = useRef({ shown, ranked });
  useEffect(() => {
    wall.current = { shown, ranked };
  });

  /**
   * Moves a picture past its neighbour *as shown*. With a category selected,
   * the neighbour on screen is usually not the neighbour in the full running
   * order — swapping with the latter moved the picture behind something
   * invisible and nothing seemed to happen.
   */
  const move = useCallback(
    (id: string, by: -1 | 1) => {
      const { shown, ranked } = wall.current;
      const index = shown.findIndex((item) => item.id === id);
      const neighbour = shown[index + by];
      if (index < 0 || !neighbour) return;

      const next = ranked.map((item) => item.id);
      const from = next.indexOf(id);
      const to = next.indexOf(neighbour.id);
      [next[from], next[to]] = [next[to], next[from]];

      const data = new FormData();
      data.set("order", JSON.stringify(next));
      startTransition(() => {
        setOptimisticOrder(next);
        orderAction(data);
      });
    },
    [orderAction, setOptimisticOrder],
  );

  const setVisibility = useCallback(
    (id: string, hidden: boolean) => {
      const data = new FormData();
      data.set("id", id);
      data.set("hidden", String(hidden));
      startTransition(() => {
        setOptimisticHidden([id, hidden]);
        toggleAction(data);
      });
    },
    [toggleAction, setOptimisticHidden],
  );

  const openEditor = useCallback((id: string) => setOpen({ id, at: Date.now() }), []);

  const wallState = latestOf(toggleState, orderState, deleteState, itemState.status === "saved" ? itemState : idleState);
  const wallPending = reordering || toggling || deleting;

  const counts = new Map<string, number>();
  for (const item of ranked) counts.set(item.category, (counts.get(item.category) ?? 0) + 1);

  return (
    <div className="flex flex-col gap-4">
      <Uploader categories={editable} />

      {/* ---------------- the wall ---------------- */}
      <Panel
        title="The gallery"
        hint="Use the arrows to change the order, the eye to hide or show a picture, and Edit for its caption. Every change is live at once."
      >
        <div className="mb-4 flex flex-wrap gap-1.5">
          {categories.map((category) => {
            const count = category.value === "all" ? ranked.length : (counts.get(category.value) ?? 0);
            return (
              <button
                key={String(category.value)}
                type="button"
                onClick={() => setFilter(category.value)}
                aria-pressed={filter === category.value}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-pill border px-3.5 py-1.5 text-[0.7rem] transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
                  filter === category.value
                    ? "border-gold/50 bg-gold/15 text-gold-light"
                    : "border-fg/12 text-fg/45 hover:border-fg/25 hover:text-fg/75",
                )}
              >
                {category.label}
                <span className="tnum text-[0.62rem] opacity-60">{count}</span>
              </button>
            );
          })}
        </div>

        {(wallPending || wallState?.message) && (
          <div className="mb-4">
            <Status state={wallState} pending={wallPending} pendingLabel="Saving" />
          </div>
        )}

        {shown.length === 0 ? (
          <p className="rounded-xl border border-dashed border-fg/12 px-5 py-10 text-center text-[0.82rem] text-fg/40">
            Nothing in this part of the gallery yet.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {shown.map((item, index) => (
              <WallTile
                key={item.id}
                item={item}
                isFirst={index === 0}
                isLast={index === shown.length - 1}
                onMove={move}
                onToggle={setVisibility}
                onEdit={openEditor}
              />
            ))}
          </ul>
        )}
      </Panel>

      {openItem && open && (
        <ItemDialog
          key={openItem.id}
          item={openItem}
          categories={editable}
          onClose={() => setOpen(null)}
          action={itemAction}
          saving={savingItem}
          // Only an error from a save made while this dialog was open belongs in it.
          error={itemState.status === "error" && (itemState.at ?? 0) > open.at ? itemState.message : undefined}
          onDelete={
            openItem.uploaded
              ? () => {
                  if (!window.confirm("Delete this photograph? It is not in the site's code, so this cannot be undone.")) return;
                  const data = new FormData();
                  data.set("id", openItem.id);
                  startTransition(() => deleteAction(data));
                  setOpen(null);
                }
              : undefined
          }
          deleting={deleting}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

type WallTileProps = {
  item: AdminGalleryItem;
  isFirst: boolean;
  isLast: boolean;
  onMove: (id: string, by: -1 | 1) => void;
  onToggle: (id: string, hidden: boolean) => void;
  onEdit: (id: string) => void;
};

/**
 * Compared by what is drawn, not by object identity. After an upload the
 * server sends the whole wall again and every picture arrives as a new
 * object; comparing identities would rebuild all of them, which is exactly the
 * half-second freeze at the moment a photograph lands that this exists to
 * prevent. Only the tiles whose picture, caption, badges or position changed
 * are redrawn.
 */
const sameWallTile = (a: WallTileProps, b: WallTileProps) =>
  a.isFirst === b.isFirst &&
  a.isLast === b.isLast &&
  a.onMove === b.onMove &&
  a.onToggle === b.onToggle &&
  a.onEdit === b.onEdit &&
  a.item.id === b.item.id &&
  a.item.image.src === b.item.image.src &&
  a.item.image.alt === b.item.image.alt &&
  a.item.caption === b.item.caption &&
  Boolean(a.item.featured) === Boolean(b.item.featured) &&
  a.item.uploaded === b.item.uploaded &&
  a.item.hidden === b.item.hidden;

/** One picture on the wall, with its move, hide and edit controls. */
const WallTile = memo(function WallTile({ item, isFirst, isLast, onMove, onToggle, onEdit }: WallTileProps) {
  const label = item.caption || item.image.alt;
  return (
    <li>
      <div
        className={cn(
          "group relative overflow-hidden rounded-frame border transition-all duration-500 ease-luxe",
          item.hidden ? "border-fg/10" : "border-fg/12 hover:border-gold/40 hover:shadow-glow",
        )}
      >
        <span className="relative block aspect-square bg-sand">
          <Image
            src={item.image.src}
            alt={item.image.alt}
            fill
            sizes="(min-width: 1280px) 18vw, (min-width: 640px) 30vw, 45vw"
            className={cn(
              "object-cover transition-[transform,opacity,filter] duration-[1200ms] ease-luxe group-hover:scale-105",
              item.hidden && "opacity-40 grayscale",
            )}
          />
          <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/10 to-transparent" />

          <span className="absolute left-2 top-2 flex flex-wrap gap-1">
            {item.featured && (
              <span className="grid size-6 place-items-center rounded-full bg-charcoal/75 text-gold-light backdrop-blur" title="Featured">
                <Star aria-hidden className="size-3 fill-current" strokeWidth={0} />
                <span className="sr-only">Featured</span>
              </span>
            )}
            {item.uploaded && (
              <span className="rounded-pill bg-charcoal/75 px-2 py-0.5 text-[0.55rem] uppercase tracking-[0.12em] text-[#7fc39b] backdrop-blur">
                Yours
              </span>
            )}
            {item.hidden && (
              <span className="inline-flex items-center gap-1 rounded-pill bg-charcoal/85 px-2 py-0.5 text-[0.55rem] uppercase tracking-[0.12em] text-fg/80 backdrop-blur">
                <EyeOff aria-hidden className="size-2.5" strokeWidth={2} />
                Hidden
              </span>
            )}
          </span>

          <span className="absolute inset-x-2 bottom-2">
            <span className="block truncate text-[0.72rem] text-ivory/90">{label}</span>
          </span>
        </span>

        <div className="flex items-center gap-0.5 border-t border-fg/10 p-1.5">
          <button
            type="button"
            onClick={() => onMove(item.id, -1)}
            disabled={isFirst}
            aria-label={`Move “${label}” earlier`}
            className="grid size-8 place-items-center rounded-lg text-fg/45 transition-colors duration-200 hover:bg-fg/[0.06] hover:text-fg disabled:pointer-events-none disabled:opacity-25"
          >
            <ArrowLeft aria-hidden className="size-3.5" strokeWidth={1.8} />
          </button>
          <button
            type="button"
            onClick={() => onMove(item.id, 1)}
            disabled={isLast}
            aria-label={`Move “${label}” later`}
            className="grid size-8 place-items-center rounded-lg text-fg/45 transition-colors duration-200 hover:bg-fg/[0.06] hover:text-fg disabled:pointer-events-none disabled:opacity-25"
          >
            <ArrowRight aria-hidden className="size-3.5" strokeWidth={1.8} />
          </button>

          <span className="flex-1" />

          <button
            type="button"
            onClick={() => onToggle(item.id, !item.hidden)}
            aria-label={item.hidden ? `Show “${label}” on the website` : `Hide “${label}” from the website`}
            title={item.hidden ? "Hidden — tap to show on the website" : "Shown — tap to hide from the website"}
            className={cn(
              "grid size-8 place-items-center rounded-lg transition-colors duration-200 hover:bg-fg/[0.06]",
              item.hidden ? "text-[#e59a93]/80 hover:text-[#e59a93]" : "text-fg/45 hover:text-gold",
            )}
          >
            {item.hidden ? (
              <EyeOff aria-hidden className="size-3.5" strokeWidth={1.8} />
            ) : (
              <Eye aria-hidden className="size-3.5" strokeWidth={1.8} />
            )}
          </button>

          <button
            type="button"
            onClick={() => onEdit(item.id)}
            aria-label={`Edit “${label}”`}
            className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-[0.62rem] uppercase tracking-[0.12em] text-fg/50 transition-colors duration-200 hover:bg-fg/[0.06] hover:text-gold-light"
          >
            <PencilLine aria-hidden className="size-3" strokeWidth={1.8} />
            Edit
          </button>
        </div>
      </div>
    </li>
  );
}, sameWallTile);

type Queued = {
  key: string;
  file: File;
  preview: string;
  status: "ready" | "uploading" | "failed";
  message?: string;
};

/**
 * Adding photographs.
 *
 * Files go to the server one at a time rather than as one request: each stays
 * well inside what the server accepts, the progress means something ("3 of
 * 7"), and a picture that fails is left in the tray with its reason while the
 * rest still land. Files are checked here first — type and size — so a
 * 30MB picture is turned away before it is sent rather than after.
 */
function Uploader({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [queue, setQueue] = useState<Queued[]>([]);
  const [category, setCategory] = useState<string>(String(categories[0]?.value ?? "signature-dishes"));
  const [alt, setAlt] = useState("");
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [notice, setNotice] = useState<EditorState>(idleState);
  const input = useRef<HTMLInputElement>(null);

  // Previews are object URLs, which hold the file in memory until released.
  const previews = useRef(new Set<string>());
  useEffect(() => {
    const urls = previews.current;
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
    };
  }, []);

  const uploading = progress !== null;
  useUnsavedChangesWarning(uploading || queue.length > 0);

  const release = (entry: Queued) => {
    URL.revokeObjectURL(entry.preview);
    previews.current.delete(entry.preview);
  };

  const add = (files: File[]) => {
    const refused: string[] = [];
    const room = MAX_FILES_PER_BATCH - queue.length;
    const accepted: Queued[] = [];

    for (const file of files) {
      if (!(UPLOAD_TYPES as readonly string[]).includes(file.type)) {
        refused.push(`${file.name} is not a JPEG, PNG or WebP photograph.`);
      } else if (file.size > MAX_ORIGINAL_BYTES) {
        refused.push(`${file.name} is larger than ${MAX_MB}MB.`);
      } else if (accepted.length >= room) {
        refused.push(`Only ${MAX_FILES_PER_BATCH} at a time — upload these first, then add the rest.`);
        break;
      } else {
        const preview = URL.createObjectURL(file);
        previews.current.add(preview);
        accepted.push({ key: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`, file, preview, status: "ready" });
      }
    }

    if (accepted.length > 0) setQueue((current) => [...current, ...accepted]);
    setNotice(refused.length > 0 ? { status: "error", message: refused[0] } : idleState);
  };

  const remove = (entry: Queued) => {
    release(entry);
    setQueue((current) => current.filter((item) => item.key !== entry.key));
  };

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);
    if (!uploading) add(Array.from(event.dataTransfer.files));
  };

  const upload = async () => {
    const batch = queue;
    const description = alt.trim();
    if (batch.length === 0 || description.length < 3 || uploading) return;

    setProgress({ done: 0, total: batch.length });
    setNotice(idleState);

    let added = 0;
    let failed = 0;
    let firstProblem: string | undefined;

    for (const [index, entry] of batch.entries()) {
      setQueue((current) => current.map((item) => (item.key === entry.key ? { ...item, status: "uploading", message: undefined } : item)));

      let problem: string | undefined;
      let signedOut = false;
      try {
        // Shrunk in the browser first: the live site refuses uploads over 4.5MB.
        const ready = await readyForUpload(entry.file);
        if (!ready.ok) throw new Error(ready.reason);

        const data = new FormData();
        data.set("category", category);
        data.set("alt", description);
        data.set("file", ready.file);
        const response = await fetch("/api/admin/upload", { method: "POST", body: data });
        const body = (await response.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
        if (!response.ok || !body?.ok) {
          problem = body?.message ?? "The photograph could not be uploaded.";
          signedOut = response.status === 401;
        }
      } catch (error) {
        problem =
          error instanceof TypeError || !(error instanceof Error)
            ? "The connection dropped before the photograph arrived. Check the internet and try again."
            : error.message;
      }

      if (problem) {
        failed += 1;
        firstProblem ??= problem;
        setQueue((current) => current.map((item) => (item.key === entry.key ? { ...item, status: "failed", message: problem } : item)));
      } else {
        added += 1;
        remove(entry);
      }
      setProgress({ done: index + 1, total: batch.length });

      // Nothing after this one can succeed either; leave the rest in the tray.
      if (signedOut) {
        setQueue((current) => current.map((item) => (item.status === "uploading" ? { ...item, status: "ready" } : item)));
        break;
      }
    }

    setProgress(null);
    if (added > 0) {
      // Fetch the wall again so the new pictures appear in it.
      startTransition(() => router.refresh());
      if (failed === 0) setAlt("");
    }

    setNotice(
      failed === 0
        ? { status: "saved", message: `${added} ${added === 1 ? "photograph" : "photographs"} added to the website.` }
        : {
            status: "error",
            message: added > 0 ? `${added} added, ${failed} not uploaded: ${firstProblem}` : (firstProblem ?? "Nothing was uploaded."),
          },
    );
  };

  const ready = queue.length > 0 && alt.trim().length >= 3 && !uploading;

  return (
    <Panel
      title="Add photographs"
      hint={`JPEG, PNG or WebP, up to ${MAX_MB}MB each; large photographs are resized automatically. They appear on the website as soon as they finish uploading.`}
    >
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <SelectField
            label="Part of the gallery"
            value={category}
            onChange={setCategory}
            options={categories.map((entry) => ({ value: String(entry.value), label: entry.label }))}
          />
          <TextField
            label="Describe the photograph"
            value={alt}
            maxLength={240}
            onChange={setAlt}
            placeholder="e.g. Chole bhatura on a brass thali"
            hint="Read aloud by screen readers. Each picture's own description can be changed afterwards with Edit."
          />
        </div>

        <label
          onDragEnter={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "copy";
          }}
          onDragLeave={(event) => {
            // Leaving for one of the zone's own children is not leaving the zone.
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
          }}
          onDrop={onDrop}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-frame border border-dashed px-6 py-10 text-center transition-all duration-300 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-gold",
            dragging
              ? "scale-[1.01] border-gold bg-gold/[0.1] shadow-glow"
              : queue.length > 0
                ? "border-gold/50 bg-gold/[0.06]"
                : "border-fg/15 hover:border-gold/40 hover:bg-fg/[0.03]",
            uploading && "pointer-events-none opacity-60",
          )}
        >
          <input
            ref={input}
            type="file"
            accept={UPLOAD_TYPES.join(",")}
            multiple
            disabled={uploading}
            className="sr-only"
            onChange={(event) => {
              add(Array.from(event.target.files ?? []));
              // Cleared so choosing the same file again still fires a change.
              event.target.value = "";
            }}
          />
          <span className="grid size-11 place-items-center rounded-full border border-gold/25 bg-gold/10">
            <ImagePlus aria-hidden className="size-5 text-gold" strokeWidth={1.5} />
          </span>
          <span className="text-[0.88rem] text-fg/75">
            {dragging ? "Drop them here" : "Choose photographs, or drag them here"}
          </span>
          <span className="text-[0.72rem] text-fg/40">
            Up to {MAX_FILES_PER_BATCH} at a time, {MAX_MB}MB each
          </span>
        </label>

        {queue.length > 0 && (
          <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-6">
            {queue.map((entry) => (
              <li key={entry.key} className="relative overflow-hidden rounded-xl border border-fg/12 bg-fg/[0.03]">
                <span className="relative block aspect-square">
                  <Image src={entry.preview} alt="" fill unoptimized sizes="160px" className="object-cover" />
                  {entry.status === "uploading" && (
                    <span className="absolute inset-0 grid place-items-center bg-charcoal/60">
                      <LoaderCircle aria-hidden className="size-5 animate-spin text-gold-light" strokeWidth={2} />
                    </span>
                  )}
                  {entry.status === "failed" && (
                    <span className="absolute inset-0 grid place-items-center bg-[#3a1512]/70">
                      <CircleAlert aria-hidden className="size-5 text-[#e59a93]" strokeWidth={1.8} />
                    </span>
                  )}
                  {entry.status !== "uploading" && (
                    <button
                      type="button"
                      onClick={() => remove(entry)}
                      aria-label={`Remove ${entry.file.name}`}
                      className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-charcoal/80 text-fg/70 backdrop-blur transition-colors duration-200 hover:text-[#e59a93]"
                    >
                      <X aria-hidden className="size-3.5" strokeWidth={2.2} />
                    </button>
                  )}
                </span>
                <span className="block truncate px-2 pt-1.5 text-[0.65rem] text-fg/55" title={entry.file.name}>
                  {entry.file.name}
                </span>
                <span className={cn("block truncate px-2 pb-1.5 text-[0.6rem] tnum", entry.message ? "text-[#e59a93]" : "text-fg/35")} title={entry.message}>
                  {entry.message ?? `${(entry.file.size / 1024 / 1024).toFixed(1)}MB`}
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <button
            type="button"
            onClick={upload}
            disabled={!ready}
            className="btn-primary inline-flex items-center gap-2 rounded-pill px-6 py-3 font-sans text-[0.68rem] font-semibold uppercase tracking-[0.18em] disabled:pointer-events-none disabled:opacity-40"
          >
            {uploading ? (
              <LoaderCircle aria-hidden className="size-3.5 animate-spin" strokeWidth={2} />
            ) : (
              <Upload aria-hidden className="size-3.5" strokeWidth={1.8} />
            )}
            {uploading
              ? `Uploading ${Math.min(progress.done + 1, progress.total)} of ${progress.total}`
              : queue.length > 1
                ? `Upload ${queue.length} photographs`
                : "Upload"}
          </button>

          {/* A refusal or a result outranks the reminder: a file turned away
              while others wait must still say why. */}
          {notice.message ? (
            <Status state={notice} pending={false} pendingLabel="" />
          ) : (
            !uploading &&
            queue.length > 0 &&
            alt.trim().length < 3 && (
              <p className="text-[0.78rem] text-gold-light/80">Describe the photograph above to upload.</p>
            )
          )}
        </div>
      </div>
    </Panel>
  );
}

/* -------------------------------------------------------------------------- */

/** The one place in the gallery that is a form: a picture's own words. */
function ItemDialog({
  item,
  categories,
  onClose,
  action,
  saving,
  error,
  onDelete,
  deleting,
}: {
  item: AdminGalleryItem;
  categories: Category[];
  onClose: () => void;
  action: (payload: FormData) => void;
  saving: boolean;
  error?: string;
  onDelete?: () => void;
  deleting: boolean;
}) {
  const [caption, setCaption] = useState(item.caption ?? "");
  const [alt, setAlt] = useState(item.image.alt);
  const [category, setCategory] = useState<string>(item.category);
  const [featured, setFeatured] = useState(Boolean(item.featured));
  const [span, setSpan] = useState<string>(item.span ?? "square");
  const panel = useRef<HTMLDivElement>(null);

  const payload = JSON.stringify({ caption, alt, category, featured, span });

  // The parent hands over a fresh `onClose` on every render; the effect below
  // must run once per opening, not once per render, or focus would be yanked
  // back to the dialog each time the page behind it refreshes.
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });

  // A modal behaves like one: Escape closes it, the page behind does not
  // scroll, focus moves into it, and goes back to where it was on close.
  useEffect(() => {
    const returnTo = document.activeElement as HTMLElement | null;
    panel.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close.current();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
      returnTo?.focus?.();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-4">
      <button type="button" aria-label="Close" tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-charcoal/85 backdrop-blur-sm" />

      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Edit photograph"
        className="glass-strong border-gradient relative z-10 max-h-[90dvh] w-full max-w-3xl overflow-y-auto rounded-frame outline-none"
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
              hint="Featured pictures lead the photo strip on the home page."
              checked={featured}
              onChange={setFeatured}
            />

            {error && (
              <p role="alert" className="flex items-start gap-2 text-[0.78rem] text-[#e59a93]">
                <CircleAlert aria-hidden className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.8} />
                {error}
              </p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary inline-flex items-center gap-2 rounded-pill px-6 py-2.5 font-sans text-[0.68rem] font-semibold uppercase tracking-[0.18em] disabled:pointer-events-none disabled:opacity-40"
              >
                {saving ? <LoaderCircle aria-hidden className="size-3.5 animate-spin" strokeWidth={2} /> : null}
                {saving ? "Saving" : "Save"}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="rounded-pill px-4 py-2.5 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-fg/50 transition-colors duration-300 hover:text-fg"
              >
                Cancel
              </button>

              {onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  disabled={deleting}
                  className="ml-auto inline-flex items-center gap-2 rounded-pill border border-[#e59a93]/30 px-4 py-2.5 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[#e59a93] transition-colors duration-300 hover:border-[#e59a93]/60 hover:bg-[#e59a93]/10 disabled:pointer-events-none disabled:opacity-40"
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
