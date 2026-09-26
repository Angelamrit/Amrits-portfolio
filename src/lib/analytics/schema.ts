import { z } from "zod";

/**
 * What a visit looks like, both on the wire and on disk.
 *
 * The guiding constraint is that nothing stored here identifies a person. No
 * cookie is set, no IP address is written down, and the visitor field is a
 * hash that is re-salted every day, so the same person on Monday and Tuesday
 * is two unrelated values and the log cannot be walked backwards into a
 * browsing history. What survives is exactly what the chef asked for: how many
 * people came, what they looked at, and where they came from.
 *
 * Keys are one or two characters because this is an append-only log with one
 * line per visit, and the key names would otherwise be most of the file.
 */

/** Sent by the browser. Everything else on a stored event is derived server-side and cannot be forged. */
export const beaconSchema = z.object({
  /** Pathname only — the client strips the query string before sending. */
  path: z
    .string()
    .min(1)
    .max(256)
    .refine((value) => value.startsWith("/"), "must be a path"),
  /** `document.referrer`, or "" when there is none. Only its host is kept. */
  referrer: z.string().max(512).optional().default(""),
  /** Viewport width, used only to bucket into phone / tablet / desktop. */
  width: z.number().int().min(0).max(20_000).optional(),
});

export type BeaconPayload = z.infer<typeof beaconSchema>;

export type Device = "mobile" | "tablet" | "desktop";

export type StoredEvent = {
  /** Epoch milliseconds. */
  t: number;
  /** Normalised pathname. */
  p: string;
  /** Referring host, "direct" when there was none, or "internal" for a move within the site. */
  r: string;
  /** Daily-rotating anonymous visitor hash. */
  v: string;
  d: Device;
  /** Two-letter country, when the host in front of the app provides one. */
  c?: string;
};

export const storedEventSchema = z.object({
  t: z.number(),
  p: z.string(),
  r: z.string(),
  v: z.string(),
  d: z.enum(["mobile", "tablet", "desktop"]),
  c: z.string().optional(),
});
