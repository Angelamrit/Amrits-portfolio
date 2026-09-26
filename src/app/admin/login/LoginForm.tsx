"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Eye, EyeOff, LoaderCircle, LockKeyhole } from "lucide-react";
import { signIn, type LoginState } from "../actions";
import { Button } from "@/components/ui/Button";

const initial: LoginState = {};

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(signIn, initial);
  const [revealed, setRevealed] = useState(false);
  const field = useRef<HTMLInputElement>(null);

  // A refused attempt should leave the cursor where the next one is typed,
  // with the wrong password selected so it is replaced rather than edited.
  useEffect(() => {
    if (state.error) field.current?.select();
  }, [state.error]);

  return (
    <form action={formAction} className="mt-10 flex flex-col gap-5">
      <input type="hidden" name="next" value={next} />

      <div className="flex flex-col gap-2.5">
        <label htmlFor="password" className="eyebrow text-fg/70">
          Password
        </label>
        <div className="relative">
          <LockKeyhole
            aria-hidden
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-gold/60"
            strokeWidth={1.5}
          />
          <input
            ref={field}
            id="password"
            name="password"
            type={revealed ? "text" : "password"}
            autoComplete="current-password"
            autoFocus
            required
            maxLength={256}
            aria-invalid={state.error ? true : undefined}
            aria-describedby={state.error ? "password-error" : undefined}
            className="w-full rounded-xl border border-fg/10 bg-fg/[0.04] py-4 pl-11 pr-12 font-sans text-[1rem] tracking-[0.18em] text-fg transition-all duration-300 hover:border-fg/20 focus:border-gold focus:bg-fg/[0.07] focus:shadow-[0_0_0_4px_rgba(226,189,108,0.14)] focus:outline-none aria-[invalid=true]:border-red-400/70 [color-scheme:dark]"
          />
          <button
            type="button"
            onClick={() => setRevealed((shown) => !shown)}
            aria-label={revealed ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-fg/45 transition-colors duration-300 hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            {revealed ? <EyeOff className="size-4" strokeWidth={1.6} /> : <Eye className="size-4" strokeWidth={1.6} />}
          </button>
        </div>
      </div>

      {/* `role="alert"` so the refusal is announced, not only shown. */}
      <p
        id="password-error"
        role="alert"
        className={`min-h-5 text-sm text-red-300 transition-opacity duration-300 ${state.error ? "opacity-100" : "opacity-0"}`}
      >
        {state.error ?? ""}
      </p>

      <Button type="submit" disabled={pending} icon={false} className="w-full">
        {pending ? (
          <span className="inline-flex items-center gap-2.5">
            <LoaderCircle aria-hidden className="size-4 animate-spin" strokeWidth={2} />
            Checking
          </span>
        ) : (
          "Enter the dashboard"
        )}
      </Button>
    </form>
  );
}
