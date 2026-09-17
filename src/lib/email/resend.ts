import "server-only";
import { Resend } from "resend";
import { emailConfigured, env } from "@/lib/env";
import type { InquiryInput } from "@/lib/validation/inquiry";
import { experienceLabels } from "@/lib/validation/inquiry";
import { autoReplyHtml, autoReplyText, inquiryEmailHtml, inquiryEmailText } from "./templates";

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
    const { error } = await resend(apiKey).emails.send({
      from,
      to,
      replyTo: data.email,
      subject: `Private experience enquiry — ${data.name} (${experienceLabels[data.experience]}, ${data.guests} guests)`,
      html: inquiryEmailHtml(data),
      text: inquiryEmailText(data),
    });
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
 * his video, and what happens next. Dry-runs to the console when unconfigured.
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
    const { error } = await resend(apiKey).emails.send({
      from,
      to: data.email,
      ...(replyTo ? { replyTo } : {}),
      subject: `Thank you, ${data.name} — a message from Chef Amrit`,
      html: autoReplyHtml(data),
      text: autoReplyText(data),
    });
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
