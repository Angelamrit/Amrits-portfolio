import "server-only";
import { z } from "zod";
import { site } from "@/data/site";
import type { SiteConfig } from "@/types/content";
import { applyPatch, readPatchDoc, writePatch } from "./overrides";

/**
 * The restaurant's own details: where it is, when it serves, how to reach it.
 *
 * These are the facts most likely to change without a developer being
 * involved — a new phone number, a booking link, the hours — and the ones
 * where being out of date does real damage, because a guest acts on them.
 * They are also the facts that feed the structured data search engines read,
 * so an edit here changes the address Google shows as well as the footer.
 *
 * Held as one flat record rather than the nested shape `site` uses, because a
 * form has flat fields and the nesting only exists to group things for a
 * reader. It is reassembled on the way out.
 */

const DOC = "venue";
const KEY = "details";

export type VenueDetails = SiteConfig["restaurant"] & {
  social: SiteConfig["social"];
  /** Where enquiries are shown as going. The address that actually receives them is an environment variable. */
  contactEmail?: string;
};

/** An optional URL field that is allowed to be cleared by sending an empty string. */
const optionalUrl = z
  .string()
  .trim()
  .max(300)
  .refine((value) => value === "" || /^https?:\/\//.test(value), "Links must start with http:// or https://")
  .optional();

export const venuePatchSchema = z.object({
  name: z.string().trim().min(1, "The restaurant needs a name.").max(90).optional(),
  street: z.string().trim().max(120).optional(),
  city: z.string().trim().max(80).optional(),
  region: z.string().trim().max(40).optional(),
  postal: z.string().trim().max(20).optional(),
  country: z.string().trim().max(40).optional(),
  phone: z.string().trim().max(40).optional(),
  hours: z.string().trim().max(120).optional(),
  notes: z.array(z.string().trim().min(1).max(80)).max(8).optional(),
  resyUrl: optionalUrl,
  menuUrl: optionalUrl,
  mapsUrl: optionalUrl,
  instagram: optionalUrl,
  facebook: optionalUrl,
  contactEmail: z
    .string()
    .trim()
    .max(160)
    .refine((value) => value === "" || z.email().safeParse(value).success, "That is not an email address.")
    .optional(),
});

export type VenuePatch = z.infer<typeof venuePatchSchema>;

/** The flat form of whatever is currently live — what the editor loads. */
export function flatten(venue: VenueDetails): Required<Omit<VenuePatch, "notes">> & { notes: string[] } {
  return {
    name: venue.name,
    street: venue.address.street,
    city: venue.address.city,
    region: venue.address.region,
    postal: venue.address.postal,
    country: venue.address.country,
    phone: venue.phone ?? "",
    hours: venue.hours,
    notes: [...venue.notes],
    resyUrl: venue.resyUrl ?? "",
    menuUrl: venue.menuUrl ?? "",
    mapsUrl: venue.mapsUrl ?? "",
    instagram: venue.social.instagram ?? "",
    facebook: venue.social.facebook ?? "",
    contactEmail: venue.contactEmail ?? "",
  };
}

const base: VenueDetails = { ...site.restaurant, social: site.social, contactEmail: site.contactEmail };

/**
 * An empty string means "cleared", and a cleared optional link should be
 * absent rather than present-and-empty — otherwise `{resyUrl && ...}` guards
 * across the site would keep rendering a button that goes nowhere.
 */
const orUndefined = (value: string | undefined) => (value && value.length > 0 ? value : undefined);

export async function getVenue(): Promise<VenueDetails> {
  const { patches } = await readPatchDoc<VenuePatch>(DOC);
  const patch = patches[KEY];
  if (!patch) return base;

  const address = applyPatch(base.address, {
    street: patch.street,
    city: patch.city,
    region: patch.region,
    postal: patch.postal,
    country: patch.country,
  });

  return {
    ...base,
    name: patch.name ?? base.name,
    address,
    hours: patch.hours ?? base.hours,
    notes: patch.notes ?? base.notes,
    phone: patch.phone === undefined ? base.phone : orUndefined(patch.phone),
    resyUrl: patch.resyUrl === undefined ? base.resyUrl : orUndefined(patch.resyUrl),
    menuUrl: patch.menuUrl === undefined ? base.menuUrl : orUndefined(patch.menuUrl),
    mapsUrl: patch.mapsUrl === undefined ? base.mapsUrl : orUndefined(patch.mapsUrl),
    social: {
      instagram: patch.instagram === undefined ? base.social.instagram : orUndefined(patch.instagram),
      facebook: patch.facebook === undefined ? base.social.facebook : orUndefined(patch.facebook),
    },
    contactEmail: patch.contactEmail === undefined ? base.contactEmail : orUndefined(patch.contactEmail),
  };
}

export async function saveVenuePatch(patch: VenuePatch): Promise<void> {
  const baseline = flatten(base) as Record<string, unknown>;

  const trimmed: VenuePatch = {};
  for (const [key, value] of Object.entries(patch) as [keyof VenuePatch, unknown][]) {
    if (value === undefined) continue;
    if (JSON.stringify(value) === JSON.stringify(baseline[key])) continue;
    (trimmed as Record<string, unknown>)[key] = value;
  }

  await writePatch<VenuePatch>(DOC, KEY, Object.keys(trimmed).length > 0 ? trimmed : undefined);
}

export async function resetVenue(): Promise<void> {
  await writePatch<VenuePatch>(DOC, KEY, undefined);
}

export async function venueIsEdited(): Promise<boolean> {
  const { patches } = await readPatchDoc<VenuePatch>(DOC);
  return patches[KEY] !== undefined;
}

/** The version that ships with the code — the default the context falls back to. */
export const originalVenue = base;
