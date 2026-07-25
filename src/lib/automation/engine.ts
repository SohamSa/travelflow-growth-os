import { addHours, subHours } from "date-fns";
import type { PrismaClient } from "@prisma/client";

export const RULE_KEYS = {
  NEW_INQUIRY_ACK: "new-inquiry-acknowledgment",
  NEW_INQUIRY_TASK: "new-inquiry-follow-up-task",
  HIGH_PRIORITY: "high-priority-notification",
  UNCONTACTED_OVERDUE: "uncontacted-lead-overdue",
  QUOTE_UNANSWERED: "quote-unanswered-follow-up",
  BOOKING_REVIEW: "booking-review-request",
  PREVIOUS_CUSTOMER: "previous-customer-reengagement",
} as const;

export const DEFAULT_AUTOMATION_RULES = [
  {
    name: "New inquiry acknowledgment",
    trigger: "lead.created",
    action: "Create acknowledgment activity in the lead timeline",
  },
  {
    name: "New inquiry follow-up task",
    trigger: "lead.created",
    action: "Create consultant follow-up task due within SLA window",
  },
  {
    name: "High-priority lead notification",
    trigger: "lead.created && score >= 75",
    action: "Create priority notification activity for the assigned consultant",
  },
  {
    name: "Uncontacted lead overdue reminder",
    trigger: "lead.stage = NEW && no firstResponse past threshold",
    action: "Create overdue reminder activity (idempotent)",
  },
  {
    name: "Quote unanswered follow-up draft",
    trigger: "lead.stage = QUOTE_SENT past threshold without follow-up",
    action: "Create quote follow-up task and activity (idempotent)",
  },
  {
    name: "Booking completed review request",
    trigger: "booking.tripCompletedAt set without review request",
    action: "Create review-request draft activity (idempotent)",
  },
  {
    name: "Previous customer re-engagement",
    trigger: "returning customer with no recent open lead activity",
    action: "Create re-engagement suggestion activity (idempotent)",
  },
] as const;

function followUpHours() {
  return Number(process.env.FOLLOW_UP_HOURS ?? "24");
}

function overdueNewHours() {
  return Number(process.env.OVERDUE_NEW_LEAD_HOURS ?? "48");
}

function overdueQuoteHours() {
  return Number(process.env.OVERDUE_QUOTE_HOURS ?? "72");
}

async function getRule(prisma: PrismaClient, name: string) {
  return prisma.automationRule.findFirst({ where: { name } });
}

async function bumpRule(prisma: PrismaClient, ruleId: string) {
  await prisma.automationRule.update({
    where: { id: ruleId },
    data: { runCount: { increment: 1 }, lastRunAt: new Date() },
  });
}

export async function ensureAutomationRules(prisma: PrismaClient) {
  for (const rule of DEFAULT_AUTOMATION_RULES) {
    const existing = await prisma.automationRule.findFirst({
      where: { name: rule.name },
    });
    if (!existing) {
      await prisma.automationRule.create({
        data: {
          name: rule.name,
          trigger: rule.trigger,
          action: rule.action,
          enabled: true,
          runCount: 0,
        },
      });
    }
  }
}

