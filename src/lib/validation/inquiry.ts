import { z } from "zod";
import { experienceSlugs } from "@/data/experiences";

export const experienceOptions = [...experienceSlugs, "tasting-menu", "other"] as const;

export const budgetOptions = ["under-2k", "2k-5k", "5k-10k", "10k-plus", "discuss"] as const;
export const budgetLabels: Record<(typeof budgetOptions)[number], string> = {
  "under-2k": "Under $2,000",
  "2k-5k": "$2,000 – $5,000",
  "5k-10k": "$5,000 – $10,000",
  "10k-plus": "$10,000 and above",
  discuss: "Let's discuss",
};

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
  phone: optionalText(40),
  eventDate: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined))
    .refine(
      (v) => {
        if (!v) return true;
        const d = new Date(v);
        if (Number.isNaN(d.getTime())) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return d >= today;
      },
      { message: "Please choose a date that is today or later." },
    ),
  location: optionalText(120),
  guests: z.coerce
    .number({ error: "How many guests?" })
    .int()
    .min(1, "At least one guest.")
    .max(500, "For groups over 500, please email us."),
  experience: z.enum(experienceOptions, { error: "Please choose an experience." }),
  dietary: optionalText(500),
  budget: z.enum(budgetOptions).optional(),
  message: z.string().trim().min(20, "Tell us a little more (at least 20 characters).").max(2000),
  // Anti-spam
  company: z.string().max(0).optional(),
  startedAt: z.coerce.number().optional(),
});

export type InquiryInput = z.infer<typeof inquirySchema>;
export type InquiryField = keyof Omit<InquiryInput, "company" | "startedAt">;

export const experienceLabels: Record<(typeof experienceOptions)[number], string> = {
  "private-dining": "Private Dining",
  "dinner-parties": "Dinner Party",
  "corporate-events": "Corporate Event",
  weddings: "Wedding",
  "villa-yacht-dining": "Villa / Yacht Dining",
  "personal-chef": "Weekly Personal Chef",
  "tasting-menu": "Chef's Tasting Menu at Angel",
  other: "Something else",
};
