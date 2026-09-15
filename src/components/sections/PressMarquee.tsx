import { pressMarquee } from "@/data/press";
import { Marquee } from "@/components/ui/Marquee";

export function PressMarquee() {
  return (
    <div className="relative bg-bg">
      <Marquee items={pressMarquee} speed="slow" className="border-t-0" />
    </div>
  );
}
