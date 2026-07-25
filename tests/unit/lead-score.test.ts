import { describe, expect, it } from "vitest";
import { calculateLeadScore } from "@/lib/scoring/lead-score";

describe("calculateLeadScore", () => {
  it("scores a complete high-intent referral lead as High priority", () => {
    const result = calculateLeadScore({
      travelStartDate: new Date("2026-09-01"),
      travelEndDate: new Date("2026-09-08"),
      estimatedBudget: 9000,
      destination: "Italy",
      phone: "+1-555-0100",
      preferredContactMethod: "EMAIL",
      travelerCount: 2,
      specialRequests:
        "Anniversary trip with boutique stays, cooking class, and a scenic countryside day.",
      source: "REFERRAL",
      isReturning: true,
      now: new Date("2026-07-24"),
    });

    expect(result.score).toBeGreaterThanOrEqual(75);
    expect(result.priority).toBe("High");
    expect(result.factors.length).toBeGreaterThan(5);
  });

  it("scores a sparse lead as Standard priority", () => {
    const result = calculateLeadScore({
      destination: "Mexico",
      travelerCount: 1,
      source: "INSTAGRAM",
      now: new Date("2026-07-24"),
    });

    expect(result.score).toBeLessThan(45);
    expect(result.priority).toBe("Standard");
  });

  it("never exceeds 100", () => {
    const result = calculateLeadScore({
      travelStartDate: new Date("2026-08-01"),
      travelEndDate: new Date("2026-08-08"),
      estimatedBudget: 20000,
      destination: "Japan",
      phone: "+1-555-9999",
      preferredContactMethod: "PHONE",
      travelerCount: 4,
      specialRequests: "A".repeat(80),
      source: "REFERRAL",
      isReturning: true,
      now: new Date("2026-07-24"),
    });
    expect(result.score).toBeLessThanOrEqual(100);
  });
});
