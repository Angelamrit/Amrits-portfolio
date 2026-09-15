import { cn } from "@/lib/cn";

type Props = { className?: string; variant?: "fade" | "full"; vertical?: boolean };

export function GoldRule({ className, variant = "fade", vertical = false }: Props) {
  if (vertical) {
    return (
      <span
        aria-hidden
        className={cn("block w-px bg-gradient-to-b from-gold via-gold/40 to-transparent", className)}
      />
    );
  }
  return <span aria-hidden className={cn("block", variant === "fade" ? "hairline" : "hairline-full", className)} />;
}
