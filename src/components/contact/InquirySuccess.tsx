"use client";

import { site } from "@/data/site";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Em } from "@/components/ui/Heading";
import { useVenue } from "@/components/layout/VenueContext";

export function InquirySuccess({ name, email }: { name: string; email?: string }) {
  const venue = useVenue();
  return (
    <div
      role="status"
      aria-live="polite"
      className="enter glass-strong border-gradient relative overflow-hidden rounded-[2rem] p-6 md:p-10"
    >
      <span aria-hidden className="orb orb-gold -right-[10%] -top-[40%] size-[50%] opacity-50" />
      <div className="relative">
        <Eyebrow>Message received</Eyebrow>
        <p className="mt-6 font-display text-display-md font-light">
          Thank you, <Em>{name}.</Em>
        </p>
        <p className="mt-4 max-w-md text-fg/70">{site.thankYou.message}</p>
        {email && (
          <p className="mt-4 text-sm text-fg/55">
            {/* The video is only mentioned once one has been recorded (site.thankYou.videoUrl). */}
            A copy of this message{site.thankYou.videoUrl ? <>, with Chef Amrit&rsquo;s video,</> : null} is on its way to{" "}
            <span className="text-fg/80">{email}</span>.
          </p>
        )}

        <div className="mt-8 flex flex-wrap gap-4 border-t border-line pt-8">
          {venue.resyUrl && <Button href={venue.resyUrl}>Reserve a Table</Button>}
          <Button href="/" variant="glass">
            Back to home
          </Button>
        </div>
      </div>
    </div>
  );
}
