import "server-only";
import { z } from "zod";

/**
 * The server's environment, parsed once and checked rather than read ad hoc.
 *
 * The failure this exists to prevent is a quiet one. The enquiry form treats an
 * unconfigured mailer as a local dry run: it logs the enquiry and reports
 * success, which is exactly right on a laptop and exactly wrong in production,
 * where it means a guest is thanked for an enquiry that reached nobody. The
 * same is true of a half-configured deploy — an API key with no recipient, or a
 * recipient with no key — because the mailer needs both before it will send.
 *
 * So there are two layers, and they fail differently on purpose. Anything
 * malformed throws the moment this module is imported, because a misspelled
 * address is a bug wherever it is found and nothing downstream can do anything
 * sensible with it. Anything merely *absent* only warns: `reportRuntimeEnv`
 * prints a loud banner at server startup, and the enquiry form declines to
 * claim success it cannot back up.
 *
 * Absence deliberately does not throw. An earlier version did, and the result
 * was that an unset key returned 500 for every page on the site — the gallery,
 * the menus, the chef's story, all of it — which is a far worse outcome than a
 * working site whose contact form asks the guest to phone instead. Loud in the
 * logs, degraded for the visitor, never silently lost.
 */

/** Unset and set-to-empty-string should mean the same thing. */
const blankToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

/** One address, or several separated by commas. */
const addressList = z
  .string()
  .transform((value) => value.split(",").map((part) => part.trim()).filter(Boolean))
  .refine((list) => list.length > 0, "must contain at least one email address")
  .refine(
    (list) => list.every((address) => z.email().safeParse(address).success),
    "must be an email address, or several separated by commas",
  );

/**
 * A From address, which Resend accepts either bare or with a display name:
 * `chef@example.com` or `Chef Amrit Pal Singh <chef@example.com>`.
 */
const mailbox = z.string().refine((value) => {
  const withDisplayName = value.match(/<([^>]+)>\s*$/);
  const address = (withDisplayName ? withDisplayName[1] : value).trim();
  return z.email().safeParse(address).success;
}, 'must be an address, optionally with a display name: "Name <address@example.com>"');

const schema = z.object({
  RESEND_API_KEY: z.preprocess(blankToUndefined, z.string().min(1).optional()),
  INQUIRY_TO_EMAIL: z.preprocess(blankToUndefined, addressList.optional()),
  INQUIRY_FROM_EMAIL: z.preprocess(blankToUndefined, mailbox.optional()),
  NEXT_PUBLIC_SITE_URL: z.preprocess(
    // A bare host is accepted as https, matching `resolveSiteUrl` in src/data/site.ts.
    (value) => {
      const blank = blankToUndefined(value);
      return typeof blank === "string" && !/^https?:\/\//i.test(blank.trim()) ? `https://${blank.trim()}` : blank;
    },
    z.url({ error: "must be an absolute URL, e.g. https://chefamritpalsingh.com" }).optional(),
  ),
});

function readEnv() {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const problems = Object.entries(z.flattenError(parsed.error).fieldErrors)
      .map(([name, messages]) => `  ${name} ${messages?.[0] ?? "is invalid"}`)
      .join("\n");
    // The values themselves are never printed: one of them is a secret.
    throw new Error(`Invalid environment variables:\n${problems}\n\nSee .env.example.`);
  }
  return parsed.data;
}

export const env = readEnv();

/** Whether the mailer has everything it needs to actually deliver. */
export const emailConfigured = Boolean(env.RESEND_API_KEY && env.INQUIRY_TO_EMAIL);

/**
 * Called once at server startup, from `src/instrumentation.ts`.
 *
 * Returns whether the mailer is ready, and says so on stderr when it is not, so
 * that a production deploy missing its credentials is obvious in the logs from
 * the first line rather than discovered when a guest complains that nobody
 * called them back. It does not throw: see the note at the top of this file.
 */
export function reportRuntimeEnv(): boolean {
  if (emailConfigured) return true;

  const missing = [
    !env.RESEND_API_KEY && "RESEND_API_KEY",
    !env.INQUIRY_TO_EMAIL && "INQUIRY_TO_EMAIL",
  ].filter(Boolean);

  if (process.env.NODE_ENV !== "production") {
    console.info(`[env] ${missing.join(" and ")} not set — the enquiry form will log to this console instead of sending.`);
    return false;
  }

  console.error(
    [
      "",
      "  ****************************************************************",
      "  * ENQUIRY EMAIL IS NOT CONFIGURED                              *",
      "  ****************************************************************",
      `  Missing: ${missing.join(", ")}`,
      "",
      "  The site will serve normally, but it cannot deliver enquiries, so",
      "  the contact form will ask guests to telephone instead of pretending",
      "  their message was sent. Set these in the deployment's environment",
      "  and redeploy. See .env.example.",
      "",
    ].join("\n"),
  );
  return false;
}
