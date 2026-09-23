import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { budgetLabels, budgetOptions, experienceLabels, experienceOptions } from "@/lib/validation/inquiry";
import { PageHeading } from "@/components/admin/PageHeading";
import { Panel } from "@/components/admin/Panel";
import { DetailsForm } from "@/components/admin/bookings/DetailsForm";

export const metadata: Metadata = { title: "Add a booking" };

/** For the enquiries that never touch the website: a phone call, a guest at the pass, a friend of a friend. */
export default function NewBookingPage() {
  return (
    <div className="flex flex-col gap-8">
      <Link
        href="/admin/bookings"
        className="inline-flex w-fit items-center gap-2 text-[0.7rem] uppercase tracking-[0.18em] text-fg/45 transition-colors duration-300 hover:text-gold"
      >
        <ArrowLeft aria-hidden className="size-3.5" strokeWidth={1.8} />
        All bookings
      </Link>

      <PageHeading
        eyebrow="Guests"
        title="Add a booking"
        description="For a booking taken by phone or in person, so everything is in one list."
      />

      <Panel title="The booking">
        <DetailsForm
          mode="create"
          initial={{
            name: "",
            email: "",
            phone: "",
            eventDate: "",
            location: "",
            guests: 0,
            experience: "private-dining",
            budget: "",
            dietary: "",
            message: "",
          }}
          experiences={experienceOptions.map((value) => ({ value, label: experienceLabels[value] }))}
          budgets={budgetOptions.map((value) => ({ value, label: budgetLabels[value] }))}
        />
      </Panel>
    </div>
  );
}
