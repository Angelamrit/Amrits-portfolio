import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, KeyRound, ShieldCheck, TriangleAlert } from "lucide-react";
import { adminConfigured } from "@/lib/admin/config";
import { Heading, Em } from "@/components/ui/Heading";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign in",
  // The dashboard is not content; keep it out of every index.
  robots: { index: false, follow: false },
};

/**
 * The only door into the dashboard.
 *
 * Two states. Normally it is a password field. Before anyone has set a
 * credential it is a short setup note instead — which is safe to show, because
 * in that state there is no dashboard behind it and nothing to protect, and it
 * saves the operator hunting through a README for the variable name.
 */
export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const configured = adminConfigured();

  return (
    <main className="admin-room tone-dark relative flex min-h-dvh items-center justify-center overflow-hidden px-5 py-16">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <span className="orb orb-gold -left-[10%] -top-[25%] size-[55vw] max-w-[700px] opacity-30" />
        <span className="orb orb-ember -bottom-[22%] -right-[12%] size-[50vw] max-w-[640px] opacity-45 animate-float-slow" />
        <span className="grid-pattern absolute inset-0 opacity-[0.55]" />
      </div>

      <div className="glass-strong border-gradient relative z-10 w-full max-w-md rounded-frame p-8 sm:p-11">
        <span
          aria-hidden
          className="absolute -top-px left-1/2 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-gold-light/70 to-transparent"
        />

        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-full border border-gold/25 bg-gold/10">
            {configured ? (
              <KeyRound className="size-5 text-gold" strokeWidth={1.5} aria-hidden />
            ) : (
              <TriangleAlert className="size-5 text-gold" strokeWidth={1.5} aria-hidden />
            )}
          </span>
          <p className="eyebrow text-gold/80">Private</p>
        </div>

        <Heading as="h1" size="sm" className="mt-7">
          {configured ? (
            <>
              The <Em>studio</Em>
            </>
          ) : (
            <>
              Not <Em>set up yet</Em>
            </>
          )}
        </Heading>

        {configured ? (
          <>
            <p className="mt-3 text-sm leading-relaxed text-fg/55">
              Visitor numbers, menus and photography for chefamritpalsingh.com.
            </p>
            <LoginForm next={typeof next === "string" ? next : ""} />
            <p className="mt-7 flex items-center gap-2 text-xs text-fg/40">
              <ShieldCheck className="size-3.5 shrink-0" strokeWidth={1.6} aria-hidden />
              Sessions last 12 hours on this device.
            </p>
          </>
        ) : (
          <div className="mt-6 flex flex-col gap-4 text-sm leading-relaxed text-fg/60">
            <p>Set one environment variable on the server, then reload this page.</p>
            <code className="block rounded-xl border border-gold/20 bg-charcoal/60 px-4 py-3 font-mono text-[0.78rem] text-gold-light/90">
              ADMIN_PASSWORD_HASH=&hellip;
            </code>
            <p className="text-fg/45">
              Generate the value with <span className="text-gold-light/80">npm run admin:password</span>. A plain{" "}
              <span className="text-gold-light/80">ADMIN_PASSWORD</span> also works, though the hash is safer.
            </p>
          </div>
        )}

        <Link
          href="/"
          className="mt-9 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-fg/45 transition-colors duration-300 hover:text-gold"
        >
          <ArrowLeft className="size-3.5" strokeWidth={1.6} aria-hidden />
          Back to the site
        </Link>
      </div>
    </main>
  );
}
