"use server";

import { headers } from "next/headers";
import { handleInquiry, type InquiryState } from "@/lib/inquiry/submit";
import { clientIp } from "@/lib/rate-limit";

export type { InquiryState };

/**
 * The contact form's only entry point.
 *
 * A Server Action is a public POST endpoint. Next.js checks the request's
 * origin against the host and caps the body at 1MB, but everything past that is
 * this application's job, so this stays a thin adapter: read the request
 * context, hand it to `handleInquiry`, which sanitises, validates, rate-limits
 * and sends.
 */
export async function submitInquiry(_prev: InquiryState, formData: FormData): Promise<InquiryState> {
  const input: Record<string, string> = {};
  formData.forEach((value, key) => {
    if (typeof value === "string") input[key] = value;
  });

  return handleInquiry(input, { ip: clientIp(await headers()) });
}
