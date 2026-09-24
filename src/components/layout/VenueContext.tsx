"use client";

import { createContext, useContext, type ReactNode } from "react";
import { site } from "@/data/site";
import type { VenueDetails } from "@/lib/content/venue";

/**
 * The restaurant's details, made available to the client parts of the site.
 *
 * The header bar, the mobile menu and the menu card all print the address
 * and the reservation link, and all three are client components — they cannot
 * await a lookup. Threading the details down as props would mean four
 * components and their parents all carrying a prop they only pass along.
 *
 * So the `(site)` layout reads the details once on the server and puts them
 * here. The default is the version in `src/data/site.ts`, which means anything
 * rendered outside the provider still shows the real address rather than
 * nothing — a safe fallback rather than a blank line in the footer.
 */

const fallback: VenueDetails = {
  ...site.restaurant,
  social: site.social,
  contactEmail: site.contactEmail,
};

const VenueContext = createContext<VenueDetails>(fallback);

export function VenueProvider({ value, children }: { value: VenueDetails; children: ReactNode }) {
  return <VenueContext.Provider value={value}>{children}</VenueContext.Provider>;
}

export function useVenue(): VenueDetails {
  return useContext(VenueContext);
}
