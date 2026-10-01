import "server-only";
import type { EditorState } from "@/lib/content/state";
import { isSignedIn } from "./auth";

/**
 * The first line of every dashboard Server Action.
 *
 * `requireAdmin` redirects, which is right for a page and wrong for a save. A
 * session runs out after twelve idle hours, and a chef who spent twenty
 * minutes on a menu and pressed Save the next morning was bounced to the
 * login screen with every change thrown away. This answers with a sentence
 * instead: the form keeps what was typed, he signs in again in another tab,
 * and presses Save once more.
 *
 * It is the same check, just a different way of saying no — nothing is
 * written unless the session is valid.
 */
export async function refuseIfSignedOut(): Promise<EditorState | null> {
  if (await isSignedIn()) return null;
  return {
    status: "error",
    message: "You have been signed out. Sign in again in a new tab, then press save here — your changes are still on this page.",
    at: Date.now(),
  };
}
