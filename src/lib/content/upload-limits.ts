/**
 * The limits on a photograph uploaded through the dashboard.
 *
 * Shared by the browser and the server, which is why it lives outside the
 * server-only gallery module: the uploader checks a file against these before
 * sending it, so a 30MB picture is turned away in the chef's hand with a
 * reason rather than after a long upload. The server applies the same numbers
 * again, because the browser's check is a courtesy and not a boundary.
 */

/** Photographs are big and the store is the server's own disk; this keeps one upload from filling it. */
export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;

/** How many files one batch can hold. They are still sent one at a time. */
export const MAX_FILES_PER_BATCH = 12;

export const UPLOAD_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
