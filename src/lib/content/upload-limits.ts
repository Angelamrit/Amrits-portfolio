/**
 * The limits on a photograph uploaded through the dashboard.
 *
 * Shared by the browser and the server, which is why it lives outside the
 * server-only gallery module: the uploader checks a file against these before
 * sending it, so a 30MB picture is turned away in the chef's hand with a
 * reason rather than after a long upload. The server applies the same numbers
 * again, because the browser's check is a courtesy and not a boundary.
 */

/** The most the server accepts in one upload, whatever the host. */
export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;

/**
 * The largest photograph the chef can choose. Bigger than what is sent, because
 * the browser shrinks a photograph before uploading it (prepare-upload.ts): a
 * 15MB photo from a phone arrives as well under 1MB.
 */
export const MAX_ORIGINAL_BYTES = 40 * 1024 * 1024;

/**
 * The most the browser will send after shrinking. Vercel refuses any request
 * over 4.5MB before the site even sees it, and the form around the photograph
 * takes a little of that.
 */
export const MAX_SEND_BYTES = 4.3 * 1024 * 1024;

/** How many files one batch can hold. They are still sent one at a time. */
export const MAX_FILES_PER_BATCH = 12;

export const UPLOAD_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
