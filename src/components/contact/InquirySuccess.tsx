"use client";

import { m } from "motion/react";
import { process } from "@/data/process";
import { site } from "@/data/site";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Em } from "@/components/ui/Heading";
import { ThankYouVideo } from "./ThankYouVideo";
import { useVenue } from "@/components/layout/VenueContext";

export function InquirySuccess({ name, email }: { name: string; email?: string }) {
  const venue = useVenue();
  return (
    <m.div
      role="status"
      aria-live="polite"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="glass-strong border-gradient relative overflow-hidden rounded-[2rem] p-6 md:p-10"
    >
      <span aria-hidden className="orb orb-gold -right-[10%] -top-[40%] size-[50%] opacity-50" />
      <div className="relative grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <Eyebrow>Request received</Eyebrow>
          <p className="mt-6 font-display text-display-md font-light">
            Thank you, <Em>{name}.</Em>
          </p>
          <p className="mt-4 max-w-md text-fg/70">{site.thankYou.message}</p>
          {email && (
            <p className="mt-4 text-sm text-fg/55">
              A copy of this message, with Chef Amrit&rsquo;s video, is on its way to <span className="text-fg/80">{email}</span>.
            </p>
          )}

          <ol className="mt-8 grid gap-3 border-t border-line pt-6 sm:grid-cols-5">
            {process.map((s) => (
              <li key={s.step} className="flex items-center gap-3 sm:flex-col sm:items-start">
                <span className="font-display text-xl text-gold-gradient">{String(s.step).padStart(2, "0")}</span>
                <span className="text-xs">{s.title}</span>
              </li>
            ))}
          </ol>

          <div className="mt-8 flex flex-wrap gap-4">
            <Button href="/" variant="glass">
              Back to home
            </Button>
            {venue.resyUrl && (
              <Button href={venue.resyUrl} variant="link">
                Reserve at Angel via Resy
              </Button>
            )}
          </div>
        </div>
        <div className="lg:col-span-6">
          <ThankYouVideo />
        </div>
      </div>
    </m.div>
  );
}
