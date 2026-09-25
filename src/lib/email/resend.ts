import "server-only";
import { Resend } from "resend";
import { emailConfigured, env } from "@/lib/env";
import type { InquiryInput } from "@/lib/validation/inquiry";
import { topicLabels } from "@/lib/validation/inquiry";
import { autoReplyHtml, autoReplyText, inquiryEmailHtml, inquiryEmailText } from "./templates";
import { getVenue } from "@/lib/content/venue";

/**
 * Whether real delivery is wired up. When it is not, the senders below log the
 * enquiry and report `delivered: false` — which callers must not treat as a
 * failure, or local development would show every guest an error.
 */
export function inquiryEmailConfigured(): boolean {
  return emailConfigured;
}

/**
 * Resend's shared sender. Fine for a smoke test, but it is an unverified domain
 * so real guests would find the auto-reply in spam; production sets
 * INQUIRY_FROM_EMAIL to an address on a domain verified in Resend.
 */
const DEFAULT_FROM = "Chef Amrit Pal Singh <onboarding@resend.dev>";

/** One client for the process, built on first use rather than per send. */
let client: Resend | null = null;
function resend(apiKey: string): Resend {
  client ??= new Resend(apiKey);
  return client;
}

/**
 * How long one call to the mail API may take. A normal send is a few hundred
 * milliseconds. Past this the send is reported as not delivered and the guest
 * is told so, rather than left looking at "Sending" while a stalled connection
 * runs down the platform's own request limit and turns into a blank error.
 */
const SEND_TIMEOUT_MS = 8_000;

function withTimeout<T>(work: Promise<T>, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${SEND_TIMEOUT_MS}ms`)), SEND_TIMEOUT_MS);
  });
  return Promise.race([work, timeout]).finally(() => clearTimeout(timer));
}

/**
 * Sends the enquiry via Resend when configured; otherwise logs a dry run.
 * Never throws: a lost email should be visible in logs, not shown to a guest.
 */
export async function sendInquiryEmail(data: InquiryInput): Promise<{ delivered: boolean }> {
  const apiKey = env.RESEND_API_KEY;
  const to = env.INQUIRY_TO_EMAIL;
  const from = env.INQUIRY_FROM_EMAIL ?? DEFAULT_FROM;

  if (!apiKey || !to) {
    console.info("[inquiry:dry-run] RESEND_API_KEY or INQUIRY_TO_EMAIL not set. Enquiry:", inquiryEmailText(data));
    return { delivered: false };
  }

  try {
    const { error } = await withTimeout(
      resend(apiKey).emails.send({
        from,
        to,
        replyTo: data.email,
        subject: `Website message — ${data.name} (${topicLabels[data.topic]})`,
        html: inquiryEmailHtml(data),
        text: inquiryEmailText(data),
      }),
      "inquiry email",
    );
    if (error) {
      console.error("[inquiry:resend-error]", error, inquiryEmailText(data));
      return { delivered: false };
    }
    return { delivered: true };
  } catch (err) {
    console.error("[inquiry:resend-exception]", err, inquiryEmailText(data));
    return { delivered: false };
  }
}

/**
 * Personal auto-reply to the guest: Chef Amrit's thank-you message, a link to
 * his video, and a copy of what they wrote. Dry-runs to the console when unconfigured.
 */
export async function sendAutoReplyEmail(data: InquiryInput): Promise<{ delivered: boolean }> {
  const apiKey = env.RESEND_API_KEY;
  const from = env.INQUIRY_FROM_EMAIL ?? DEFAULT_FROM;
  const replyTo = env.INQUIRY_TO_EMAIL?.[0];

  if (!apiKey) {
    console.info("[inquiry:auto-reply:dry-run] RESEND_API_KEY not set. Would send to", data.email);
    return { delivered: false };
  }

  try {
    // The address in the sign-off is whatever the dashboard currently says, so
    // a guest is never sent to a restaurant that has moved.
    const venue = await getVenue();

    const { error } = await withTimeout(
      resend(apiKey).emails.send({
        from,
        to: data.email,
        ...(replyTo ? { replyTo } : {}),
        subject: `Thank you, ${data.name} — a message from Chef Amrit`,
        html: autoReplyHtml(data, venue),
        text: autoReplyText(data, venue),
      }),
      "auto-reply",
    );
    if (error) {
      console.error("[inquiry:auto-reply:resend-error]", error);
      return { delivered: false };
    }
    return { delivered: true };
  } catch (err) {
    console.error("[inquiry:auto-reply:exception]", err);
    return { delivered: false };
  }
}
