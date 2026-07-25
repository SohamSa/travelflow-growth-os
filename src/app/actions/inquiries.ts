"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { runNewInquiryAutomations } from "@/lib/automation/engine";
import { calculateLeadScore, serializeScoreExplanation } from "@/lib/scoring/lead-score";
import { inquirySchema, type InquiryInput } from "@/lib/validation/inquiry";
import { serializeInterests } from "@/lib/utils";
import { CONSULTANTS } from "@/types";

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts[0] ?? "Guest";
  const lastName = parts.slice(1).join(" ") || "Traveler";
  return { firstName, lastName };
}

function pickConsultant(): string {
  const index = Math.floor(Math.random() * CONSULTANTS.length);
  return CONSULTANTS[index] ?? CONSULTANTS[0];
}

export type InquiryActionState = {
  ok: boolean;
  message?: string;
  leadId?: string;
  errors?: Record<string, string[]>;
};

export async function createInquiry(
  _prev: InquiryActionState,
  formData: FormData,
): Promise<InquiryActionState> {
  const raw = {
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    preferredDestination: formData.get("preferredDestination"),
    travelStartDate: formData.get("travelStartDate"),
    travelEndDate: formData.get("travelEndDate"),
    travelerCount: formData.get("travelerCount"),
    estimatedBudget: formData.get("estimatedBudget"),
    tripType: formData.get("tripType"),
    interests: formData.getAll("interests"),
    specialRequests: formData.get("specialRequests") ?? "",
    preferredContactMethod: formData.get("preferredContactMethod"),
    marketingSource: formData.get("marketingSource"),
    consent: formData.get("consent") === "on" ? true : formData.get("consent"),
  };

  const parsed = inquirySchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const data: InquiryInput = parsed.data;
  const { firstName, lastName } = splitName(data.fullName);
  const assignedConsultant = pickConsultant();

  const existingCustomer = await prisma.customer.findUnique({
    where: { email: data.email.toLowerCase() },
  });

  const customer =
    existingCustomer ??
    (await prisma.customer.create({
      data: {
        firstName,
        lastName,
        email: data.email.toLowerCase(),
        phone: data.phone,
        preferredContactMethod: data.preferredContactMethod,
        isReturning: false,
      },
    }));

  if (existingCustomer) {
    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        phone: data.phone,
        preferredContactMethod: data.preferredContactMethod,
      },
    });
  }

  const travelStartDate = new Date(data.travelStartDate);
  const travelEndDate = new Date(data.travelEndDate);

  const scoreResult = calculateLeadScore({
    travelStartDate,
    travelEndDate,
    estimatedBudget: data.estimatedBudget,
    destination: data.preferredDestination,
    phone: data.phone,
    preferredContactMethod: data.preferredContactMethod,
    travelerCount: data.travelerCount,
    specialRequests: data.specialRequests,
    source: data.marketingSource,
    isReturning: customer.isReturning,
  });

  const lead = await prisma.lead.create({
    data: {
      customerId: customer.id,
      source: data.marketingSource,
      destination: data.preferredDestination,
      travelStartDate,
      travelEndDate,
      travelerCount: data.travelerCount,
      estimatedBudget: data.estimatedBudget,
      tripType: data.tripType,
      interests: serializeInterests(data.interests),
      specialRequests: data.specialRequests || null,
      score: scoreResult.score,
      scoreExplanation: serializeScoreExplanation(scoreResult.factors),
      assignedConsultant,
      stage: "NEW",
    },
  });

  await prisma.activity.create({
    data: {
      leadId: lead.id,
      type: "SYSTEM",
      title: "Inquiry submitted",
      description: `${firstName} ${lastName} submitted a new travel inquiry for ${data.preferredDestination}.`,
      channel: "Web form",
    },
  });

  await runNewInquiryAutomations(prisma, lead.id, {
    score: scoreResult.score,
    assignedConsultant,
    customerFirstName: firstName,
  });

  revalidatePath("/leads");
  revalidatePath("/dashboard");

  return {
    ok: true,
    message: "Inquiry received. A consultant will follow up shortly.",
    leadId: lead.id,
  };
}
