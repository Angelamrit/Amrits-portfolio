/**
 * Sends one clearly labelled test message through the contact form's real
 * mailer, so a new Resend key or a freshly verified domain can be checked
 * without filling in the form.
 *
 *   npm run email:test                       enquiry to INQUIRY_TO_EMAIL, and
 *                                            the guest auto-reply to the same inbox
 *   npm run email:test -- --guest you@x.com  send the auto-reply to that address instead
 *   npm run email:test -- --no-reply         enquiry only
 *
 * Reads RESEND_API_KEY, INQUIRY_TO_EMAIL and INQUIRY_FROM_EMAIL from
 * `.env.local`, exactly as the server does. Exits non-zero when either send is
 * not delivered, and prints Resend's own reason above it, so a sender that
 * Resend refuses (an unverified domain, or the shared test sender being asked
 * to deliver to a stranger) is a visible failure here rather than a guest's
 * message quietly lost later.
 */
import { inquiryEmailConfigured, sendAutoReplyEmail, sendInquiryEmail } from "@/lib/email/resend";
import { env } from "@/lib/env";
import type { InquiryInput } from "@/lib/validation/inquiry";

const args = process.argv.slice(2);
const noReply = args.includes("--no-reply");
const guestFlag = args.indexOf("--guest");
const guest = guestFlag >= 0 ? args[guestFlag + 1] : undefined;

if (guestFlag >= 0 && !guest) {
  console.error("--guest needs an address: npm run email:test -- --guest you@example.com");
  process.exit(2);
}

if (!inquiryEmailConfigured()) {
  console.error(
    "RESEND_API_KEY and INQUIRY_TO_EMAIL must both be set in .env.local before a test email can be sent. See .env.example.",
  );
  process.exit(2);
}

const to = env.INQUIRY_TO_EMAIL!;
const from = env.INQUIRY_FROM_EMAIL ?? "Chef Amrit Pal Singh <onboarding@resend.dev> (Resend's shared test sender)";
const replyTo = guest ?? to[0];
const stamp = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";

const sample: InquiryInput = {
  name: "Website test",
  email: replyTo,
  phone: undefined,
  topic: "angel",
  message: `This is a test of the website's contact form, sent at ${stamp}. If you can read this, enquiries from the site are reaching this inbox. Nothing needs to be done with it.`,
  company: undefined,
  challenge: undefined,
  proof: undefined,
};

console.log(`From:     ${from}`);
console.log(`Enquiry:  to ${to.join(", ")}`);
console.log(`Reply:    ${noReply ? "skipped" : `to ${replyTo}`}`);
console.log("");

let failed = false;

const enquiry = await sendInquiryEmail(sample);
console.log(enquiry.delivered ? "Enquiry email      delivered" : "Enquiry email      NOT delivered (reason above)");
failed ||= !enquiry.delivered;

if (!noReply) {
  const reply = await sendAutoReplyEmail(sample);
  console.log(reply.delivered ? "Guest auto-reply   delivered" : "Guest auto-reply   NOT delivered (reason above)");
  failed ||= !reply.delivered;
}

if (failed) {
  console.log("");
  console.log(
    "If Resend says it can only send to the account owner's address, that is the shared onboarding@resend.dev sender: " +
      "verify a domain at https://resend.com/domains and set INQUIRY_FROM_EMAIL to an address on it.",
  );
}
process.exit(failed ? 1 : 0);
