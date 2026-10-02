import test from "node:test";
import assert from "node:assert/strict";
import { OPENING_HOURS_RULE, parseOpeningHours } from "@/lib/seo/opening-hours";

test("a day range expands to every day in it, named in full", () => {
  assert.deepEqual(parseOpeningHours(["Tu-Su 12:00-22:00"]), [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      opens: "12:00",
      closes: "22:00",
    },
  ]);
});

test("a list of days, a single day and a range wrapping the weekend all parse", () => {
  const [list, single, wrapped] = parseOpeningHours(["Fr,Sa 17:00-23:30", "Mo 11:00-15:00", "Sa-Mo 10:00-14:00"]);
  assert.deepEqual(list.dayOfWeek, ["Friday", "Saturday"]);
  assert.equal(list.closes, "23:30");
  assert.deepEqual(single.dayOfWeek, ["Monday"]);
  assert.deepEqual(wrapped.dayOfWeek, ["Saturday", "Sunday", "Monday"]);
});

test("rules that do not parse are skipped, not thrown on", () => {
  assert.deepEqual(parseOpeningHours(["Dinner only", "", "Tue-Sun 12-10"]), []);
  assert.equal(parseOpeningHours([" Tu-Su 12:00-22:00 ", "nonsense"]).length, 1);
});

test("the validator the dashboard uses agrees with the parser", () => {
  for (const good of ["Tu-Su 12:00-22:00", "Mo 00:00-23:59", "Fr,Sa 17:00-01:00", "Mo-We,Fr 09:30-17:00"]) {
    assert.equal(OPENING_HOURS_RULE.test(good), true, good);
  }
  for (const bad of ["Tu-Su 12:00 - 22:00", "Tu-Su 24:00-22:00", "Monday 12:00-22:00", "Tu-Su", "12:00-22:00", "Tu-Su 12:00-22:00 extra"]) {
    assert.equal(OPENING_HOURS_RULE.test(bad), false, bad);
  }
});
