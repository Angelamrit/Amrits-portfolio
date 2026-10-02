import type { Metadata } from "next";
import { KeyRound, LifeBuoy, MonitorSmartphone, ShieldCheck } from "lucide-react";
import { credentials } from "@/lib/admin/credential";
import { MIN_PASSWORD_LENGTH } from "@/lib/admin/password-rules";
import { SITE_TIME_ZONE } from "@/lib/analytics/aggregate";
import { store } from "@/lib/store";
import { PageHeading } from "@/components/admin/PageHeading";
import { Panel } from "@/components/admin/Panel";
import { PasswordEditor } from "@/components/admin/PasswordEditor";

export const metadata: Metadata = { title: "Password" };

/**
 * The one screen about the dashboard itself rather than the website.
 *
 * The form sits beside a short panel that answers the questions a password
 * screen raises and the form cannot: where the password is kept, what happens
 * to the phone that is also signed in, and what to do if it is forgotten.
 */
export default async function AdminPasswordPage() {
  const active = await credentials.active();
  const changedOn = active?.changedAt
    ? new Date(active.changedAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: SITE_TIME_ZONE,
      })
    : null;

  const notes = [
    {
      icon: KeyRound,
      title: "Where it is kept",
      body:
        active?.source === "dashboard"
          ? `Set here in the dashboard on ${changedOn}. The password the site was first set up with no longer opens it.`
          : "The password the site was set up with, kept on the server. Once you change it here, the new one takes over.",
    },
    {
      icon: MonitorSmartphone,
      title: "Your other devices",
      body: "Changing it signs out every other phone and computer straight away. This one stays signed in.",
    },
    {
      icon: ShieldCheck,
      title: "Choosing one",
      body: `At least ${MIN_PASSWORD_LENGTH} characters. A few unrelated words are easier to remember and harder to guess than something short and clever.`,
    },
    {
      icon: LifeBuoy,
      title: "If you forget it",
      body: "Whoever looks after the server can set a new one there and redeploy the site. That replaces the one set here, and nothing else is lost.",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeading
        eyebrow="Account"
        title="Your password"
        description="The password that opens this dashboard. Only you should know it, and it is never shown to anyone — not even here."
      />

      <div className="grid gap-4 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <PasswordEditor canSave={!store.warning} />
        </div>

        <Panel
          title="Good to know"
          hint="What happens when you change it."
          className="h-fit xl:col-span-2"
          bodyClassName="pt-4"
        >
          <ul className="flex flex-col gap-5">
            {notes.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex min-w-0 gap-3">
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full border border-gold/25 bg-gold/10 text-gold">
                  <Icon aria-hidden className="size-[0.95rem]" strokeWidth={1.6} />
                </span>
                <span className="text-[0.82rem] leading-relaxed text-fg/60">
                  <span className="block text-fg/85">{title}</span>
                  {body}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