export async function runNewInquiryAutomations(
  prisma: PrismaClient,
  leadId: string,
  options: { score: number; assignedConsultant: string; customerFirstName: string },
) {
  await ensureAutomationRules(prisma);
  const results: string[] = [];

  const ackRule = await getRule(prisma, DEFAULT_AUTOMATION_RULES[0].name);
  if (ackRule?.enabled) {
    const existing = await prisma.activity.findFirst({
      where: { leadId, type: "ACKNOWLEDGMENT", isAutomated: true },
    });
    if (!existing) {
      await prisma.activity.create({
        data: {
          leadId,
          type: "ACKNOWLEDGMENT",
          title: "Inquiry acknowledged",
          description: `Automated acknowledgment logged for ${options.customerFirstName}. A consultant will follow up shortly. No real email was sent.`,
          channel: "System",
          isAutomated: true,
        },
      });
      await prisma.automationRun.create({
        data: {
          ruleId: ackRule.id,
          leadId,
          status: "SUCCESS",
          summary: "Created acknowledgment activity",
        },
      });
      await bumpRule(prisma, ackRule.id);
      results.push("acknowledgment");
    } else {
      await prisma.automationRun.create({
        data: {
          ruleId: ackRule.id,
          leadId,
          status: "SKIPPED",
          summary: "Acknowledgment already exists",
        },
      });
    }
  }

  const taskRule = await getRule(prisma, DEFAULT_AUTOMATION_RULES[1].name);
  if (taskRule?.enabled) {
    const existingTask = await prisma.task.findFirst({
      where: {
        leadId,
        title: "Initial consultant follow-up",
        completedAt: null,
      },
    });
    if (!existingTask) {
      await prisma.task.create({
        data: {
          leadId,
          title: "Initial consultant follow-up",
          dueAt: addHours(new Date(), followUpHours()),
          priority: options.score >= 75 ? "HIGH" : "MEDIUM",
          assignedTo: options.assignedConsultant,
        },
      });
      await prisma.activity.create({
        data: {
          leadId,
          type: "FOLLOW_UP",
          title: "Follow-up task created",
          description: `Automated follow-up task assigned to ${options.assignedConsultant}.`,
          channel: "System",
          isAutomated: true,
        },
      });
      await prisma.automationRun.create({
        data: {
          ruleId: taskRule.id,
          leadId,
          status: "SUCCESS",
          summary: "Created follow-up task",
        },
      });
      await bumpRule(prisma, taskRule.id);
      results.push("follow-up-task");
    } else {
      await prisma.automationRun.create({
        data: {
          ruleId: taskRule.id,
          leadId,
          status: "SKIPPED",
          summary: "Follow-up task already exists",
        },
      });
    }
  }

  const priorityRule = await getRule(prisma, DEFAULT_AUTOMATION_RULES[2].name);
  if (priorityRule?.enabled && options.score >= 75) {
    const existing = await prisma.activity.findFirst({
      where: { leadId, type: "PRIORITY_NOTIFICATION", isAutomated: true },
    });
    if (!existing) {
      await prisma.activity.create({
        data: {
          leadId,
          type: "PRIORITY_NOTIFICATION",
          title: "High-priority lead notification",
          description: `Lead scored ${options.score}/100. Priority notification recorded for ${options.assignedConsultant}. No real push/SMS was sent.`,
          channel: "System",
          isAutomated: true,
        },
      });
      await prisma.automationRun.create({
        data: {
          ruleId: priorityRule.id,
          leadId,
          status: "SUCCESS",
          summary: "Created high-priority notification",
        },
      });
      await bumpRule(prisma, priorityRule.id);
      results.push("priority-notification");
    }
  }

  return results;
}

