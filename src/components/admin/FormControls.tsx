"use client";

import { useId, type ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * The form controls the dashboard is built from.
 *
 * Separate from the public site's `Field` components rather than shared with
 * them. The public forms are a guest's one-off enquiry — generous padding,
 * large type, styled to sit inside the page's writing. These are worked in for
 * an hour at a time: denser, quieter, and every one of them says what it is
 * for underneath, because the person using them is a chef rather than the
 * developer who named the fields.
 */

const control =
  "w-full rounded-xl border border-fg/12 bg-fg/[0.04] px-3.5 py-2.5 font-sans text-[0.9rem] text-fg placeholder:text-fg/25 transition-all duration-300 hover:border-fg/20 focus:border-gold/70 focus:bg-fg/[0.07] focus:shadow-[0_0_0_3px_rgba(226,189,108,0.14)] focus:outline-none [color-scheme:dark]";

function Shell({
  label,
  hint,
  error,
  htmlFor,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  htmlFor: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="eyebrow text-[0.6rem] text-fg/55">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-[0.72rem] text-[#e59a93]" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="text-[0.72rem] leading-relaxed text-fg/35">{hint}</p>
      )}
    </div>
  );
}

export function TextField({
  label,
  hint,
  error,
  value,
  onChange,
  placeholder,
  maxLength,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}) {
  const id = useId();
  return (
    <Shell label={label} hint={hint} error={error} htmlFor={id} className={className}>
      <input
        id={id}
        type="text"
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        className={control}
      />
    </Shell>
  );
}

export function TextArea({
  label,
  hint,
  error,
  value,
  onChange,
  rows = 4,
  maxLength,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  maxLength?: number;
  className?: string;
}) {
  const id = useId();
  return (
    <Shell label={label} hint={hint} error={error} htmlFor={id} className={className}>
      <textarea
        id={id}
        rows={rows}
        value={value}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        className={cn(control, "resize-y leading-relaxed")}
      />
      {maxLength && (
        <p className="text-right text-[0.68rem] tnum text-fg/25">
          {value.length} / {maxLength}
        </p>
      )}
    </Shell>
  );
}

export function SelectField({
  label,
  hint,
  value,
  onChange,
  options,
  className,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  const id = useId();
  return (
    <Shell label={label} hint={hint} htmlFor={id} className={className}>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          control,
          "cursor-pointer appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23e2bd6c%22 stroke-width=%221.5%22><path d=%22M6 9l6 6 6-6%22/></svg>')] bg-[length:12px] bg-[right_0.9rem_center] bg-no-repeat pr-9 [&>option]:bg-surface-2",
        )}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Shell>
  );
}

/** A switch, because "featured" and "confirmed" read better as on/off than as a checkbox in a list. */
export function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="group flex items-start gap-3 rounded-xl border border-fg/12 bg-fg/[0.03] px-3.5 py-3 text-left transition-colors duration-300 hover:border-fg/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
    >
      <span
        aria-hidden
        className={cn(
          "mt-0.5 flex h-[18px] w-8 shrink-0 items-center rounded-pill p-0.5 transition-colors duration-300",
          checked ? "bg-gold/80" : "bg-fg/15",
        )}
      >
        <span
          className={cn(
            "size-3.5 rounded-pill bg-ivory shadow-sm transition-transform duration-300 ease-luxe",
            checked ? "translate-x-3.5" : "translate-x-0",
          )}
        />
      </span>
      <span className="min-w-0">
        <span className="block text-[0.85rem] text-fg/90">{label}</span>
        {hint && <span className="mt-0.5 block text-[0.72rem] leading-relaxed text-fg/35">{hint}</span>}
      </span>
    </button>
  );
}

export const DIETARY_TAGS = [
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "gluten-free", label: "Gluten free" },
  { value: "contains-nuts", label: "Contains nuts" },
  { value: "halal", label: "Halal" },
  { value: "dairy", label: "Dairy" },
] as const;

export type DietaryValue = (typeof DIETARY_TAGS)[number]["value"];

/** Dietary tags as toggleable pills — the whole set is visible, so nothing has to be remembered. */
export function TagPicker({
  label,
  hint,
  selected,
  onChange,
}: {
  label: string;
  hint?: string;
  selected: string[];
  onChange: (tags: DietaryValue[]) => void;
}) {
  const toggle = (value: DietaryValue) =>
    onChange(
      selected.includes(value)
        ? (selected.filter((tag) => tag !== value) as DietaryValue[])
        : ([...selected, value] as DietaryValue[]),
    );

  return (
    <div className="flex flex-col gap-2">
      <p className="eyebrow text-[0.6rem] text-fg/55">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {DIETARY_TAGS.map((tag) => {
          const on = selected.includes(tag.value);
          return (
            <button
              key={tag.value}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(tag.value)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-[0.72rem] transition-all duration-300",
                on
                  ? "border-gold/50 bg-gold/15 text-gold-light"
                  : "border-fg/12 text-fg/45 hover:border-fg/25 hover:text-fg/70",
              )}
            >
              {on && <Check aria-hidden className="size-3" strokeWidth={2.5} />}
              {tag.label}
            </button>
          );
        })}
      </div>
      {hint && <p className="text-[0.72rem] text-fg/35">{hint}</p>}
    </div>
  );
}
