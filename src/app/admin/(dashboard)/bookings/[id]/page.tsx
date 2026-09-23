import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  Mail,
  MailWarning,
  MapPin,
  Phone,
  Salad,
  Users,
  Utensils,
  Wallet,
} from "lucide-react";
import { getBooking, statusHints, todayInNewYork } from "@/lib/bookings/bookings";
import { budgetLabels, budgetOptions, experienceLabels, experienceOptions } from "@/lib/validation/inquiry";
import { Panel } from "@/components/admin/Panel";
import { CopyValue, DeleteBooking, NotesPanel, StatusControl } from "@/components/admin/bookings/BookingControls";
import { DetailsForm } from "@/components/admin/bookings/DetailsForm";
import { StatusPill, daysUntil, formatEventDate, statusLabel } from "@/components/admin/bookings/status";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const booking = await getBooking(id);
  return { title: booking ? `${booking.name} · ${booking.ref}` : "Booking" };
}

/**
 * One booking, laid out in the order a chef deals with it: who it is and how
 * to reach them, what they want, where it stands — then the private notes and
 * the record of what has happened so far.
 */
export default async function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = await getBooking(id);
  if (!booking) notFound();

  const today = todayInNewYork();
  const until = daysUntil(booking.eventDate, today);
  const firstName = booking.name.split(/\s+/)[0];

  // A reply opens in the chef's own mail program, already addressed and with
  // the reference in the subject, so the guest's replies thread together.
  const replyHref = booking.email
    ? `mailto:${booking.email}?subject=${encodeURIComponent(`Your enquiry ${booking.ref} — Chef Amrit Pal Singh`)}&body=${encodeURIComponent(`Dear ${firstName},\n\nThank you for your enquiry.\n\n`)}`
    : null;

  const facts = [
    {
      icon: CalendarDays,
      label: "Date",
      value: formatEventDate(booking.eventDate, "long"),
      extra: until ?? undefined,
    },
    { icon: Users, label: "Guests", value: String(booking.guests) },
    { icon: Utensils, label: "Experience", value: experienceLabels[booking.experience] },
    { icon: MapPin, label: "Where", value: booking.location ?? "Not given" },
    { icon: Wallet, label: "Budget", value: booking.budget ? budgetLabels[booking.budget] : "Not given" },
    { icon: Salad, label: "Dietary", value: booking.dietary ?? "Nothing mentioned" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <Link
        href="/admin/bookings"
        className="inline-flex w-fit items-center gap-2 text-[0.7rem] uppercase tracking-[0.18em] text-fg/45 transition-colors duration-300 hover:text-gold"
      >
        <ArrowLeft aria-hidden className="size-3.5" strokeWidth={1.8} />
        All bookings
      </Link>

      {/* ---- who ---- */}
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <StatusPill status={booking.status} />
            <span className="tnum text-[0.78rem] text-fg/45">{booking.ref}</span>
          </div>
          <h1 className="mt-3 font-display text-display-md font-light leading-none text-fg">{booking.name}</h1>
          <p className="mt-3 text-[0.85rem] text-fg/55">
            {booking.source === "manual" ? "Added by hand" : "From the website"} ·{" "}
            {new Date(booking.createdAt).toLocaleString("en-GB", {
              weekday: "short",
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "America/New_York",
            })}
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {replyHref && (
            <a
              href={replyHref}
              className="btn-primary inline-flex items-center gap-2 rounded-pill px-5 py-3 font-sans text-[0.68rem] font-semibold uppercase tracking-[0.16em]"
            >
              <Mail aria-hidden className="size-3.5" strokeWidth={1.8} />
              Reply by email
            </a>
          )}
          {booking.phone && (
            <a
              href={`tel:${booking.phone.replace(/[^+\d]/g, "")}`}
              className="glass inline-flex items-center gap-2 rounded-pill px-5 py-3 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-fg/80 transition-colors duration-300 hover:text-gold-light"
            >
              <Phone aria-hidden className="size-3.5" strokeWidth={1.8} />
              Call
            </a>
          )}
        </div>
      </header>

      {booking.source === "website" && !booking.emailed && (
        <p className="flex items-start gap-3 rounded-frame border border-gold/30 bg-gold/[0.07] px-5 py-4 text-[0.84rem] leading-relaxed text-gold-light/90">
          <MailWarning aria-hidden className="mt-0.5 size-4 shrink-0" strokeWidth={1.7} />
          The notification email for this enquiry did not go out, so this page is the only copy. Reply from here.
        </p>
      )}

      <div className="grid gap-4 xl:grid-cols-3">
        {/* ---- main column ---- */}
        <div className="flex min-w-0 flex-col gap-4 xl:col-span-2">
          <Panel title="Where it stands" hint="Tap a stage to move this booking along.">
            <StatusControl id={booking.id} status={booking.status} hints={statusHints} />
          </Panel>

          <Panel title="What they asked for">
            <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
              {facts.map(({ icon: Icon, label, value, extra }) => (
                <div key={label} className="flex min-w-0 gap-3">
                  <Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-gold/60" strokeWidth={1.6} />
                  <div className="min-w-0">
                    <dt className="eyebrow text-[0.58rem] text-fg/40">{label}</dt>
                    <dd className="mt-1 break-words text-[0.9rem] text-fg/90">
                      {value}
                      {extra && <span className="block text-[0.74rem] text-fg/45">{extra}</span>}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>

            {booking.message && (
              <blockquote className="mt-6 whitespace-pre-wrap rounded-xl border-l-2 border-gold/50 bg-fg/[0.03] px-5 py-4 text-[0.92rem] leading-relaxed text-fg/85">
                {booking.message}
              </blockquote>
            )}
          </Panel>

          <details className="glass border-gradient group/edit rounded-frame">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 [&::-webkit-details-marker]:hidden">
              <span>
                <span className="block font-display text-[1.35rem] leading-tight text-fg">Correct the details</span>
                <span className="mt-1 block text-[0.78rem] text-fg/45">A new date, a different head count, a typo in the name.</span>
              </span>
              <ChevronDown
                aria-hidden
                className="size-4 shrink-0 text-fg/40 transition-transform duration-300 group-open/edit:rotate-180"
                strokeWidth={1.8}
              />
            </summary>
            <div className="px-6 pb-6">
              <DetailsForm
                mode="edit"
                id={booking.id}
                initial={{
                  name: booking.name,
                  email: booking.email ?? "",
                  phone: booking.phone ?? "",
                  eventDate: booking.eventDate ?? "",
                  location: booking.location ?? "",
                  guests: booking.guests,
                  experience: booking.experience,
                  budget: booking.budget ?? "",
                  dietary: booking.dietary ?? "",
                  message: booking.message,
                }}
                experiences={experienceOptions.map((value) => ({ value, label: experienceLabels[value] }))}
                budgets={budgetOptions.map((value) => ({ value, label: budgetLabels[value] }))}
              />
            </div>
          </details>
        </div>

        {/* ---- side column ---- */}
        <div className="flex min-w-0 flex-col gap-4">
          <Panel title="Contact">
            <ul className="flex flex-col gap-3 text-[0.88rem]">
              <li className="flex items-center gap-3">
                <Mail aria-hidden className="size-4 shrink-0 text-gold/60" strokeWidth={1.6} />
                {booking.email ? (
                  <>
                    <a href={`mailto:${booking.email}`} className="min-w-0 flex-1 break-all text-fg/85 hover:text-gold-light">
                      {booking.email}
                    </a>
                    <CopyValue value={booking.email} label="email address" />
                  </>
                ) : (
                  <span className="text-fg/35">No email</span>
                )}
              </li>
              <li className="flex items-center gap-3">
                <Phone aria-hidden className="size-4 shrink-0 text-gold/60" strokeWidth={1.6} />
                {booking.phone ? (
                  <>
                    <a
                      href={`tel:${booking.phone.replace(/[^+\d]/g, "")}`}
                      className="min-w-0 flex-1 text-fg/85 hover:text-gold-light"
                    >
                      {booking.phone}
                    </a>
                    <CopyValue value={booking.phone} label="phone number" />
                  </>
                ) : (
                  <span className="text-fg/35">No phone</span>
                )}
              </li>
            </ul>
          </Panel>

          <Panel title="Private notes" hint="Only you can see these.">
            <NotesPanel id={booking.id} notes={booking.notes} />
          </Panel>

          <Panel title="History">
            <ol className="relative flex flex-col gap-4 border-l border-fg/12 pl-5">
              {[...booking.history].reverse().map((event, index) => (
                <li key={`${event.at}-${index}`} className="relative">
                  <span
                    aria-hidden
                    className="absolute -left-[25px] top-1 size-2.5 rounded-full border-2 border-[color:var(--color-chart-surface)] bg-gold/70"
                  />
                  <p className="text-[0.84rem] text-fg/85">
                    {index === booking.history.length - 1
                      ? booking.source === "manual"
                        ? "Added as "
                        : "Received as "
                      : "Moved to "}
                    <span className="font-semibold">{statusLabel[event.status]}</span>
                  </p>
                  <time dateTime={new Date(event.at).toISOString()} className="text-[0.7rem] text-fg/40">
                    {new Date(event.at).toLocaleString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "America/New_York",
                    })}
                  </time>
                </li>
              ))}
            </ol>
          </Panel>

          <div className="px-1">
            <DeleteBooking id={booking.id} name={booking.name} />
          </div>
        </div>
      </div>
    </div>
  );
}
