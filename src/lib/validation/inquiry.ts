import { z } from "zod";
import { topicOptions } from "@/lib/inquiry/topics";
import { isValidPhone, PHONE_ERROR } from "@/lib/inquiry/phone";

// The topics live in a Zod-free module the contact form can import; see
// `lib/inquiry/topics.ts`. Re-exported so the server side keeps one import site.
export { topicLabels, topicOptions, type Topic } from "@/lib/inquiry/topics";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined));

export const inquirySchema = z.object({
  name: z.string().trim().min(2, "Please tell us your name.").max(80),
  // The cap matters beyond the form: the address becomes a rate-limit key, and
  // an unbounded one lets a flood of long addresses inflate that map. 254 is
  // the longest address SMTP actually permits.
  email: z.email("Please enter a valid email address.").max(254),
  // Optional, but when given it must be a number: digits and the usual
  // separators only, no letters. See `lib/inquiry/phone.ts`.
  phone: optionalText(40).refine((v) => v === undefined || isValidPhone(v), PHONE_ERROR),
  topic: z.enum(topicOptions, { error: "Please choose what your message is about." }),
  message: z.string().trim().min(20, "Tell us a little more (at least 20 characters).").max(2000),
  // Anti-spam: the honeypot, and the signed challenge with its proof of work.
  // All three are read and stripped before validation; they are listed here
  // so the field type below knows they are not fields a guest is shown.
  company: z.string().max(0).optional(),
  challenge: z.string().max(512).optional(),
  proof: z.string().max(20).optional(),
});

export type InquiryInput = z.infer<typeof inquirySchema>;
export type InquiryField = keyof Omit<InquiryInput, "company" | "challenge" | "proof">;
