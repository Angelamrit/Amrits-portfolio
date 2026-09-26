"use server";

import { after } from "next/server";
import { headers } from "next/headers";
import { FORM_FIELDS, handleInquiry, issueInquiryChallenge, type InquiryState } from "@/lib/inquiry/submit";
import type { Challenge } from "@/lib/inquiry/challenge";
import { clientIp } from "@/lib/rate-limit";

export type { Challenge, InquiryState };

/**
 * The contact form's two entry points.
 *
 * A Server Action is a public POST endpoint. Next.js checks the request's
 * origin against the host and caps the body at 1MB, but everything past that is
 * this application's job, so these stay thin adapters: read the request
 * context and hand it to `src/lib/inquiry/submit.ts`, which rate-limits,
 * checks the challenge, sanitises, validates and sends.
 *
 * Both catch everything. Nothing in the pipeline is meant to throw, but an
 * error that escaped a Server Action would replace the page with the error
 * boundary, and a contact form must never take the page down. The guest gets
 * an honest sentence and the failure goes to the log with its stack.
 */

const FAILED: InquiryState = {
  status: "error",
  fieldErrors: {},
  formError:
    "Something went wrong on our side and your message was not sent. Please try again in a moment, or call the restaurant and we will take the details over the phone.",
  values: {},
  refreshChallenge: true,
};

/**
 * Called by the form the first time the guest touches it. The browser solves
 * the challenge in the background and sends it back with the message;
 * `handleInquiry` will not send without one. `null` means this connection has
 * asked for too many, or something failed — either way the form carries on
 * and the server explains itself at submit time.
 */
export async function requestChallenge(): Promise<Challenge | null> {
  try {
    return await issueInquiryChallenge({ ip: clientIp(await headers()) });
  } catch (error) {
    console.error("[inquiry:challenge-failed]", error);
    return null;
  }
}

export async function submitInquiry(_prev: InquiryState, formData: FormData): Promise<InquiryState> {
  try {
    // Only the form's own fields are read; a body padded with thousands of
    // others is never iterated.
    const input: Record<string, string> = {};
    for (const field of FORM_FIELDS) {
      const value = formData.get(field);
      if (typeof value === "string") input[field] = value;
    }

    // `after` runs the auto-reply once this response has been sent, and on a
    // serverless host keeps the function alive until it has.
    return await handleInquiry(input, { ip: clientIp(await headers()), defer: after });
  } catch (error) {
    console.error("[inquiry:unhandled]", error);
    return FAILED;
  }
}
