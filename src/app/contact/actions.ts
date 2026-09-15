"use server";

import { z } from "zod";
import { inquirySchema, type InquiryField } from "@/lib/validation/inquiry";
import { sendAutoReplyEmail, sendInquiryEmail } from "@/lib/email/resend";

export type InquiryState =
  | { status: "idle" }
  | { status: "error"; fieldErrors: Partial<Record<InquiryField, string>>; formError?: string; values: Record<string, string> }
  | { status: "success"; name: string; email?: string };

const MIN_FILL_MS = 3000;

export async function submitInquiry(_prev: InquiryState, formData: FormData): Promise<InquiryState> {
  const raw: Record<string, string> = {};
  formData.forEach((v, k) => {
    if (typeof v === "string") raw[k] = v;
  });

  // Honeypot / timing: pretend success so bots learn nothing.
  const startedAt = Number(raw.startedAt ?? 0);
  if ((raw.company && raw.company.length > 0) || (startedAt > 0 && Date.now() - startedAt < MIN_FILL_MS)) {
    return { status: "success", name: raw.name?.trim() || "there" };
  }

  const parsed = inquirySchema.safeParse(raw);
  if (!parsed.success) {
    const flat = z.flattenError(parsed.error);
    const fieldErrors: Partial<Record<InquiryField, string>> = {};
    for (const [key, msgs] of Object.entries(flat.fieldErrors)) {
      if (msgs && msgs.length) fieldErrors[key as InquiryField] = msgs[0];
    }
    const { company: _c, startedAt: _s, ...values } = raw;
    void _c;
    void _s;
    return { status: "error", fieldErrors, values };
  }

  await Promise.all([sendInquiryEmail(parsed.data), sendAutoReplyEmail(parsed.data)]);
  return { status: "success", name: parsed.data.name, email: parsed.data.email };
}
