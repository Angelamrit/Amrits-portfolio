import "server-only";
import { Resend } from "resend";
import type { InquiryInput } from "@/lib/validation/inquiry";
import { experienceLabels } from "@/lib/validation/inquiry";
import { autoReplyHtml, autoReplyText, inquiryEmailHtml, inquiryEmailText } from "./templates";

/**
 * Sends the enquiry via Resend when configured; otherwise logs a dry run.
 * Never throws: a lost email should be visible in logs, not shown to a guest.
 */
export async function sendInquiryEmail(data: InquiryInput): Promise<{ delivered: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.INQUIRY_TO_EMAIL;
  const from = process.env.INQUIRY_FROM_EMAIL ?? "Chef Amrit Pal Singh <onboarding@resend.dev>";

  if (!apiKey || !to) {
    console.info("[inquiry:dry-run] RESEND_API_KEY or INQUIRY_TO_EMAIL not set. Enquiry:", inquiryEmailText(data));
    return { delivered: false };
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: to.split(",").map((s) => s.trim()),
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
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.INQUIRY_FROM_EMAIL ?? "Chef Amrit Pal Singh <onboarding@resend.dev>";
  const replyTo = process.env.INQUIRY_TO_EMAIL?.split(",")[0]?.trim();

  if (!apiKey) {
    console.info("[inquiry:auto-reply:dry-run] RESEND_API_KEY not set. Would send to", data.email);
    return { delivered: false };
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
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
