"use client";

import { useActionState, useMemo, useState } from "react";
import {
  changePassword,
  type PasswordField as FieldName,
  type PasswordState,
} from "@/app/admin/(dashboard)/password/actions";
import { MIN_PASSWORD_LENGTH } from "@/lib/admin/password-rules";
import { cn } from "@/lib/cn";
import { idleState } from "@/lib/content/state";
import { PasswordField, useFieldSetters } from "./FormControls";
import { Panel } from "./Panel";
import { SaveBar, useUnsavedChangesWarning } from "./SaveBar";

/**
 * The change-password form.
 *
 * Three boxes and no draft to restore: unlike the other editors, what is typed
 * here is cleared the moment it is saved, because a password is not something
 * to leave on a screen. The rules are checked as the chef types — the length,
 * the two copies agreeing, the new one differing from the old — but a box is
 * only marked once he has left it, so the form does not shout about a
 * password he is still in the middle of typing. The server checks everything
 * again, and its answer is pinned to the box it was about.
 */

type Draft = Record<FieldName, string>;
const empty: Draft = { current: "", next: "", confirm: "" };

/**
 * A rough read of how hard a password would be to guess, for the meter under
 * the new-password box. Length counts for most, because length is what
 * actually defeats guessing; variety earns the rest. Shown as four steps and
 * a word, never a number, since a precise score would be a precise lie.
 */
export function passwordStrength(password: string): { score: 0 | 1 | 2 | 3 | 4; label: string } {
  if (!password) return { score: 0, label: "" };
  if (password.length < MIN_PASSWORD_LENGTH) return { score: 1, label: "Too short" };
  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((kind) => kind.test(password)).length;
  if ((password.length >= 14 && kinds >= 3) || password.length >= 20) return { score: 4, label: "Strong" };
  if (password.length >= 14 || kinds >= 3) return { score: 3, label: "Good" };
  return { score: 2, label: "Fair" };
}

export function PasswordEditor({ canSave }: { canSave: boolean }) {
  const [state, formAction, pending] = useActionState<PasswordState, FormData>(changePassword, idleState);
  const [draft, setDraft] = useState<Draft>(empty);
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  // The server's answer, kept on the box it was about until that box is edited.
  const [serverError, setServerError] = useState<{ field: FieldName; message: string } | null>(null);
  const [seen, setSeen] = useState(0);

  if (state.at && state.at !== seen) {
    setSeen(state.at);
    if (state.status === "saved") {
      setDraft(empty);
      setTouched({});
      setServerError(null);
    } else if (state.status === "error" && state.field && state.message) {
      setServerError({ field: state.field, message: state.message });
    }
  }

  const dirty = draft.current !== "" || draft.next !== "" || draft.confirm !== "";
  useUnsavedChangesWarning(dirty);

  const setters = useFieldSetters(empty, setDraft);
  const edit = (field: FieldName) => (value: string) => {
    setters[field](value);
    if (serverError?.field === field) setServerError(null);
  };
  const leave = (field: FieldName) => () => setTouched((seenSoFar) => (seenSoFar[field] ? seenSoFar : { ...seenSoFar, [field]: true }));

  const strength = useMemo(() => passwordStrength(draft.next), [draft.next]);

  const rules: Record<FieldName, string | undefined> = {
    current: draft.current ? undefined : "Enter your current password.",
    next:
      draft.next.length < MIN_PASSWORD_LENGTH
        ? `At least ${MIN_PASSWORD_LENGTH} characters.`
        : draft.next === draft.current
          ? "Choose a password different from the current one."
          : undefined,
    confirm: draft.confirm !== draft.next ? "This does not match the new password." : undefined,
  };
  const shown = (field: FieldName) =>
    serverError?.field === field ? serverError.message : touched[field] ? rules[field] : undefined;
  const errors: Record<FieldName, string | undefined> = {
    current: shown("current"),
    next: shown("next"),
    confirm: shown("confirm"),
  };
  const incomplete = Boolean(rules.current || rules.next || rules.confirm);
  const problem = !canSave
    ? "Saving is switched off on this server, so the password cannot be changed here."
    : Object.values(errors).some(Boolean)
      ? "Fix the field marked in red first."
      : undefined;

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        // Submitting marks every box, so the one that is wrong is pointed out
        // on screen rather than by a round trip to the server.
        if (incomplete) {
          event.preventDefault();
          setTouched({ current: true, next: true, confirm: true });
        }
      }}
      className="flex flex-col gap-4"
    >
      <Panel title="Change your password" hint="Type the current one first, then the new one twice.">
        <div className="flex flex-col gap-5">
          <PasswordField
            name="current"
            label="Current password"
            autoComplete="current-password"
            value={draft.current}
            error={errors.current}
            onChange={edit("current")}
            onBlur={leave("current")}
          />

          <span aria-hidden className="hairline-full" />

          <div className="flex flex-col gap-2.5">
            <PasswordField
              name="next"
              label="New password"
              autoComplete="new-password"
              value={draft.next}
              error={errors.next}
              hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
              onChange={edit("next")}
              onBlur={leave("next")}
            />
            <StrengthMeter score={strength.score} label={strength.label} />
          </div>

          <PasswordField
            name="confirm"
            label="New password again"
            autoComplete="new-password"
            value={draft.confirm}
            error={errors.confirm}
            onChange={edit("confirm")}
            onBlur={leave("confirm")}
          />
        </div>
      </Panel>

      <SaveBar
        state={state}
        pending={pending}
        dirty={dirty}
        problem={problem}
        submitLabel="Change password"
        pendingLabel="Changing"
        idleMessage="Nothing typed yet"
      />
    </form>
  );
}

function StrengthMeter({ score, label }: { score: number; label: string }) {
  const tone = score <= 1 ? "bg-[#e59a93]" : score === 2 ? "bg-gold/60" : score === 3 ? "bg-gold" : "bg-[#7fc39b]";
  const text = score <= 1 ? "text-[#e59a93]" : score === 4 ? "text-[#7fc39b]" : "text-gold-light";
  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-1 gap-1" aria-hidden>
        {[1, 2, 3, 4].map((step) => (
          <span
            key={step}
            className={cn("h-1 flex-1 rounded-pill transition-colors duration-500", step <= score ? tone : "bg-fg/10")}
          />
        ))}
      </div>
      <span
        aria-live="polite"
        className={cn(
          "min-w-16 text-right text-[0.62rem] uppercase tracking-[0.16em] transition-opacity duration-300",
          label ? "opacity-100" : "opacity-0",
          text,
        )}
      >
        {label || " "}
      </span>
    </div>
  );
}
