import { cn } from "@/lib/cn";

type Props = { variant?: "gold" | "ember" | "mixed" | "subtle"; className?: string; pattern?: boolean };

/** Ambient, slowly drifting light behind a section. Purely decorative. */
export function Orbs({ variant = "mixed", className, pattern = false }: Props) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {pattern && <div className="absolute inset-0 grid-pattern" />}
      {(variant === "gold" || variant === "mixed") && (
        <span className="orb orb-gold -left-[10%] top-[-10%] size-[46vw] max-w-[720px] opacity-70" />
      )}
      {(variant === "ember" || variant === "mixed") && (
        <span className="orb orb-ember right-[-12%] top-[30%] size-[40vw] max-w-[640px] opacity-60 animate-float-slow" />
      )}
      {variant === "subtle" && <span className="orb orb-gold left-[30%] top-[10%] size-[40vw] max-w-[600px] opacity-30" />}
      <span className="orb orb-ivory bottom-[-20%] left-[35%] size-[30vw] max-w-[480px] opacity-40 animate-float-slow" />
    </div>
  );
}
