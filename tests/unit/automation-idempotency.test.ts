import { beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  evaluateOverdueAutomations,
  runNewInquiryAutomations,
} from "@/lib/automation/engine";

const prisma = new PrismaClient();

describe("automation idempotency", () => {
  let leadId: string;

  beforeAll(async () => {
    const customer = await prisma.customer.upsert({
      where: { email: "automation.idempotency@example.com" },
      update: {},
      create: {
        firstName: "Auto",
        lastName: "Test",
        email: "automation.idempotency@example.com",
        phone: "+1-555-0000",
        preferredContactMethod: "EMAIL",
      },
    });

    const lead = await prisma.lead.create({
      data: {
        customerId: customer.id,
        source: "DIRECT",
        destination: "France",
        travelerCount: 2,
        tripType: "CULTURAL",
        interests: JSON.stringify(["culture"]),
        stage: "NEW",
        score: 80,
        scoreExplanation: JSON.stringify(["test"]),
        assignedConsultant: "Avery Chen",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72),
      },
    });
    leadId = lead.id;
  });

  it("does not duplicate acknowledgment or follow-up task on second run", async () => {
    await runNewInquiryAutomations(prisma, leadId, {
      score: 80,
      assignedConsultant: "Avery Chen",
      customerFirstName: "Auto",
    });
    await runNewInquiryAutomations(prisma, leadId, {
      score: 80,
      assignedConsultant: "Avery Chen",
      customerFirstName: "Auto",
    });

    const acknowledgments = await prisma.activity.count({
      where: { leadId, type: "ACKNOWLEDGMENT", isAutomated: true },
    });
    const tasks = await prisma.task.count({
      where: { leadId, title: "Initial consultant follow-up" },
    });
    const priority = await prisma.activity.count({
      where: { leadId, type: "PRIORITY_NOTIFICATION", isAutomated: true },
    });

    expect(acknowledgments).toBe(1);
    expect(tasks).toBe(1);
    expect(priority).toBe(1);
  });

  it("does not duplicate overdue reminders when evaluator runs twice", async () => {
    await evaluateOverdueAutomations(prisma);
    await evaluateOverdueAutomations(prisma);

    const reminders = await prisma.activity.count({
      where: {
        leadId,
        type: "OVERDUE_REMINDER",
        title: "Uncontacted lead overdue reminder",
        isAutomated: true,
      },
    });
    expect(reminders).toBe(1);
  });
});
