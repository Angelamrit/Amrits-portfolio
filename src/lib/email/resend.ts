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

type Payload = Parameters<Resend["emails"]["send"]>[0];
type SendResult = Awaited<ReturnType<Resend["emails"]["send"]>>;

/**
 * Resend's answer as one plain line. Logged as an object it printed as `{}`
 * in the dev server's log file, which hid the one fact that mattered.
 */
function describe(error: { name?: string; message?: string; statusCode?: number | null }): string {
  const status = error.statusCode == null ? "no response" : `HTTP ${error.statusCode}`;
  return `${error.name ?? "error"} (${status}): ${error.message ?? "no message"}`;
}

function describeThrown(err: unknown): string {
  if (err instanceof Error) return `${err.name}: ${err.message}${err.cause instanceof Error ? ` (cause: ${err.cause.message})` : ""}`;
  return String(err);
}

/** A failure answered quickly enough to be worth one more try, inside the guest's wait. */
const RETRY_WITHIN_MS = 4_000;
const RETRY_PAUSE_MS = 800;

/**
 * One send, retried once when the request never reached Resend: a dropped
 * connection or a failed lookup, which the SDK reports with no status code.
 * Nothing was sent in that case, so the retry cannot deliver an email twice.
 * Anything Resend actually answered — a refused sender, a bad address — is
 * final and is not retried.
 */
async function sendWithRetry(apiKey: string, payload: Payload, label: string): Promise<SendResult> {
  const started = Date.now();
  const first = await withTimeout(resend(apiKey).emails.send(payload), label);
  if (first.error && first.error.statusCode == null && Date.now() - started < RETRY_WITHIN_MS) {
    console.warn(`[${label}] did not reach Resend (${describe(first.error)}); trying once more`);
    await new Promise((resolve) => setTimeout(resolve, RETRY_PAUSE_MS));
    return withTimeout(resend(apiKey).emails.send(payload), label);
  }
  return first;
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
    const { error } = await sendWithRetry(
      apiKey,
      {
        from,
        to,
        replyTo: data.email,
        subject: `Website message — ${data.name} (${topicLabels[data.topic]})`,
        html: inquiryEmailHtml(data),
        text: inquiryEmailText(data),
      },
      "inquiry email",
    );
    if (error) {
      console.error(`[inquiry:resend-error] ${describe(error)}`, inquiryEmailText(data));
      return { delivered: false };
    }
    return { delivered: true };
  } catch (err) {
    console.error(`[inquiry:resend-exception] ${describeThrown(err)}`, inquiryEmailText(data));
    return { delivered: false };
  }
}

/**
 * Personal auto-reply to the guest: Chef Amrit's thank-you message, his video
 * once one is recorded, and a copy of what they wrote. Dry-runs to the console when unconfigured.
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

    const { error } = await sendWithRetry(
      apiKey,
      {
        from,
        to: data.email,
        ...(replyTo ? { replyTo } : {}),
        subject: `Thank you, ${data.name} — a message from Chef Amrit`,
        html: autoReplyHtml(data, venue),
        text: autoReplyText(data, venue),
      },
      "auto-reply",
    );
    if (error) {
      console.error(`[inquiry:auto-reply:resend-error] ${describe(error)}`);
      return { delivered: false };
    }
    return { delivered: true };
  } catch (err) {
    console.error(`[inquiry:auto-reply:exception] ${describeThrown(err)}`);
    return { delivered: false };
  }
}
