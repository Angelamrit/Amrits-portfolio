import { strict as assert } from "node:assert";
import { describe, it } from "node:test";

/**
 * The dashboard reads visits on the restaurant's clock (New York) while the
 * log is kept in UTC. The conversion is easy to get subtly wrong — an evening
 * visit landing on the next day, or a clock change shifting a whole morning —
 * and a wrong answer looks exactly like a plausible chart.
 */
const { localDay, localHour } = await import("@/lib/analytics/aggregate");

const at = (iso: string) => Date.parse(iso);

describe("reading visits in New York time", () => {
  it("puts an evening visit on the evening, not four hours later", () => {
    // 23:00 UTC in late September is 19:00 in New York (EDT, UTC−4).
    assert.equal(localHour(at("2026-09-28T23:00:00Z")), 19);
    assert.equal(localDay(at("2026-09-28T23:00:00Z")), "2026-09-28");
  });

  it("keeps a late-night visit on the day it happened in New York", () => {
    // Already the 29th in UTC, still the 28th at the restaurant.
    assert.equal(localDay(at("2026-09-29T03:30:00Z")), "2026-09-28");
    assert.equal(localHour(at("2026-09-29T03:30:00Z")), 23);
  });

  it("follows standard time in winter", () => {
    // EST, UTC−5.
    assert.equal(localHour(at("2026-12-15T23:00:00Z")), 18);
  });

  it("gets the autumn clock change right", () => {
    // 1 November 2026: 02:00 EDT falls back to 01:00 EST, so 01:30 happens twice.
    assert.equal(localHour(at("2026-11-01T05:30:00Z")), 1);
    assert.equal(localHour(at("2026-11-01T06:30:00Z")), 1);
    assert.equal(localDay(at("2026-11-01T06:30:00Z")), "2026-11-01");
  });

  it("gets the spring clock change right", () => {
    // 8 March 2026: 02:00 EST jumps to 03:00 EDT, so there is no 02:xx.
    assert.equal(localHour(at("2026-03-08T06:30:00Z")), 1);
    assert.equal(localHour(at("2026-03-08T07:30:00Z")), 3);
  });
});
