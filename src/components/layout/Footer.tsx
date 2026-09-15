import Link from "next/link";
import { site } from "@/data/site";
import { visibleNav } from "@/data/nav";
import { chef } from "@/data/chef";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Orbs } from "@/components/ui/Orbs";
import { Wordmark } from "./Wordmark";

export function Footer() {
  const { restaurant } = site;
  return (
    <footer className="tone-dark relative overflow-hidden bg-brown">
      <span aria-hidden className="hairline-center absolute inset-x-0 top-0" />
      <Orbs variant="subtle" />
      <Container className="relative z-[2] pt-16 md:pt-24">
        <p
          aria-hidden
          className="mask-fade-b select-none whitespace-nowrap font-display text-[clamp(3rem,10.5vw,10rem)] font-light leading-none text-gold-gradient opacity-30"
        >
          Amrit Pal Singh
        </p>

        <div className="mt-6 grid gap-12 md:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Wordmark />
            <p className="mt-8 max-w-sm font-display text-2xl font-light italic text-fg/85">“{chef.philosophy.quote}”</p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-fg/50">
              {chef.title}. {chef.location}.
            </p>
          </div>

          <nav aria-label="Footer" className="lg:col-span-2">
            <h2 className="eyebrow mb-6">Explore</h2>
            <ul className="space-y-3">
              {visibleNav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-fg/70 transition-colors hover:text-gold-light">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="lg:col-span-3">
            <h2 className="eyebrow mb-6">{restaurant.name}</h2>
            <address className="text-sm not-italic leading-relaxed text-fg/70">
              {restaurant.address.street}
              <br />
              {restaurant.address.city}, {restaurant.address.region} {restaurant.address.postal}
            </address>
            <ul className="mt-4 flex flex-wrap gap-2">
              {restaurant.notes.map((n) => (
                <li key={n} className="rounded-pill border border-fg/10 px-3 py-1 text-[0.65rem] uppercase tracking-[0.16em] text-fg/55">
                  {n}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
              <Button href="/angel" variant="link">
                About Angel
              </Button>
              {restaurant.resyUrl && (
                <Button href={restaurant.resyUrl} variant="link">
                  Reserve via Resy
                </Button>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            <h2 className="eyebrow mb-6">Enquiries</h2>
            <p className="text-sm leading-relaxed text-fg/70">Private dining, events and bespoke experiences.</p>
            <Button href={site.cta.href} variant="glass" size="sm" className="mt-6">
              Enquire
            </Button>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-line py-8 text-xs text-fg/45 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {chef.name}. All rights reserved.
          </p>
          <p className="eyebrow text-[0.6rem] text-gold/80">Michelin Guide · Bib Gourmand · Jackson Heights, Queens</p>
        </div>
      </Container>
    </footer>
  );
}
