import Link from "next/link";
import { ArrowUpRight, Award } from "lucide-react";
import { site } from "@/data/site";
import { visibleNav } from "@/data/nav";
import { chef } from "@/data/chef";
import { images } from "@/data/images";
import { Button } from "@/components/ui/Button";
import { CardHeader } from "@/components/ui/CardHeader";
import { Container } from "@/components/ui/Container";
import { Embers } from "@/components/ui/Embers";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Em } from "@/components/ui/Heading";
import { ImageFrame } from "@/components/ui/ImageFrame";
import { NeighborhoodMap } from "@/components/ui/NeighborhoodMap";
import { Medallion } from "@/components/ui/Medallion";
import { Orbs } from "@/components/ui/Orbs";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { Stat } from "@/components/ui/Stat";
import { Wordmark } from "./Wordmark";
import { BackToTop, LocalTime, SignatureName } from "./FooterClient";

/* Lucide dropped its brand glyphs in v1, so the two social marks live here as plain strokes. */
const socialSvg = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" } as const;

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg {...socialSvg} className={className} aria-hidden>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg {...socialSvg} className={className} aria-hidden>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

export function Footer() {
  const { restaurant, social } = site;
  const year = new Date().getFullYear();
  const socials = [
    social.instagram && { label: "Instagram", href: social.instagram, Icon: InstagramIcon },
    social.facebook && { label: "Facebook", href: social.facebook, Icon: FacebookIcon },
  ].filter((s): s is { label: string; href: string; Icon: typeof InstagramIcon } => Boolean(s));

  return (
    <footer aria-labelledby="footer-heading" className="tone-dark grain relative overflow-hidden bg-gradient-to-b from-brown to-brown-deep">
      <span aria-hidden className="hairline-center absolute inset-x-0 top-0 z-[3]" />

      {/* The dining room at night, barely there, fading out before the cards begin. */}
      <div aria-hidden className="mask-fade-b absolute inset-x-0 top-0 h-[72%]">
        <ImageFrame image={images.angelDiningRoom} ratio="fill" reveal="fade" sizes="100vw" quality={65} imgClassName="opacity-[0.14] saturate-[0.8]" />
        <div className="absolute inset-0 bg-gradient-to-b from-brown/60 via-transparent to-brown-deep" />
      </div>
      <div aria-hidden className="panel-pattern absolute inset-0" />
      <Orbs variant="mixed" />
      <Embers count={12} className="opacity-70" />

      <Container className="relative z-[2] pt-20 md:pt-28">
        {/* ---- The invitation ---- */}
        <div className="grid gap-12 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <Reveal>
              <Eyebrow>
                {restaurant.name} · {restaurant.address.city}
              </Eyebrow>
            </Reveal>
            <Reveal delay={0.1}>
              <h2 id="footer-heading" className="mt-8 font-display text-display-lg font-light leading-[0.98] text-fg">
                Your table is <Em shimmer>waiting.</Em>
              </h2>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="mt-10 flex flex-wrap gap-4">
                <Button href={site.cta.href}>{site.cta.label}</Button>
                {restaurant.resyUrl && (
                  <Button href={restaurant.resyUrl} variant="outline">
                    Reserve at Angel
                  </Button>
                )}
              </div>
            </Reveal>
          </div>
          <div className="hidden lg:col-span-4 lg:flex lg:justify-end">
            <Reveal delay={0.3}>
              <Medallion text="Michelin Bib Gourmand · Est. 2019 · Simple but good · " size={200} className="text-gold-light">
                <span className="font-display text-6xl font-light italic leading-none text-gold-gradient">A</span>
              </Medallion>
            </Reveal>
          </div>
        </div>

        {/* ---- Visit · Explore · Recognition ---- */}
        <RevealGroup className="mt-16 grid gap-4 md:grid-cols-2 lg:mt-20 lg:grid-cols-12">
          <RevealItem className="md:col-span-2 lg:col-span-5">
            <SpotlightCard
              as="section"
              tilt={2}
              aria-label={`${restaurant.name}, ${restaurant.address.street}, ${restaurant.address.city}`}
              className="group/card relative flex h-full min-h-[22rem] flex-col overflow-hidden p-0 sm:min-h-[26rem] md:min-h-[28rem] lg:min-h-0"
            >
              {/* flex-1: the map takes whatever height the row gives the card,
                  which is set by the Explore column beside it. */}
              <NeighborhoodMap className="flex-1" />
              <div className="relative mt-auto flex flex-wrap items-center justify-between gap-4 border-t border-line px-7 py-5 md:px-8">
                <p className="eyebrow text-[0.55rem] text-fg/50">{restaurant.hours}</p>
                {restaurant.mapsUrl && (
                  <Button href={restaurant.mapsUrl} variant="link">
                    Get directions
                  </Button>
                )}
              </div>
            </SpotlightCard>
          </RevealItem>

          <RevealItem className="lg:col-span-3">
            <SpotlightCard as="nav" aria-label="Footer" className="group/card h-full p-7 md:p-8">
              <CardHeader title="Explore" icon={<ArrowUpRight className="size-4" strokeWidth={1.5} />} />
              <ul className="mt-5 divide-y divide-line">
                {visibleNav.map((item, i) => (
                  <li key={item.href}>
                    <Link href={item.href} className="group/link flex items-center justify-between gap-4 py-2.5">
                      <span className="flex items-baseline gap-3">
                        <span className="font-sans text-[0.55rem] font-semibold tracking-[0.2em] text-gold/50 transition-colors duration-500 group-hover/link:text-gold">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="font-display text-xl leading-none text-fg/85 transition-all duration-500 ease-luxe group-hover/link:translate-x-1 group-hover/link:text-gold-light">
                          {item.label}
                        </span>
                      </span>
                      <ArrowUpRight
                        aria-hidden
                        className="size-3.5 -translate-x-1.5 text-gold-light opacity-0 transition-all duration-500 ease-luxe group-hover/link:translate-x-0 group-hover/link:opacity-100"
                        strokeWidth={1.75}
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </SpotlightCard>
          </RevealItem>

          <RevealItem className="lg:col-span-4">
            <SpotlightCard as="section" aria-labelledby="footer-recognition" className="group/card flex h-full flex-col p-7 md:p-8">
              <CardHeader id="footer-recognition" title="Recognition" icon={<Award className="size-4" strokeWidth={1.5} />} />
              <div className="my-auto grid grid-cols-3 gap-4 py-8">
                {chef.stats.map((s) => (
                  <Stat key={s.label} {...s} />
                ))}
              </div>
            </SpotlightCard>
          </RevealItem>
        </RevealGroup>

        {/* ---- Signature ---- */}
        <SignatureName name={chef.name} className="mt-16 lg:mt-20" />

        {/* ---- Bottom bar ---- */}
        <div className="relative flex flex-col gap-6 border-t border-line py-8 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <Wordmark compact />
            <p className="text-xs text-fg/45">
              © {year} {chef.name}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <LocalTime place={restaurant.address.city} />
            {socials.length > 0 && (
              <ul className="flex items-center gap-2" aria-label="Social">
                {socials.map(({ label, href, Icon }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="grid size-11 place-items-center rounded-full border border-fg/12 text-fg/70 transition-all duration-500 ease-luxe hover:border-gold/60 hover:text-gold-light hover:shadow-glow"
                    >
                      <Icon className="size-4" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
            <BackToTop />
          </div>
        </div>
      </Container>
    </footer>
  );
}
