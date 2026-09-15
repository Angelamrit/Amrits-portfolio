"use client";

import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading } from "@/components/ui/Heading";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="flex min-h-[70vh] items-center bg-bg pt-32 pb-24">
      <Container>
        <Eyebrow>Something went wrong</Eyebrow>
        <Heading as="h1" size="lg" className="mt-8">
          The kitchen hit a snag.
        </Heading>
        <div className="mt-10 flex flex-wrap gap-4">
          <Button onClick={reset}>Try again</Button>
          <Button href="/" variant="glass">
            Back to home
          </Button>
        </div>
      </Container>
    </section>
  );
}
