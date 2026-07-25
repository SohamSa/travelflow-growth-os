"use server";

import { revalidatePath } from "next/cache";
import { addDays } from "date-fns";
import { prisma } from "@/lib/db/prisma";
import {
  bookingSchema,
  noteSchema,
  quoteSchema,
  stageUpdateSchema,
  taskSchema,
} from "@/lib/validation/inquiry";

export type ActionResult = { ok: boolean; message: string };

export async function updateStage(formData: FormData): Promise<ActionResult> {
  const parsed = stageUpdateSchema.safeParse({
    leadId: formData.get("leadId"),
    stage: formData.get("stage"),
    lostReason: formData.get("lostReason") || undefined,
  });

  if (!parsed.success) {
    return { ok: false, message: "Invalid stage update." };
  }

  const { leadId, stage, lostReason } = parsed.data;

  if (stage === "LOST" && !lostReason) {
    return { ok: false, message: "Please select a lost reason." };
  }

  const existing = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!existing) {
    return { ok: false, message: "Lead not found." };
  }

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      stage,
      lostReason: stage === "LOST" ? lostReason : null,
      ...(stage !== "NEW" && !existing.firstResponseAt
        ? { firstResponseAt: new Date() }
        : {}),
    },
  });

  await prisma.activity.create({
    data: {
      leadId,
      type: "STAGE_CHANGE",
      title: `Stage updated to ${stage.replaceAll("_", " ")}`,
      description:
        stage === "LOST"
          ? `Lead marked lost: ${lostReason}`
          : `Consultant moved lead to ${stage.replaceAll("_", " ")}.`,
    },
  });

  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/dashboard");

  return { ok: true, message: `Lead stage updated to ${stage.replaceAll("_", " ")}.` };
}

export async function addNote(formData: FormData): Promise<ActionResult> {
  const parsed = noteSchema.safeParse({
    leadId: formData.get("leadId"),
    note: formData.get("note"),
  });

  if (!parsed.success) {
    return { ok: false, message: "Note cannot be empty." };
  }

  await prisma.activity.create({
    data: {
      leadId: parsed.data.leadId,
      type: "NOTE",
      title: "Consultant note",
      description: parsed.data.note,
      channel: "Internal",
    },
  });

  revalidatePath(`/leads/${parsed.data.leadId}`);
  return { ok: true, message: "Note added to timeline." };
}

export async function createTask(formData: FormData): Promise<ActionResult> {
  const parsed = taskSchema.safeParse({
    leadId: formData.get("leadId"),
    title: formData.get("title"),
    dueAt: formData.get("dueAt"),
    priority: formData.get("priority") ?? "MEDIUM",
    assignedTo: formData.get("assignedTo"),
  });

  if (!parsed.success) {
    return { ok: false, message: "Invalid task details." };
  }

  await prisma.task.create({
    data: {
      leadId: parsed.data.leadId,
      title: parsed.data.title,
      dueAt: new Date(parsed.data.dueAt),
      priority: parsed.data.priority,
      assignedTo: parsed.data.assignedTo,
    },
  });

  revalidatePath(`/leads/${parsed.data.leadId}`);
  return { ok: true, message: "Task created." };
}

export async function completeTask(formData: FormData): Promise<ActionResult> {
  const taskId = String(formData.get("taskId") ?? "");
  const leadId = String(formData.get("leadId") ?? "");

  if (!taskId || !leadId) {
    return { ok: false, message: "Task not found." };
  }

  await prisma.task.update({
    where: { id: taskId },
    data: { completedAt: new Date() },
  });

  revalidatePath(`/leads/${leadId}`);
  return { ok: true, message: "Task marked complete." };
}

export async function createQuote(formData: FormData): Promise<ActionResult> {
  const parsed = quoteSchema.safeParse({
    leadId: formData.get("leadId"),
    amount: formData.get("amount"),
  });

  if (!parsed.success) {
    return { ok: false, message: "Invalid quote amount." };
  }

  const sentAt = new Date();
  await prisma.quote.create({
    data: {
      leadId: parsed.data.leadId,
      amount: parsed.data.amount,
      status: "SENT",
      sentAt,
      expiresAt: addDays(sentAt, 14),
    },
  });

  await prisma.lead.update({
    where: { id: parsed.data.leadId },
    data: { stage: "QUOTE_SENT" },
  });

  await prisma.activity.create({
    data: {
      leadId: parsed.data.leadId,
      type: "QUOTE",
      title: "Quote sent",
      description: `Quote for $${parsed.data.amount.toLocaleString("en-US")} sent to customer.`,
      channel: "Email draft",
    },
  });

  revalidatePath(`/leads/${parsed.data.leadId}`);
  revalidatePath("/leads");
  revalidatePath("/dashboard");

  return { ok: true, message: "Quote recorded and stage updated." };
}

export async function recordBooking(formData: FormData): Promise<ActionResult> {
  const parsed = bookingSchema.safeParse({
    leadId: formData.get("leadId"),
    revenue: formData.get("revenue"),
    bookingReference: formData.get("bookingReference") || undefined,
  });

  if (!parsed.success) {
    return { ok: false, message: "Invalid booking details." };
  }

  const ref =
    parsed.data.bookingReference ??
    `HT-${Date.now().toString(36).toUpperCase().slice(-6)}`;

  await prisma.booking.create({
    data: {
      leadId: parsed.data.leadId,
      revenue: parsed.data.revenue,
      bookingReference: ref,
      bookedAt: new Date(),
    },
  });

  await prisma.lead.update({
    where: { id: parsed.data.leadId },
    data: { stage: "BOOKED" },
  });

  await prisma.activity.create({
    data: {
      leadId: parsed.data.leadId,
      type: "BOOKING",
      title: "Booking confirmed",
      description: `Booking ${ref} recorded with revenue $${parsed.data.revenue.toLocaleString("en-US")}.`,
      channel: "Internal",
    },
  });

  revalidatePath(`/leads/${parsed.data.leadId}`);
  revalidatePath("/leads");
  revalidatePath("/dashboard");

  return { ok: true, message: `Booking ${ref} recorded.` };
}
