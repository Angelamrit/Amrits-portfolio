/**
 * What an editor screen gets back after a save.
 *
 * Shared by the server actions and the forms that call them, and deliberately
 * plain data: it crosses the server/client boundary on every submit, so it
 * holds a status, a sentence to show, and the moment it happened — never an
 * error object, which would carry a stack trace into the browser.
 */
export type EditorState = {
  status: "idle" | "saved" | "reset" | "error";
  /** Shown to the person editing. Always a sentence they can act on. */
  message?: string;
  /** Epoch milliseconds, for "saved a moment ago". */
  at?: number;
};

export const idleState: EditorState = { status: "idle" };
