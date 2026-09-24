import { cn } from "@/lib/cn";
import { Counter } from "./Counter";

export type StatItem = { value: string; label: string };

/** Parses "20+" → count 20 with suffix "+", "2019" → 2019; text values render as-is. */
function StatValue({ value, className }: { value: string; className?: string }) {
  const m = value.match(/^(\D*)(\d[\d,]*)(\D*)$/);
  if (!m) return <span className={className}>{value}</span>;
  const [, prefix, num, suffix] = m;
  return <Counter to={Number(num.replace(/,/g, ""))} prefix={prefix} suffix={suffix} separator={num.includes(",")} className={className} />;
}

export function Stat({ value, label, className }: StatItem & { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <StatValue value={value} className="font-display text-display-sm font-light leading-none text-gold-gradient" />
      <span className="eyebrow text-muted">{label}</span>
    </div>
  );
}

export function StatRow({ stats, className, glass = false }: { stats: StatItem[]; className?: string; glass?: boolean }) {
  return (
    <dl
      className={cn(
        "grid grid-cols-3 gap-4",
        glass ? "rounded-frame glass p-5 md:p-7" : "border-t border-line pt-8",
        className,
      )}
    >
      {stats.map((s) => (
        <div key={s.label} className="flex min-w-0 flex-col gap-2">
          <dd className="order-1 font-display text-display-sm font-light leading-none">
            <StatValue value={s.value} className="text-gold-gradient" />
          </dd>
          {/* Three columns on a phone leave ~90px each; the eyebrow's wide tracking
              would push words like "Publications" into the next column. */}
          <dt className="order-2 eyebrow text-muted [overflow-wrap:anywhere] max-sm:text-[0.56rem] max-sm:tracking-[0.12em]">{s.label}</dt>
        </div>
      ))}
    </dl>
  );
}
