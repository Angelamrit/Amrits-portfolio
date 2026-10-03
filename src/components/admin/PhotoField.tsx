"use client";

import Image from "next/image";
import { useRef, useState, type DragEvent } from "react";
import { CircleAlert, Images, LoaderCircle, Upload } from "lucide-react";
import { cn } from "@/lib/cn";
import { MAX_ORIGINAL_BYTES, UPLOAD_TYPES } from "@/lib/content/upload-limits";
import { readyForUpload } from "@/lib/content/prepare-upload";
import { ImagePicker, type ImageChoice } from "./ImagePicker";
import { Panel } from "./Panel";

const MAX_MB = MAX_ORIGINAL_BYTES / 1024 / 1024;

/**
 * A photograph on something the chef edits — a dish, a menu's cover — and
 * the two ways to change it.
 *
 * "Upload a new photo" sends the file at once and puts it on the form; it is
 * not on the website until the form is saved, and it goes into the dashboard's
 * photo library rather than onto the public gallery wall. "Choose from your
 * photos" opens the pictures already on the site. The picture itself is also
 * a drop zone.
 */
export function PhotoField({
  title = "Photograph",
  hint,
  photo,
  altText,
  choices,
  value,
  onChange,
  onUploaded,
}: {
  title?: string;
  hint: string;
  photo: ImageChoice | undefined;
  /** Stored as the upload's description for screen readers — usually the dish or menu name. */
  altText: string;
  choices: ImageChoice[];
  value: string;
  onChange: (key: string) => void;
  onUploaded: (choice: ImageChoice) => void;
}) {
  const [picking, setPicking] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const upload = async (file: File | undefined) => {
    if (!file || uploading) return;
    setError(null);
    if (!(UPLOAD_TYPES as readonly string[]).includes(file.type)) return setError("That is not a JPEG, PNG or WebP photograph.");
    if (file.size > MAX_ORIGINAL_BYTES) return setError(`That photograph is larger than ${MAX_MB}MB.`);

    const description = altText.trim().length >= 3 ? altText.trim() : "Photograph";
    setUploading(true);
    const data = new FormData();
    data.set("place", "dish");
    data.set("alt", description.length >= 3 ? description : "Photograph of the restaurant");
    try {
      // Shrunk in the browser first: the live site refuses uploads over 4.5MB.
      const ready = await readyForUpload(file);
      if (!ready.ok) return setError(ready.reason);
      data.set("file", ready.file);
      const response = await fetch("/api/admin/upload", { method: "POST", body: data });
      const body = (await response.json().catch(() => null)) as { ok?: boolean; id?: string; src?: string; message?: string } | null;
      if (!response.ok || !body?.ok || !body.id || !body.src) {
        setError(body?.message ?? "The photograph could not be uploaded.");
      } else {
        onUploaded({ key: body.id, src: body.src, alt: description, label: `Yours · ${altText.trim() || "new photo"}` });
        setPicking(false);
      }
    } catch {
      setError("The connection dropped before the photograph arrived. Try again.");
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    void upload(event.dataTransfer.files[0]);
  };

  return (
    <Panel title={title} hint={hint}>
      <div className="grid gap-5 sm:grid-cols-[minmax(0,17rem)_1fr] sm:items-center">
        <div
          onDragEnter={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
          }}
          onDrop={onDrop}
          className={cn(
            "relative aspect-[4/3] overflow-hidden rounded-frame border bg-sand transition-all duration-300",
            dragging ? "border-gold shadow-glow" : "border-fg/12",
          )}
        >
          {photo ? (
            <Image src={photo.src} alt={photo.alt} fill sizes="(min-width: 640px) 17rem, 90vw" className="object-cover" />
          ) : (
            <span className="absolute inset-0 grid place-items-center px-6 text-center text-[0.8rem] text-fg/45">
              No photograph yet — upload one, or drag it here
            </span>
          )}
          {(uploading || dragging) && (
            <span className="absolute inset-0 grid place-items-center bg-charcoal/65 text-[0.8rem] text-fg">
              {uploading ? (
                <span className="flex items-center gap-2">
                  <LoaderCircle aria-hidden className="size-4 animate-spin" strokeWidth={2} />
                  Uploading
                </span>
              ) : (
                "Drop the photograph here"
              )}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <input
            ref={input}
            type="file"
            accept={UPLOAD_TYPES.join(",")}
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(event) => {
              void upload(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={uploading}
            className="btn-primary inline-flex items-center justify-center gap-2 rounded-pill px-6 py-3 font-sans text-[0.68rem] font-semibold uppercase tracking-[0.16em] disabled:pointer-events-none disabled:opacity-50 sm:self-start"
          >
            <Upload aria-hidden className="size-3.5" strokeWidth={1.8} />
            Upload a new photo
          </button>
          <button
            type="button"
            onClick={() => setPicking((open) => !open)}
            aria-expanded={picking}
            className="glass inline-flex items-center justify-center gap-2 rounded-pill px-6 py-3 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-fg/80 transition-colors duration-300 hover:text-gold-light sm:self-start"
          >
            <Images aria-hidden className="size-3.5" strokeWidth={1.8} />
            {picking ? "Close the photos" : "Choose from your photos"}
          </button>
          <p className="text-[0.72rem] leading-relaxed text-fg/40">JPEG, PNG or WebP, up to {MAX_MB}MB; large photos are resized automatically. A landscape photo looks best.</p>
          {error && (
            <p role="alert" className="flex items-start gap-2 text-[0.78rem] text-[#e59a93]">
              <CircleAlert aria-hidden className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.8} />
              {error}
            </p>
          )}
        </div>
      </div>

      {/* Opened on request: a grid of fifty photographs is heavy to load and
          most visits to a screen are about the words, not the picture. */}
      {picking && (
        <div className="mt-5 border-t border-fg/8 pt-5">
          <ImagePicker label="Your photos" hint="Tap a photo to use it." choices={choices} value={value} onChange={onChange} />
        </div>
      )}
    </Panel>
  );
}
