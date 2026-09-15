"use client";

import { startTransition, useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, m } from "motion/react";
import { Check, ChevronLeft, Minus, Plus } from "lucide-react";
import { submitInquiry, type InquiryState } from "@/app/contact/actions";
import { budgetLabels, budgetOptions, experienceLabels, experienceOptions, type InquiryField } from "@/lib/validation/inquiry";
import { experiences } from "@/data/experiences";
import { menuBySlug } from "@/data/menus";
import { dishById } from "@/data/dishes";
import { site } from "@/data/site";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Field";
import { InquirySuccess } from "./InquirySuccess";

/* ------------------------------------------------------------------ */
/* Types and static config                                             */
/* ------------------------------------------------------------------ */

type Experience = (typeof experienceOptions)[number];
type Budget = (typeof budgetOptions)[number];

type Data = {
  experience: Experience | "";
  guests: number;
  eventDate: string;
  location: string;
  dietaryTags: string[];
  dietary: string;
  budget: Budget | "";
  name: string;
  email: string;
  phone: string;
  message: string;
};

const steps = [
  { key: "experience", label: "Occasion", title: "What's the occasion?", hint: "Choose the experience closest to what you have in mind. Everything is tailored afterwards." },
  { key: "guests", label: "Guests", title: "How many guests?", hint: "A rough number is fine. It shapes the format of the menu more than anything else." },
  { key: "when", label: "Date & place", title: "When and where?", hint: "Both are optional for now. If the date is fixed, tell us so we can check availability first." },
  { key: "dietary", label: "Dietary", title: "Any dietary needs?", hint: "Angel's kitchen is predominantly vegetarian and 100% Halal by default. Add anything else the chef should know." },
  { key: "budget", label: "Budget", title: "What's your budget?", hint: "This helps Chef Amrit design the right scale of menu, staffing and service. Nothing is fixed at this stage." },
  { key: "details", label: "Details", title: "How do we reach you?", hint: "Chef Amrit's team replies personally within two working days." },
  { key: "review", label: "Review", title: "Your estimated menu", hint: "A first suggestion, based on what you've told us. The final menu is designed together in the consultation." },
] as const;

const fieldStep: Record<InquiryField, number> = {
  experience: 0,
  guests: 1,
  eventDate: 2,
  location: 2,
  dietary: 3,
  budget: 4,
  name: 5,
  email: 5,
  phone: 5,
  message: 5,
};

const dietaryChips = ["Vegetarian", "Vegan", "Gluten-free", "Nut allergy", "Dairy-free", "Jain (no onion, garlic)"];
const guestPresets = [2, 6, 12, 24, 50, 100, 200];

const experienceBlurb: Record<Experience, string> = {
  ...Object.fromEntries(experiences.map((e) => [e.slug, e.short])),
  "tasting-menu": "Dinner in the new upscale dining room at Angel, Jackson Heights.",
  other: "Something we haven't listed. Tell us about it.",
} as Record<Experience, string>;

const ease = [0.16, 1, 0.3, 1] as const;
const emailOk = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

/* ------------------------------------------------------------------ */
/* Estimated menu                                                      */
/* ------------------------------------------------------------------ */

type Suggestion = { title: string; style: string; menuSlug: string; courses: string[]; notes: string[] };

function coursesOf(slug: string) {
  const menu = menuBySlug(slug);
  if (!menu) return [];
  return menu.courses.map((c) => c.name ?? (c.dishId ? dishById(c.dishId)?.name : undefined) ?? (c.status === "draft" ? "Chef's seasonal course" : c.title));
}

