import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { format, subDays } from "date-fns";
import { runNewInquiryAutomations } from "@/lib/automation/engine";
import { calculateLeadScore, serializeScoreExplanation } from "@/lib/scoring/lead-score";
import { fetchDashboardData } from "@/lib/analytics/dashboard";
import { serializeInterests } from "@/lib/utils";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const prisma = new PrismaClient();

describe("inquiry → quote → booking flow", () => {
  const email = `integration.flow.${Date.now()}@example.com`;
  let leadId = "";
  let customerId = "";

  beforeAll(async () => {
    const customer = await prisma.customer.create({
      data: {
        firstName: "Integration",
        lastName: "Traveler",
        email,
        phone: "+1-555-222-3333",
        preferredContactMethod: "EMAIL",
      },
    });
    customerId = customer.id;

    const score = calculateLeadScore({
      travelStartDate: new Date("2026-10-01"),
      travelEndDate: new Date("2026-10-08"),
      estimatedBudget: 10000,
      destination: "Japan",
      phone: customer.phone,
      preferredContactMethod: "EMAIL",
      travelerCount: 2,
      specialRequests: "Temple visits and kaiseki dinner assistance.",
      source: "GOOGLE_ADS",
      isReturning: false,
    });

    const lead = await prisma.lead.create({
      data: {
        customerId: customer.id,
        source: "GOOGLE_ADS",
        destination: "Japan",
        travelStartDate: new Date("2026-10-01"),
        travelEndDate: new Date("2026-10-08"),
        travelerCount: 2,
        estimatedBudget: 10000,
        tripType: "CULTURAL",
        interests: serializeInterests(["culture", "local food"]),
        specialRequests: "Temple visits and kaiseki dinner assistance.",
        stage: "NEW",
        score: score.score,
        scoreExplanation: serializeScoreExplanation(score.factors),
        assignedConsultant: "Avery Chen",
      },
    });
    leadId = lead.id;

    await runNewInquiryAutomations(prisma, leadId, {
      score: score.score,
      assignedConsultant: "Avery Chen",
      customerFirstName: "Integration",
    });
  });

  afterAll(async () => {
    if (leadId) {
      await prisma.copilotDraft.deleteMany({ where: { leadId } });
      await prisma.automationRun.deleteMany({ where: { leadId } });
      await prisma.task.deleteMany({ where: { leadId } });
      await prisma.activity.deleteMany({ where: { leadId } });
      await prisma.booking.deleteMany({ where: { leadId } });
      await prisma.quote.deleteMany({ where: { leadId } });
      await prisma.lead.deleteMany({ where: { id: leadId } });
    }
    if (customerId) {
      await prisma.customer.deleteMany({ where: { id: customerId } });
    }
    await prisma.$disconnect();
  });

  it("creates acknowledgment activity and follow-up task for a new inquiry", async () => {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { customer: true, activities: true, tasks: true },
    });
    expect(lead?.customer.email).toBe(email);
    expect(lead?.activities.some((a) => a.type === "ACKNOWLEDGMENT")).toBe(true);
    expect(lead?.tasks.some((t) => t.title === "Initial consultant follow-up")).toBe(true);
  });

  it("persists stage updates, quotes, and bookings coherently", async () => {
    await prisma.lead.update({
      where: { id: leadId },
      data: { stage: "QUALIFIED", firstResponseAt: new Date() },
    });

    await prisma.quote.create({
      data: {
        leadId,
        amount: 11200,
        status: "SENT",
        sentAt: new Date(),
      },
    });
    await prisma.lead.update({
      where: { id: leadId },
      data: { stage: "QUOTE_SENT" },
    });

    await prisma.booking.create({
      data: {
        leadId,
        bookingReference: `INT-${Date.now()}`,
        revenue: 11850,
        bookedAt: new Date(),
      },
    });
    await prisma.lead.update({
      where: { id: leadId },
      data: { stage: "BOOKED" },
    });

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { quotes: true, bookings: true },
    });
    expect(lead?.stage).toBe("BOOKED");
    expect(lead?.quotes.length).toBe(1);
    expect(lead?.bookings.length).toBe(1);
    expect(lead?.bookings[0]?.revenue).toBe(11850);
  });

  it("returns coherent dashboard metrics", async () => {
    const data = await fetchDashboardData({
      start: format(subDays(new Date(), 180), "yyyy-MM-dd"),
      end: format(new Date(), "yyyy-MM-dd"),
      source: "ALL",
      destination: "ALL",
    });
    expect(data.kpis.totalLeads).toBeGreaterThan(0);
    expect(data.funnel.totalLeads).toBe(data.kpis.totalLeads);
    expect(data.recommendations.length).toBeGreaterThan(0);
    expect(data.sourceMetrics.length).toBeGreaterThan(0);
  });
});
