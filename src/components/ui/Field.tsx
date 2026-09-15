import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/cn";

const control =
  "w-full rounded-xl border border-fg/10 bg-fg/[0.04] px-4 py-3.5 font-sans text-[1rem] text-fg placeholder:text-muted/60 transition-all duration-300 hover:border-fg/20 focus:border-gold focus:bg-fg/[0.06] focus:shadow-[0_0_0_4px_rgba(201,169,98,0.12)] focus:outline-none aria-[invalid=true]:border-red-400/70 [color-scheme:dark]";

type Base = {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  className?: string;
};

export function FieldWrap({ label, name, error, hint, optional, className, children }: Base & { children: ReactNode }) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={name} className="eyebrow flex items-baseline gap-2 text-fg/70">
        {label}
        {optional && <span className="normal-case tracking-normal text-muted/70">(optional)</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={`${name}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${name}-error`} className="text-xs text-red-300" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function Input({ label, name, error, hint, optional, className, ...rest }: Base & ComponentPropsWithoutRef<"input">) {
  return (
    <FieldWrap label={label} name={name} error={error} hint={hint} optional={optional} className={className}>
      <input
        id={name}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : hint ? `${name}-hint` : undefined}
        className={control}
        {...rest}
      />
    </FieldWrap>
  );
}

export function Textarea({ label, name, error, hint, optional, className, ...rest }: Base & ComponentPropsWithoutRef<"textarea">) {
  return (
    <FieldWrap label={label} name={name} error={error} hint={hint} optional={optional} className={className}>
      <textarea
        id={name}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : hint ? `${name}-hint` : undefined}
        className={cn(control, "min-h-32 resize-y")}
        {...rest}
      />
    </FieldWrap>
  );
}

export function Select({
  label,
  name,
  error,
  hint,
  optional,
  className,
  options,
  ...rest
}: Base & ComponentPropsWithoutRef<"select"> & { options: { value: string; label: string }[] }) {
  return (
    <FieldWrap label={label} name={name} error={error} hint={hint} optional={optional} className={className}>
      <select
        id={name}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : hint ? `${name}-hint` : undefined}
        className={cn(
          control,
          "cursor-pointer appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23c9a962%22 stroke-width=%221.5%22><path d=%22M6 9l6 6 6-6%22/></svg>')] bg-[length:12px] bg-[right_1rem_center] bg-no-repeat pr-10 [&>option]:bg-surface-2",
        )}
        {...rest}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldWrap>
  );
}