export async function evaluateOverdueAutomations(prisma: PrismaClient) {
  await ensureAutomationRules(prisma);
  const now = new Date();
  let actions = 0;

  const overdueRule = await getRule(prisma, DEFAULT_AUTOMATION_RULES[3].name);
  if (overdueRule?.enabled) {
    const threshold = subHours(now, overdueNewHours());
    const overdueLeads = await prisma.lead.findMany({
      where: {
        stage: "NEW",
        firstResponseAt: null,
        createdAt: { lte: threshold },
      },
      take: 100,
    });

    for (const lead of overdueLeads) {
      const existing = await prisma.activity.findFirst({
        where: {
          leadId: lead.id,
          type: "OVERDUE_REMINDER",
          isAutomated: true,
          title: "Uncontacted lead overdue reminder",
        },
      });
      if (existing) continue;

      await prisma.activity.create({
        data: {
          leadId: lead.id,
          type: "OVERDUE_REMINDER",
          title: "Uncontacted lead overdue reminder",
          description: `Lead remained in New without a first response past the ${overdueNewHours()}h threshold.`,
          channel: "System",
          isAutomated: true,
        },
      });
      await prisma.automationRun.create({
        data: {
          ruleId: overdueRule.id,
          leadId: lead.id,
          status: "SUCCESS",
          summary: "Created overdue reminder for uncontacted lead",
        },
      });
      await bumpRule(prisma, overdueRule.id);
      actions += 1;
    }
  }

  const quoteRule = await getRule(prisma, DEFAULT_AUTOMATION_RULES[4].name);
  if (quoteRule?.enabled) {
    const threshold = subHours(now, overdueQuoteHours());
    const quoteLeads = await prisma.lead.findMany({
      where: {
        stage: "QUOTE_SENT",
        quotes: { some: { sentAt: { lte: threshold } } },
      },
      include: { tasks: true },
      take: 100,
    });

    for (const lead of quoteLeads) {
      const hasFollowUp = lead.tasks.some(
        (task) => task.title === "Quote follow-up" && task.completedAt == null,
      );
      const existingActivity = await prisma.activity.findFirst({
        where: {
          leadId: lead.id,
          type: "FOLLOW_UP",
          isAutomated: true,
          title: "Quote unanswered follow-up",
        },
      });
      if (hasFollowUp || existingActivity) continue;

      await prisma.task.create({
        data: {
          leadId: lead.id,
          title: "Quote follow-up",
          dueAt: addHours(now, 24),
          priority: "HIGH",
          assignedTo: lead.assignedConsultant,
        },
      });
      await prisma.activity.create({
        data: {
          leadId: lead.id,
          type: "FOLLOW_UP",
          title: "Quote unanswered follow-up",
          description:
            "Automated reminder to follow up on an unanswered quote. Copilot can draft the message for review.",
          channel: "System",
          isAutomated: true,
        },
      });
      await prisma.automationRun.create({
        data: {
          ruleId: quoteRule.id,
          leadId: lead.id,
          status: "SUCCESS",
          summary: "Created quote follow-up task",
        },
      });
      await bumpRule(prisma, quoteRule.id);
      actions += 1;
    }
  }

  const reviewRule = await getRule(prisma, DEFAULT_AUTOMATION_RULES[5].name);
  if (reviewRule?.enabled) {
    const completed = await prisma.booking.findMany({
      where: { tripCompletedAt: { not: null } },
      include: { lead: true },
      take: 100,
    });

    for (const booking of completed) {
      const existing = await prisma.activity.findFirst({
        where: {
          leadId: booking.leadId,
          type: "REVIEW_REQUEST",
          isAutomated: true,
        },
      });
      if (existing) continue;

      await prisma.activity.create({
        data: {
          leadId: booking.leadId,
          type: "REVIEW_REQUEST",
          title: "Review-request draft suggested",
          description: `Trip ${booking.bookingReference} completed. Draft a review request for employee approval. No message was sent.`,
          channel: "System",
          isAutomated: true,
        },
      });
      await prisma.automationRun.create({
        data: {
          ruleId: reviewRule.id,
          leadId: booking.leadId,
          status: "SUCCESS",
          summary: "Created review-request suggestion",
        },
      });
      await bumpRule(prisma, reviewRule.id);
      actions += 1;
    }
  }

  const reengageRule = await getRule(prisma, DEFAULT_AUTOMATION_RULES[6].name);
  if (reengageRule?.enabled) {
    const returning = await prisma.customer.findMany({
      where: { isReturning: true },
      include: {
        leads: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { activities: true },
        },
      },
      take: 40,
    });

    for (const customer of returning) {
      const latest = customer.leads[0];
      if (!latest || latest.stage === "BOOKED" || latest.stage === "LOST") {
        // Suggest re-engagement on latest closed lead if no prior suggestion
        const targetLead = latest;
        if (!targetLead) continue;
        const existing = await prisma.activity.findFirst({
          where: {
            leadId: targetLead.id,
            type: "REENGAGEMENT",
            isAutomated: true,
          },
        });
        if (existing) continue;

        await prisma.activity.create({
          data: {
            leadId: targetLead.id,
            type: "REENGAGEMENT",
            title: "Previous-customer re-engagement suggestion",
            description: `Suggestion: re-engage ${customer.firstName} ${customer.lastName} with a personalized draft. No message was sent.`,
            channel: "System",
            isAutomated: true,
          },
        });
        await prisma.automationRun.create({
          data: {
            ruleId: reengageRule.id,
            leadId: targetLead.id,
            status: "SUCCESS",
            summary: "Created re-engagement suggestion",
          },
        });
        await bumpRule(prisma, reengageRule.id);
        actions += 1;
      }
    }
  }

  return { actions };
}
