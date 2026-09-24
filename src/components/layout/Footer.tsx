import Link from "next/link";
import { ArrowUpRight, Code2, Compass, Globe } from "lucide-react";
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
import { Orbs } from "@/components/ui/Orbs";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { Wordmark } from "./Wordmark";
import { BackToTop, LocalTime, SignatureName } from "./FooterClient";

/**
 * The two credit cards that replaced the single "Recognition" card: one for
 * the restaurant's own web presence, one for the studio that built this site.
 * Not sourced from `site` data since neither is about the chef himself.
 */
const externalLinkCards = [
  {
    id: "angel",
    title: "Angel Indian Restaurant",
    icon: Globe,
    links: [
      { kind: "web", label: "Official website", href: "https://www.angelindianrestaurant.com/" },
      { kind: "instagram", label: "Instagram", href: "https://www.instagram.com/angel_indian_restaurant" },
    ],
  },
  {
    id: "studio",
    title: "Aceva Tech",
    icon: Code2,
    links: [
      { kind: "web", label: "Website", href: "https://acevatech.com/" },
      { kind: "instagram", label: "Instagram", href: "https://www.instagram.com/acevatechnology" },
    ],
  },
] as const;

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
    <footer aria-labelledby="footer-heading" className="section-lazy tone-dark grain relative overflow-hidden bg-gradient-to-b from-brown to-brown-deep">
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
        <div>
          <div>
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
                <Button href={restaurant.resyUrl ?? site.cta.href}>{site.cta.label}</Button>
                <Button href="/contact" variant="glass">
                  Get in touch
                </Button>
              </div>
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
            <SpotlightCard as="nav" aria-label="Footer" className="group/card relative h-full overflow-hidden p-7 md:p-8">
              <span aria-hidden className="orb orb-gold -right-[35%] -top-[30%] size-[75%] opacity-25" />
              <div className="relative">
                <CardHeader title="Explore" icon={<Compass className="size-4" strokeWidth={1.5} />} />
                {/* No dividers: the rows are separated by space and lit on hover
                    instead, which keeps the resting state quiet. */}
                <ul className="mt-5 grid gap-0.5">
                  {visibleNav.map((item, i) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="group/link relative flex items-center gap-3 overflow-hidden rounded-[0.9rem] px-3 py-2 transition-colors duration-500 ease-luxe hover:bg-gold/[0.07]"
                      >
                        {/* Gold rule that grows out of the left edge on hover. */}
                        <span
                          aria-hidden
                          className="absolute left-0 top-1/2 h-0 w-px -translate-y-1/2 rounded-full bg-gradient-to-b from-gold-light to-gold-deep shadow-[0_0_10px_rgba(226,189,108,0.9)] transition-all duration-500 ease-luxe group-hover/link:h-1/2"
                        />
                        <span
                          aria-hidden
                          className="pointer-events-none absolute inset-y-0 -left-2/3 w-2/3 -skew-x-12 bg-gradient-to-r from-transparent via-gold/15 to-transparent transition-all duration-700 ease-luxe group-hover/link:left-full"
                        />
                        <span className="relative font-display text-sm italic text-gold-gradient opacity-60 transition-opacity duration-500 ease-luxe group-hover/link:opacity-100">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="relative font-display text-xl leading-none text-fg/85 transition-all duration-500 ease-luxe group-hover/link:translate-x-0.5 group-hover/link:text-gold-light">
                          {item.label}
                        </span>
                        <ArrowUpRight
                          aria-hidden
                          className="relative ml-auto size-3.5 -translate-x-1.5 text-gold-light opacity-0 transition-all duration-500 ease-luxe group-hover/link:translate-x-0 group-hover/link:opacity-100"
                          strokeWidth={1.75}
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </SpotlightCard>
          </RevealItem>

          <RevealItem className="flex flex-col gap-4 lg:col-span-4">
            {externalLinkCards.map((card) => (
              <SpotlightCard
                key={card.id}
                as="nav"
                aria-label={card.title}
                className="group/card flex flex-1 flex-col justify-center p-6 md:p-7"
              >
                <CardHeader title={card.title} icon={<card.icon className="size-4" strokeWidth={1.5} />} />
                <ul className="mt-5 grid gap-2.5">
                  {card.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group/link relative flex items-center gap-3 overflow-hidden rounded-[1.15rem] border border-gold/20 bg-gold/[0.04] px-3.5 py-3 transition-all duration-500 ease-luxe hover:border-gold/55 hover:bg-gold/[0.09] hover:shadow-glow"
                      >
                        {/* A band of light that crosses the tile on hover. */}
                        <span
                          aria-hidden
                          className="pointer-events-none absolute inset-y-0 -left-2/3 w-2/3 -skew-x-12 bg-gradient-to-r from-transparent via-gold/20 to-transparent transition-all duration-700 ease-luxe group-hover/link:left-full"
                        />
                        <span className="relative grid size-9 shrink-0 place-items-center rounded-full border border-gold/40 bg-gold/10 text-gold shadow-[0_0_18px_-8px_rgba(226,189,108,0.8)] transition-all duration-500 ease-luxe group-hover/link:border-gold group-hover/link:bg-gradient-to-br group-hover/link:from-gold-light group-hover/link:to-gold-deep group-hover/link:text-charcoal group-hover/link:shadow-glow">
                          {link.kind === "instagram" ? (
                            <InstagramIcon className="size-4" />
                          ) : (
                            <Globe aria-hidden className="size-4" strokeWidth={1.5} />
                          )}
                        </span>
                        <span className="relative font-display text-base leading-none text-fg/85 transition-colors duration-500 ease-luxe group-hover/link:text-gold-light">
                          {link.label}
                        </span>
                        <ArrowUpRight
                          aria-hidden
                          className="relative ml-auto size-3.5 -translate-x-1.5 text-gold-light opacity-0 transition-all duration-500 ease-luxe group-hover/link:translate-x-0 group-hover/link:opacity-100"
                          strokeWidth={1.75}
                        />
                      </a>
                    </li>
                  ))}
                </ul>
              </SpotlightCard>
            ))}
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