export function suggestMenu(experience: Experience | "", guests: number, tags: string[]): Suggestion | null {
  if (!experience) return null;
  const intimate = guests > 0 && guests <= 12;
  let s: Suggestion;
  switch (experience) {
    case "tasting-menu":
      s = { title: "Chef's Tasting Menu", style: "Seven courses in the new dining room at Angel.", menuSlug: "tasting", courses: coursesOf("tasting"), notes: [] };
      break;
    case "private-dining":
      s = intimate
        ? { title: "Chef's Tasting Menu, at your table", style: "Seven courses cooked in your kitchen and served one by one.", menuSlug: "tasting", courses: coursesOf("tasting"), notes: [] }
        : { title: "Private Event Menu", style: "Four movements, served family style at the table.", menuSlug: "private-event", courses: coursesOf("private-event"), notes: [] };
      break;
    case "dinner-parties":
      s = intimate
        ? { title: "Chef's Tasting Menu, at your table", style: "Seven courses with shared plates from the tandoor to open.", menuSlug: "tasting", courses: coursesOf("tasting"), notes: ["Cocktail pairings and a bar can be added."] }
        : { title: "Private Event Menu", style: "Four movements built around shared plates and a slow-cooked centrepiece.", menuSlug: "private-event", courses: coursesOf("private-event"), notes: ["Cocktail pairings and a bar can be added."] };
      break;
    case "corporate-events":
      s = { title: "Private Event Menu", style: guests > 60 ? "Passed street-food bites, then stations timed around your agenda." : "Four movements, timed around your agenda.", menuSlug: "private-event", courses: coursesOf("private-event"), notes: ["Dedicated coordinator, invoicing and documentation included."] };
      break;
    case "weddings":
      s = { title: "Wedding Menu, stations and family style", style: "A chaat station to welcome, the tandoor, then a grand slow-cooked biryani.", menuSlug: "private-event", courses: ["Chaat station to welcome", "From the tandoor, with fresh breads", "Regional delicacies, served family style", "Grand vegetable dum biryani", "Sweet & chai"], notes: ["Tasting session included before the day."] };
      break;
    case "villa-yacht-dining":
      s = { title: "Residency Menus", style: "Daily menus built from the house specialties, planned around provisioning on location.", menuSlug: "house-specialties", courses: coursesOf("house-specialties"), notes: ["Breakfasts, lunches and dinners designed as one unhurried story."] };
      break;
    case "personal-chef":
      s = { title: "Weekly Personal Chef Plan", style: "A rotating plan of home-style Punjabi cooking, prepared, labelled and stored in your kitchen.", menuSlug: "house-specialties", courses: coursesOf("house-specialties"), notes: ["Menus rotate weekly around your preferences and health goals."] };
      break;
    default:
      s = { title: "Private Event Menu", style: "A flexible four-movement framework, designed around your occasion.", menuSlug: "private-event", courses: coursesOf("private-event"), notes: [] };
  }
  const t = tags.map((x) => x.toLowerCase());
  if (t.some((x) => x.startsWith("vegan"))) s.notes.push("Vegan versions of the paneer courses, with tofu or seasonal vegetables.");
  if (t.some((x) => x.startsWith("gluten"))) s.notes.push("Breads swapped for rice; chaat prepared gluten-free.");
  if (t.some((x) => x.startsWith("nut"))) s.notes.push("Nut-free preparation throughout.");
  if (t.some((x) => x.startsWith("dairy"))) s.notes.push("Dairy-free gravies and desserts.");
  if (t.some((x) => x.startsWith("jain"))) s.notes.push("No onion or garlic in any gravy.");
  if (guests > 100) s.notes.push("A chaat station and passed bites for the welcome, given the number of guests.");
  s.notes.push("Predominantly vegetarian. 100% Halal.");
  return s;
}

/* ------------------------------------------------------------------ */
/* Small building blocks                                               */
/* ------------------------------------------------------------------ */

function OptionCard({ selected, onClick, title, body, index }: { selected: boolean; onClick: () => void; title: string; body?: string; index?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "group relative flex h-full flex-col gap-2 rounded-frame border p-5 text-left transition-all duration-500 ease-luxe",
        selected ? "border-gold bg-gold/10 shadow-glow" : "border-fg/10 bg-fg/[0.03] hover:border-gold/50 hover:bg-fg/[0.05]",
      )}
    >
      <span className="flex items-center justify-between gap-3">
        {index && <span className={cn("font-display text-xl", selected ? "text-gold-gradient" : "text-fg/40")}>{index}</span>}
        <span
          className={cn(
            "ml-auto grid size-6 place-items-center rounded-full border transition-all duration-300",
            selected ? "border-gold bg-gold text-charcoal" : "border-fg/20 text-transparent group-hover:border-gold/60",
          )}
        >
          <Check className="size-3.5" strokeWidth={2.5} />
        </span>
      </span>
      <span className={cn("font-display text-xl leading-tight", selected ? "text-fg" : "text-fg/85")}>{title}</span>
      {body && <span className="text-xs leading-relaxed text-fg/55">{body}</span>}
    </button>
  );
}

