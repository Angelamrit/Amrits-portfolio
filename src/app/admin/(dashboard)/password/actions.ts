"use server";

import { headers } from "next/headers";
import { startSession } from "@/lib/admin/auth";
import { credentials } from "@/lib/admin/credential";
import { refuseIfSignedOut } from "@/lib/admin/guard";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "@/lib/admin/password-rules";
import type { EditorState } from "@/lib/content/state";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { store } from "@/lib/store";

/**
 * Changing the dashboard password.
 *
 * Same contract as the other editors — a sentence back, never a thrown error
 * — with one addition: `field` names the box the sentence is about, so the
 * form can mark it rather than make the chef guess which of three it meant.
 *
 * The current password is asked for even though the caller is already signed
 * in. A session cookie can be stolen from an unlocked laptop; the password
 * cannot, and without this check whoever held the cookie could lock the chef
 * out of his own dashboard.
 */

export type PasswordField = "current" | "next" | "confirm";
export type PasswordState = EditorState & { field?: PasswordField };

/**
 * This screen checks a password, so it is a place to guess one from behind a
 * stolen cookie. Six tries in a quarter of an hour is more than a person who
 * knows the password needs, and far too few for a guess.
 */
const PER_IP = { limit: 6, windowMs: 15 * 60_000 };

function failure(message: string, field?: PasswordField): PasswordState {
  return { status: "error", message, at: Date.now(), ...(field ? { field } : {}) };
}

export async function changePassword(_previous: PasswordState, formData: FormData): Promise<PasswordState> {
  const refused = await refuseIfSignedOut();
  if (refused) return refused;

  const ip = clientIp(await headers());
  const verdict = rateLimit([{ key: `admin-password:${ip}`, rule: PER_IP }]);
  if (!verdict.allowed) {
    console.warn(`[admin] password change rate-limited for ${ip}`);
    return failure(`Too many attempts. Try again in ${Math.ceil(verdict.retryAfterSeconds / 60)} minutes.`);
  }

  const current = formData.get("current");
  const next = formData.get("next");
  const confirm = formData.get("confirm");
  if (typeof current !== "string" || typeof next !== "string" || typeof confirm !== "string") {
    return failure("The form did not send all three passwords.");
  }
  if (!current) return failure("Enter your current password.", "current");
  if (next.length < MIN_PASSWORD_LENGTH) {
    return failure(`The new password must be at least ${MIN_PASSWORD_LENGTH} characters.`, "next");
  }
  if (next.length > MAX_PASSWORD_LENGTH) {
    return failure(`The new password must be at most ${MAX_PASSWORD_LENGTH} characters.`, "next");
  }
  if (next !== confirm) return failure("The two copies of the new password do not match.", "confirm");

  // On Vercel without its storage the write would fail anyway; this says why,
  // in the words the banner at the top of the screen already uses.
  if (store.warning) return failure(store.warning);

  let outcome;
  try {
    outcome = await credentials.change({ current, next });
  } catch (error) {
    console.error("[admin] could not write the new password:", error);
    return failure("The new password could not be written to storage. Your password has not changed.");
  }

  if (!outcome.ok) {
    switch (outcome.reason) {
      case "wrong-current":
        console.warn(`[admin] password change refused for ${ip}: wrong current password`);
        return failure("That is not the current password.", "current");
      case "unchanged":
        return failure("The new password is the same as the current one.", "next");
      case "too-short":
        return failure(`The new password must be at least ${MIN_PASSWORD_LENGTH} characters.`, "next");
      case "too-long":
        return failure(`The new password must be at most ${MAX_PASSWORD_LENGTH} characters.`, "next");
      case "not-configured":
        return failure("No password is configured on the server, so there is nothing to change.");
    }
  }

  // Every other device's cookie now names a credential that is no longer in
  // force. This one is replaced on the way out, so the chef is not signed out
  // of the very screen that confirms the change.
  if (!(await startSession(outcome.id))) {
    return failure("The password was changed, but this device could not be kept signed in. Sign in again with the new password.");
  }

  console.info(`[admin] password changed from ${ip}`);
  return { status: "saved", at: Date.now() };
}
