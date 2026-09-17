import { pressMarquee } from "@/data/press";
import { Marquee } from "@/components/ui/Marquee";

export function PressMarquee() {
  return (
    <div className="relative surface-gold">
      <Marquee items={pressMarquee} speed="slow" className="border-t-0" />
    </div>
  );
}
