import { describe, expect, it } from "vitest";
import {
  averageFirstResponseHours,
  buildFunnelCounts,
  costPerBooking,
  costPerLead,
  filterByDateRange,
  leadToBookingConversion,
  quoteToBookingConversion,
  returnOnAdSpend,
} from "@/lib/analytics/metrics";
import { safeDivide } from "@/lib/utils";

describe("metric formulas", () => {
  it("computes lead-to-booking and quote-to-booking conversion", () => {
    expect(leadToBookingConversion(100, 25)).toBe(25);
    expect(quoteToBookingConversion(40, 10)).toBe(25);
  });

  it("returns null for unsafe division instead of Infinity/NaN", () => {
    expect(safeDivide(10, 0)).toBeNull();
    expect(costPerLead(1000, 0)).toBeNull();
    expect(costPerBooking(1000, 0)).toBeNull();
    expect(returnOnAdSpend(5000, 0)).toBeNull();
    expect(leadToBookingConversion(0, 0)).toBeNull();
  });

  it("computes average first response hours", () => {
    const created = new Date("2026-07-01T10:00:00Z");
    const hours = averageFirstResponseHours([
      { createdAt: created, firstResponseAt: new Date("2026-07-01T12:00:00Z") },
      { createdAt: created, firstResponseAt: new Date("2026-07-01T14:00:00Z") },
      { createdAt: created, firstResponseAt: null },
    ]);
    expect(hours).toBe(3);
  });

  it("builds funnel counts and qualifies stages correctly", () => {
    const funnel = buildFunnelCounts(
      [
        { stage: "NEW" },
        { stage: "CONTACTED" },
        { stage: "QUALIFIED" },
        { stage: "QUOTE_SENT" },
        { stage: "BOOKED" },
        { stage: "LOST" },
      ],
      [{ id: "b1" }],
      2,
    );
    expect(funnel.totalLeads).toBe(6);
    expect(funnel.qualifiedLeads).toBe(3);
    expect(funnel.quotesSent).toBe(2);
    expect(funnel.confirmedBookings).toBe(1);
  });

  it("filters by date range inclusively", () => {
    const start = new Date("2026-06-01");
    const end = new Date("2026-06-30");
    const items = filterByDateRange(
      [
        { createdAt: new Date("2026-05-31") },
        { createdAt: new Date("2026-06-15") },
        { createdAt: new Date("2026-07-01") },
      ],
      start,
      end,
    );
    expect(items).toHaveLength(1);
  });
});
