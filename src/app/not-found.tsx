import { SiteShell } from "@/components/layout/SiteShell";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading, Em } from "@/components/ui/Heading";
import { Orbs } from "@/components/ui/Orbs";

/**
 * Rendered for any URL that matches no route. It sits at the app root rather
 * than inside the `(site)` group — that is what makes it the catch-all — so it
 * has to bring the site chrome with it, or a mistyped address would land on a
 * page with no header, no footer and no way back into the site.
 */
export default function NotFound() {
  return (
    <SiteShell>
      <section className="relative flex min-h-[70vh] items-center overflow-hidden surface-gold pt-32 pb-24">
        <Orbs variant="mixed" pattern />
        <Container className="relative z-[2]">
          <Eyebrow>404</Eyebrow>
          <Heading as="h1" size="lg" className="mt-8">
            This table <Em>isn&rsquo;t set.</Em>
          </Heading>
          <p className="mt-6 max-w-md text-lead text-fg/65">
            The page you were looking for has moved or never existed.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Button href="/">Back to home</Button>
            <Button href="/contact" variant="glass">
              Book a private experience
            </Button>
          </div>
        </Container>
      </section>
    </SiteShell>
  );
}
