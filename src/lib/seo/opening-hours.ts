/**
 * Opening hours in the compact form schema.org calls `openingHours`, and the
 * expansion search engines prefer, `openingHoursSpecification`.
 *
 * One rule is a run of days and a time range: "Tu-Su 12:00-22:00". Days are
 * the two-letter English abbreviations, a dash spans a range (wrapping past
 * the weekend if it has to: "Sa-Mo"), a comma lists several, and times are
 * 24-hour. A kitchen that closes after midnight writes "17:00-01:00", which
 * schema.org reads as closing the next morning.
 *
 * Kept free of anything server-only so the dashboard's editor can validate a
 * rule as it is typed with the very same expression the server uses.
 */

const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] as const;
type Day = (typeof DAYS)[number];

const DAY_NAMES: Record<Day, string> = {
  Mo: "Monday",
  Tu: "Tuesday",
  We: "Wednesday",
  Th: "Thursday",
  Fr: "Friday",
  Sa: "Saturday",
  Su: "Sunday",
};

const DAY = "(?:Mo|Tu|We|Th|Fr|Sa|Su)";
const TIME = "(?:[01]\\d|2[0-3]):[0-5]\\d";

/** One rule, e.g. "Tu-Su 12:00-22:00" or "Fr,Sa 17:00-23:30". */
export const OPENING_HOURS_RULE = new RegExp(`^${DAY}(?:-${DAY})?(?:,${DAY}(?:-${DAY})?)* ${TIME}-${TIME}$`);

export type OpeningHoursSpecification = {
  "@type": "OpeningHoursSpecification";
  dayOfWeek: string[];
  opens: string;
  closes: string;
};

function expandDays(spec: string): Day[] {
  const days: Day[] = [];
  for (const part of spec.split(",")) {
    const [from, to] = part.split("-") as [Day, Day | undefined];
    if (!to) {
      days.push(from);
      continue;
    }
    let i = DAYS.indexOf(from);
    const end = DAYS.indexOf(to);
    // Walk forward until the end day, wrapping at Sunday so "Sa-Mo" works.
    for (;;) {
      days.push(DAYS[i]);
      if (i === end) break;
      i = (i + 1) % DAYS.length;
    }
  }
  // A day named twice ("Mo,Mo-Tu") is listed once.
  return [...new Set(days)];
}

/**
 * Expands the rules into schema.org objects. Rules that do not parse are
 * skipped rather than thrown on: the dashboard already refuses to save them,
 * and a page must not fail to render over a typo in the hours.
 */
export function parseOpeningHours(rules: readonly string[]): OpeningHoursSpecification[] {
  const out: OpeningHoursSpecification[] = [];
  for (const raw of rules) {
    const rule = raw.trim();
    if (!OPENING_HOURS_RULE.test(rule)) continue;
    const [days, times] = rule.split(" ");
    const [opens, closes] = times.split("-");
    out.push({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: expandDays(days).map((d) => DAY_NAMES[d]),
      opens,
      closes,
    });
  }
  return out;
}
