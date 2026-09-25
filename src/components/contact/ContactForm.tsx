"use client";

import {
  startTransition,
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { Check } from "lucide-react";
import { requestChallenge, submitInquiry, type InquiryState } from "@/app/(site)/contact/actions";
import { CHALLENGE_MIN_AGE_MS, solveProof } from "@/lib/inquiry/proof";
import { topicLabels, topicOptions, type InquiryField, type Topic } from "@/lib/validation/inquiry";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Field";
import { InquirySuccess } from "./InquirySuccess";

const initialState: InquiryState = { status: "idle" };

/** A challenge the browser has fetched and solved, and the earliest moment it may be sent. */
type Proof = { token: string; solution: string; readyAt: number };

/** Headroom over the server's minimum age, so a fast network never lands a form a few milliseconds early. */
const READY_MARGIN_MS = 250;

/**
 * A single-screen message form. Chef Amrit cooks only at Angel, so this is for
 * questions, press and collaborations — table reservations go through Resy.
 *
 * Bots are kept out without a CAPTCHA. The first time the guest touches the
 * form — a pointer over it, a field focused, a key pressed — it asks the
 * server for a signed challenge and solves the small proof of work behind it
 * while they type (see `src/lib/inquiry/proof.ts`); the answer travels with
 * the message, and the server will not send without it. The guest sees none
 * of this. Asking on first touch rather than on load means a visitor who only
 * reads the page costs the server nothing, and a script that never touches
 * the form is never handed a token. If the proof is not ready when they press
 * Send, the button shows "Sending" for the moment it takes.
 *
 * The form still posts as a plain form before hydration; the server then asks
 * for one more try, by which time the challenge is in hand.
 */
export function ContactForm() {
  const [state, action, pending] = useActionState(submitInquiry, initialState);
  const [waiting, startWaiting] = useTransition();
  const busy = pending || waiting;

  const values = state.status === "error" ? state.values : undefined;
  const errors: Partial<Record<InquiryField, string>> = state.status === "error" ? state.fieldErrors : {};

  const [topic, setTopic] = useState<Topic>(
    topicOptions.includes(values?.topic as Topic) ? (values?.topic as Topic) : "angel",
  );

  const proofRef = useRef<Promise<Proof | null> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  /**
   * Fetches a challenge and solves it in the background. Runs on the first
   * touch, and again whenever the server says the last one can no longer be used.
   */
  const prepare = useCallback(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const proof = (async (): Promise<Proof | null> => {
      try {
        const challenge = await requestChallenge();
        // The clock starts when the answer arrives, not when it was asked for:
        // the server stamps the token when it gets round to the request, which
        // on a busy server is later than the send, and the stamp is what the
        // minimum age is measured from. Arrival is always after the stamp.
        const receivedAt = Date.now();
        if (!challenge || controller.signal.aborted) return null;
        const solution = await solveProof(challenge.token, challenge.bits, controller.signal);
        return { token: challenge.token, solution, readyAt: receivedAt + CHALLENGE_MIN_AGE_MS + READY_MARGIN_MS };
      } catch {
        // No network, or the form went away mid-solve. The message goes
        // without, and the server says what to do next.
        return null;
      }
    })();
    proofRef.current = proof;
    return proof;
  }, []);

  /** The first sign of a person at the form is when the challenge is asked for. */
  const arm = useCallback(() => {
    if (!proofRef.current) prepare();
  }, [prepare]);

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    if (state.status === "error" && state.refreshChallenge) prepare();
  }, [state, prepare]);

  // The cooldown, counted down on the button. Reset whenever a new response
  // arrives, using the pattern React documents for state derived from a prop.
  const [hold, setHold] = useState<{ for: InquiryState; seconds: number }>({ for: state, seconds: 0 });
  if (hold.for !== state) {
    setHold({ for: state, seconds: state.status === "error" ? (state.retryAfterSeconds ?? 0) : 0 });
  }
  useEffect(() => {
    if (hold.seconds <= 0) return;
    const id = setTimeout(() => setHold((h) => (h.seconds > 0 ? { ...h, seconds: h.seconds - 1 } : h)), 1000);
    return () => clearTimeout(id);
  }, [hold]);
  const holding = hold.seconds > 0;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startWaiting(async () => {
      // A challenge that failed to arrive earlier gets one more try here.
      let proof = await proofRef.current;
      if (!proof) proof = await prepare();
      if (proof) {
        // A person never gets here early; this only covers a submit that
        // followed a fresh challenge, such as the retry after a stale one.
        const wait = proof.readyAt - Date.now();
        if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
        formData.set("challenge", proof.token);
        formData.set("proof", proof.solution);
      }
      startTransition(() => action(formData));
    });
  }

  if (state.status === "success") {
    return <InquirySuccess name={state.name} email={state.email} />;
  }

  return (
    <form
      action={action}
      onSubmit={handleSubmit}
      onPointerEnter={arm}
      onPointerDownCapture={arm}
      onFocusCapture={arm}
      onKeyDownCapture={arm}
      noValidate
      className="glass-strong border-gradient relative overflow-hidden rounded-[2rem] p-6 md:p-10"
    >
      <span aria-hidden className="orb orb-gold -right-[15%] -top-[40%] size-[55%] opacity-40" />

      {/* Honeypot. Off-screen rather than `hidden`, since a bot that reads the
          computed style will skip a field it can tell is not rendered. */}
      <div aria-hidden className="absolute left-[-9999px] top-0 h-px w-px overflow-hidden">
        <input type="text" name="company" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>
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
          <Button type="submit" disabled={busy || holding} aria-busy={busy} className="w-full sm:w-auto">
            {busy ? "Sending" : holding ? `Try again in ${hold.seconds}s` : "Send Message"}
          </Button>
        </div>
      </div>
    </form>
  );
}
