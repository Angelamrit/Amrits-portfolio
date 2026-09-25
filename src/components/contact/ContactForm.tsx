"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { submitInquiry, type InquiryState } from "@/app/(site)/contact/actions";
import { topicLabels, topicOptions, type InquiryField, type Topic } from "@/lib/validation/inquiry";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Field";
import { InquirySuccess } from "./InquirySuccess";

const initialState: InquiryState = { status: "idle" };

/**
 * A single-screen message form. Chef Amrit cooks only at Angel, so this is for
 * questions, press and collaborations — table reservations go through Resy.
 *
 * It posts as a plain form, so it still works before hydration; the topic pills
 * write into a hidden input for the same reason.
 */
export function ContactForm() {
  const [state, action, pending] = useActionState(submitInquiry, initialState);
  const values = state.status === "error" ? state.values : undefined;
  const errors: Partial<Record<InquiryField, string>> = state.status === "error" ? state.fieldErrors : {};

  const [topic, setTopic] = useState<Topic>(
    topicOptions.includes(values?.topic as Topic) ? (values?.topic as Topic) : "angel",
  );
  const startedAt = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (startedAt.current) startedAt.current.value = String(Date.now());
  }, []);

  if (state.status === "success") {
    return <InquirySuccess name={state.name} email={state.email} />;
  }

  return (
    <form action={action} noValidate className="glass-strong border-gradient relative overflow-hidden rounded-[2rem] p-6 md:p-10">
      <span aria-hidden className="orb orb-gold -right-[15%] -top-[40%] size-[55%] opacity-40" />

      {/* Honeypot. Off-screen rather than `hidden`, since a bot that reads the
          computed style will skip a field it can tell is not rendered. */}
      <div aria-hidden className="absolute left-[-9999px] top-0 h-px w-px overflow-hidden">
        <input type="text" name="company" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>
      <input ref={startedAt} type="hidden" name="startedAt" defaultValue="" />
      <input type="hidden" name="topic" value={topic} />

      <div className="relative">
        <h2 className="font-display text-display-sm font-light md:text-display-md">Send a message</h2>

        <fieldset className="mt-8">
          <legend className="eyebrow text-fg/70">About</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {topicOptions.map((option) => {
              const on = topic === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setTopic(option)}
                  aria-pressed={on}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-pill border px-4 py-2.5 font-sans text-[0.68rem] font-semibold uppercase tracking-[0.18em] transition-all duration-300",
                    on ? "border-gold bg-gold/15 text-fg shadow-glow" : "border-fg/15 text-fg/70 hover:border-gold/60 hover:text-fg",
                  )}
                >
                  {on && <Check aria-hidden className="size-3.5 text-gold" strokeWidth={2.5} />}
                  {topicLabels[option]}
                </button>
              );
            })}
          </div>
          {errors.topic && (
            <p className="mt-3 text-xs text-red-300" role="alert">
              {errors.topic}
            </p>
          )}
        </fieldset>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <Input label="Name" name="name" autoComplete="name" required defaultValue={values?.name} error={errors.name} />
          <Input label="Email" name="email" type="email" autoComplete="email" required defaultValue={values?.email} error={errors.email} />
          <Input
            label="Phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            optional
            defaultValue={values?.phone}
            error={errors.phone}
            className="sm:col-span-2"
          />
          <Textarea label="Message" name="message" required defaultValue={values?.message} error={errors.message} className="sm:col-span-2" />
        </div>

        {state.status === "error" && state.formError && (
          <p className="mt-6 text-sm text-red-300" role="alert">
            {state.formError}
          </p>
        )}

        <div className="mt-10 border-t border-line pt-8">
          <Button type="submit" disabled={pending} aria-busy={pending} className="w-full sm:w-auto">
            {pending ? "Sending" : "Send Message"}
          </Button>
        </div>
      </div>
    </form>
  );
}
