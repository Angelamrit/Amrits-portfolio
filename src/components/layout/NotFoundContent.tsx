import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading, Em } from "@/components/ui/Heading";
import { Orbs } from "@/components/ui/Orbs";

/** The body of the 404 page, shared by the site's two not-found files. */
export function NotFoundContent() {
  return (
    <section className="relative flex min-h-[70vh] items-center overflow-hidden surface-gold pt-32 pb-24">
      <Orbs variant="mixed" pattern />
      <Container className="relative z-[2]">
        <Eyebrow>404</Eyebrow>
        <Heading as="h1" size="lg" className="mt-8">
          This table <Em>isn&rsquo;t set.</Em>
        </Heading>
        <p className="mt-6 max-w-md text-lead text-fg/65">The page you were looking for has moved or never existed.</p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Button href="/">Back to home</Button>
          <Button href="/menus" variant="glass">
            Explore the menu
          </Button>
        </div>
      </Container>
    </section>
  );
}