function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "rounded-pill border px-4 py-2.5 font-sans text-[0.68rem] font-semibold uppercase tracking-[0.18em] transition-all duration-300",
        selected ? "border-gold bg-gradient-to-r from-gold-light to-gold text-charcoal shadow-glow" : "border-fg/15 text-fg/70 hover:border-gold/60 hover:text-fg",
      )}
    >
      {children}
    </button>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line py-2.5 last:border-0">
      <dt className="eyebrow text-[0.55rem] text-muted">{label}</dt>
      <dd className={cn("text-right text-sm", value ? "text-fg" : "text-fg/30")}>{value ?? "—"}</dd>
    </div>
  );
}

function EstimatedMenu({ suggestion, compact = false }: { suggestion: Suggestion; compact?: boolean }) {
  return (
    <div className={cn("rounded-frame border border-gold/40 bg-gold/[0.06] p-5", !compact && "md:p-7")}>
      <p className="eyebrow text-[0.58rem] text-gold-light">Estimated menu</p>
      <p className={cn("mt-2 font-display font-light text-gold-gradient", compact ? "text-2xl" : "text-display-sm")}>{suggestion.title}</p>
      <p className="mt-2 text-sm text-fg/70">{suggestion.style}</p>
      <ol className={cn("mt-4 space-y-1.5", compact && "hidden sm:block")}>
        {suggestion.courses.map((c, i) => (
          <li key={`${c}-${i}`} className="grid grid-cols-[1.5rem_1fr] gap-2 text-sm">
            <span className="font-display text-gold-gradient">{String(i + 1).padStart(2, "0")}</span>
            <span className="text-fg/85">{c}</span>
          </li>
        ))}
      </ol>
      {!compact && (
        <ul className="mt-4 space-y-1 border-t border-line pt-4 text-xs text-fg/60">
          {suggestion.notes.map((n) => (
            <li key={n} className="flex gap-2">
              <span aria-hidden className="mt-1.5 size-1 shrink-0 rounded-full bg-gold" />
              {n}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The wizard                                                          */
/* ------------------------------------------------------------------ */

const initialState: InquiryState = { status: "idle" };

export function BookingWizard() {
  const params = useSearchParams();
  const preset = params.get("experience");
  const presetExperience = experienceOptions.includes(preset as Experience) ? (preset as Experience) : "";

  const [state, action, pending] = useActionState(submitInquiry, initialState);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [attempted, setAttempted] = useState(false);
  const [serverErrors, setServerErrors] = useState<Partial<Record<InquiryField, string>>>({});
  const mountedAt = useRef(0);
  const [data, setData] = useState<Data>({
    experience: presetExperience,
    guests: 8,
    eventDate: "",
    location: presetExperience === "tasting-menu" ? "Angel Indian Restaurant, Jackson Heights" : "",
    dietaryTags: [],
    dietary: "",
    budget: "",
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  useEffect(() => {
    mountedAt.current = Date.now();
  }, []);

  // Map server-side validation errors back onto the right step (adjusted during render, not in an effect).
  const [seenState, setSeenState] = useState<InquiryState>(state);
  if (state !== seenState) {
    setSeenState(state);
    if (state.status === "error") {
      setServerErrors(state.fieldErrors);
      const first = (Object.keys(state.fieldErrors) as InquiryField[]).map((k) => fieldStep[k]).sort((a, b) => a - b)[0];
      if (first !== undefined) {
        setDir(-1);
        setStep(first);
        setAttempted(true);
      }
    }
  }

  const set = <K extends keyof Data>(key: K, value: Data[K]) => {
    setData((d) => ({ ...d, [key]: value }));
    setServerErrors((e) => {
      const next = { ...e };
      delete next[key as InquiryField];
      return next;
    });
  };

  const today = new Date().toISOString().slice(0, 10);
  const chosen = experiences.find((e) => e.slug === data.experience);
  const suggestion = useMemo(() => suggestMenu(data.experience, data.guests, data.dietaryTags), [data.experience, data.guests, data.dietaryTags]);

  /* per-step client validation */
  const errors = useMemo(() => {
    const e: Partial<Record<InquiryField, string>> = { ...serverErrors };
    if (step === 0 && !data.experience) e.experience = "Please choose an experience.";
    if (step === 1 && (!data.guests || data.guests < 1)) e.guests = "At least one guest.";
    if (step === 2 && data.eventDate && data.eventDate < today) e.eventDate = "Please choose a date that is today or later.";
    if (step === 5) {
      if (data.name.trim().length < 2) e.name = "Please tell us your name.";
      if (!emailOk(data.email)) e.email = "Please enter a valid email address.";
      if (data.message.trim().length < 20) e.message = "Tell us a little more (at least 20 characters).";
    }
    return e;
  }, [step, data, today, serverErrors]);

  const stepValid = Object.keys(errors).length === 0;
  const isLast = step === steps.length - 1;

  const next = () => {
    if (!stepValid) {
      setAttempted(true);
      return;
    }
    setAttempted(false);
    setDir(1);
    setStep((s) => Math.min(steps.length - 1, s + 1));
  };
  const back = () => {
    setAttempted(false);
    setDir(-1);
    setStep((s) => Math.max(0, s - 1));
  };

  const submit = () => {
    const fd = new FormData();
    fd.set("name", data.name);
    fd.set("email", data.email);
    fd.set("phone", data.phone);
    fd.set("eventDate", data.eventDate);
    fd.set("location", data.location);
    fd.set("guests", String(data.guests));
    fd.set("experience", data.experience);
    fd.set("dietary", [data.dietaryTags.join(", "), data.dietary.trim()].filter(Boolean).join(". "));
    if (data.budget) fd.set("budget", data.budget);
    fd.set("message", data.message);
    fd.set("company", "");
    fd.set("startedAt", String(mountedAt.current));
    startTransition(() => action(fd));
  };

  if (state.status === "success") {
    return <InquirySuccess name={state.name} email={state.email} />;
  }

  const show = (k: InquiryField) => (attempted ? errors[k] : serverErrors[k]);
  const current = steps[step];

  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
      {/* ------------------------------------------------ wizard */}
      <div className="lg:col-span-7">
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (isLast) submit();
            else next();
          }}
          className="glass-strong border-gradient relative overflow-hidden rounded-[2rem] p-6 md:p-10"
        >
          <span aria-hidden className="orb orb-gold -right-[15%] -top-[40%] size-[55%] opacity-40" />
          <div className="relative">
            {/* progress */}
            <div className="flex items-center justify-between gap-4">
              <p className="eyebrow text-[0.6rem] text-muted">
                Step {step + 1} of {steps.length} · {current.label}
              </p>
              <ol className="flex gap-1.5" aria-hidden>
                {steps.map((s, i) => (
                  <li key={s.key} className={cn("h-1 rounded-full transition-all duration-500", i <= step ? "w-6 bg-gradient-to-r from-gold-light to-gold" : "w-3 bg-fg/15")} />
                ))}
              </ol>
            </div>

            <div className="mt-8 min-h-[24rem]">
              <AnimatePresence mode="wait" initial={false} custom={dir}>
                <m.div
                  key={current.key}
                  initial={{ opacity: 0, x: dir * 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: dir * -30 }}
                  transition={{ duration: 0.45, ease }}
                >
                  <h2 className="font-display text-display-sm font-light md:text-display-md">{current.title}</h2>
                  <p className="mt-3 max-w-lg text-sm text-fg/65">{current.hint}</p>

                  {/* 0 · Occasion */}
                  {step === 0 && (
                    <div className="mt-8">
                      <div className="grid gap-3 sm:grid-cols-2">
                        {experienceOptions.map((opt, i) => (
                          <OptionCard
                            key={opt}
                            index={String(i + 1).padStart(2, "0")}
                            selected={data.experience === opt}
                            onClick={() => {
                              set("experience", opt);
                              if (opt === "tasting-menu" && !data.location) set("location", "Angel Indian Restaurant, Jackson Heights");
                            }}
                            title={experienceLabels[opt]}
                            body={experienceBlurb[opt]}
                          />
                        ))}
                      </div>
                      {show("experience") && <p className="mt-3 text-xs text-red-300" role="alert">{show("experience")}</p>}
                    </div>
                  )}

                  {/* 1 · Guests */}
                  {step === 1 && (
                    <div className="mt-8">
                      <div className="flex items-center gap-6">
                        <button type="button" onClick={() => set("guests", Math.max(1, data.guests - 1))} className="glass grid size-14 place-items-center rounded-full text-fg transition-colors hover:border-gold hover:text-gold-light" aria-label="Fewer guests">
                          <Minus className="size-5" strokeWidth={1.5} />
                        </button>
                        <div className="text-center">
                          <input
                            type="number"
                            min={1}
                            max={500}
                            value={data.guests}
                            onChange={(e) => set("guests", Math.max(0, Math.min(500, Number(e.target.value) || 0)))}
                            aria-label="Number of guests"
                            className="w-32 bg-transparent text-center font-display text-[4rem] leading-none text-gold-gradient focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <p className="eyebrow mt-1 text-[0.55rem] text-muted">guests</p>
                        </div>
                        <button type="button" onClick={() => set("guests", Math.min(500, data.guests + 1))} className="glass grid size-14 place-items-center rounded-full text-fg transition-colors hover:border-gold hover:text-gold-light" aria-label="More guests">
                          <Plus className="size-5" strokeWidth={1.5} />
                        </button>
                      </div>
                      <div className="mt-8 flex flex-wrap gap-2">
                        {guestPresets.map((n) => (
                          <Chip key={n} selected={data.guests === n} onClick={() => set("guests", n)}>
                            {n}
                          </Chip>
                        ))}
                      </div>
                      {chosen?.guestRange && <p className="mt-6 text-xs text-muted">{chosen.name} is usually {chosen.guestRange}. Outside that range is still worth asking.</p>}
                      {show("guests") && <p className="mt-3 text-xs text-red-300" role="alert">{show("guests")}</p>}
                    </div>
                  )}

                  {/* 2 · When & where */}
                  {step === 2 && (
                    <div className="mt-8 grid gap-6 sm:grid-cols-2">
                      <Input label="Event date" name="eventDate" type="date" min={today} optional value={data.eventDate} onChange={(e) => set("eventDate", e.target.value)} error={show("eventDate")} />
                      <Input label="Location" name="location" placeholder="City, venue or address" optional value={data.location} onChange={(e) => set("location", e.target.value)} error={show("location")} />
                    </div>
                  )}

                  {/* 3 · Dietary */}
                  {step === 3 && (
                    <div className="mt-8">
                      <div className="flex flex-wrap gap-2">
                        {dietaryChips.map((c) => {
                          const on = data.dietaryTags.includes(c);
                          return (
                            <Chip key={c} selected={on} onClick={() => set("dietaryTags", on ? data.dietaryTags.filter((x) => x !== c) : [...data.dietaryTags, c])}>
                              {c}
                            </Chip>
                          );
                        })}
                      </div>
                      <Textarea
                        label="Anything else the kitchen should know"
                        name="dietary"
                        optional
                        hint="Allergies, intolerances, dishes you love or would rather avoid."
                        value={data.dietary}
                        onChange={(e) => set("dietary", e.target.value)}
                        error={show("dietary")}
                        className="mt-6 [&_textarea]:min-h-24"
                      />
                    </div>
                  )}

                  {/* 4 · Budget */}
                  {step === 4 && (
                    <div className="mt-8 grid gap-3 sm:grid-cols-2">
                      {budgetOptions.map((b) => (
                        <OptionCard key={b} selected={data.budget === b} onClick={() => set("budget", data.budget === b ? "" : b)} title={budgetLabels[b]} />
                      ))}
                    </div>
                  )}

                  {/* 5 · Details */}
                  {step === 5 && (
                    <div className="mt-8 grid gap-6 sm:grid-cols-2">
                      <Input label="Name" name="name" autoComplete="name" required value={data.name} onChange={(e) => set("name", e.target.value)} error={show("name")} />
                      <Input label="Email" name="email" type="email" autoComplete="email" required value={data.email} onChange={(e) => set("email", e.target.value)} error={show("email")} />
                      <Input label="Phone" name="phone" type="tel" autoComplete="tel" optional value={data.phone} onChange={(e) => set("phone", e.target.value)} error={show("phone")} className="sm:col-span-2" />
                      <Textarea
                        label="Tell me about your event"
                        name="message"
                        required
                        hint="The occasion, the setting, the mood you have in mind."
                        value={data.message}
                        onChange={(e) => set("message", e.target.value)}
                        error={show("message")}
                        className="sm:col-span-2"
                      />
                    </div>
                  )}

                  {/* 6 · Review */}
                  {step === 6 && (
                    <div className="mt-8 space-y-6">
                      {suggestion && <EstimatedMenu suggestion={suggestion} />}
                      <dl>
                        <Row label="Occasion" value={data.experience ? experienceLabels[data.experience] : undefined} />
                        <Row label="Guests" value={String(data.guests)} />
                        <Row label="Date" value={data.eventDate || undefined} />
                        <Row label="Location" value={data.location || undefined} />
                        <Row label="Dietary" value={[data.dietaryTags.join(", "), data.dietary].filter(Boolean).join(". ") || undefined} />
                        <Row label="Budget" value={data.budget ? budgetLabels[data.budget] : undefined} />
                        <Row label="Contact" value={`${data.name} · ${data.email}${data.phone ? ` · ${data.phone}` : ""}`} />
                      </dl>
                      {state.status === "error" && state.formError && (
                        <p className="text-sm text-red-300" role="alert">
                          {state.formError}
                        </p>
                      )}
                    </div>
                  )}
                </m.div>
              </AnimatePresence>
            </div>

            {/* nav */}
            <div className="mt-10 flex flex-col-reverse gap-4 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={back}
                disabled={step === 0}
                className="inline-flex items-center gap-2 eyebrow text-[0.62rem] text-fg/60 transition-colors hover:text-gold-light disabled:invisible"
              >
                <ChevronLeft className="size-4" strokeWidth={1.5} /> Back
              </button>
              {isLast ? (
                <Button type="submit" disabled={pending} aria-busy={pending} className="w-full sm:w-auto">
                  {pending ? "Sending" : "Request a Private Experience"}
                </Button>
              ) : (
                <Button type="submit" className="w-full sm:w-auto">
                  Continue
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* ------------------------------------------------ live summary */}
      <aside className="lg:col-span-5">
        <div className="space-y-4 lg:sticky lg:top-32">
          <div className="glass rounded-frame p-6">
            <p className="eyebrow text-[0.6rem] text-muted">Your enquiry so far</p>
            <dl className="mt-4">
              <Row label="Occasion" value={data.experience ? experienceLabels[data.experience] : undefined} />
              <Row label="Guests" value={step >= 1 || data.guests ? String(data.guests) : undefined} />
              <Row label="Date" value={data.eventDate || undefined} />
              <Row label="Location" value={data.location || undefined} />
              <Row label="Dietary" value={data.dietaryTags.length ? data.dietaryTags.join(", ") : undefined} />
              <Row label="Budget" value={data.budget ? budgetLabels[data.budget] : undefined} />
            </dl>
          </div>

          <AnimatePresence>
            {suggestion && step >= 1 && step < 6 && (
              <m.div key="suggest" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5, ease }}>
                <EstimatedMenu suggestion={suggestion} compact />
              </m.div>
            )}
          </AnimatePresence>

          <div className="glass rounded-frame p-6">
            <p className="eyebrow text-[0.6rem] text-muted">Response time</p>
            <p className="mt-2 text-sm text-fg/70">Within two working days. For urgent dates, mention it in your message.</p>
            <p className="eyebrow mt-5 text-[0.6rem] text-muted">Or dine at the restaurant</p>
            <p className="mt-2 text-sm text-fg/70">
              {site.restaurant.name}, {site.restaurant.address.street}, {site.restaurant.address.city}
            </p>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
              <Button href="/angel" variant="link">
                About Angel
              </Button>
              {site.restaurant.resyUrl && (
                <Button href={site.restaurant.resyUrl} variant="link">
                  Reserve via Resy
                </Button>
              )}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
