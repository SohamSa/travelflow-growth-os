"use server";

import { revalidatePath } from "next/cache";
import type { CopilotDraftType } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { runCopilot } from "@/lib/ai";
import type { CustomerContext, LeadContext } from "@/lib/ai/types";
import { getLeadById } from "@/lib/leads/queries";
import { parseInterests } from "@/lib/utils";

const DRAFT_TYPES: CopilotDraftType[] = [
  "INQUIRY_SUMMARY",
  "NEXT_ACTION",
  "INITIAL_RESPONSE",
  "ITINERARY",
  "QUOTE_FOLLOW_UP",
  "REENGAGEMENT",
];

function isDraftType(value: string): value is CopilotDraftType {
  return DRAFT_TYPES.includes(value as CopilotDraftType);
}

function buildLeadContext(lead: NonNullable<Awaited<ReturnType<typeof getLeadById>>>): LeadContext {
  return {
    leadId: lead.id,
    firstName: lead.customer.firstName,
    lastName: lead.customer.lastName,
    email: lead.customer.email,
    destination: lead.destination,
    travelStartDate: lead.travelStartDate,
    travelEndDate: lead.travelEndDate,
    travelerCount: lead.travelerCount,
    estimatedBudget: lead.estimatedBudget,
    tripType: lead.tripType,
    interests: parseInterests(lead.interests),
    specialRequests: lead.specialRequests,
    source: lead.source,
    stage: lead.stage,
    score: lead.score,
    assignedConsultant: lead.assignedConsultant,
    isReturning: lead.customer.isReturning,
    recentActivityTitles: lead.activities.slice(0, 5).map((a) => a.title),
  };
}

export type CopilotActionResult = {
  ok: boolean;
  message: string;
  content?: string;
  modeLabel?: "Ollama" | "Demo AI Mode";
  draftId?: string;
};

export async function generateCopilotDraft(formData: FormData): Promise<CopilotActionResult> {
  const leadId = String(formData.get("leadId") ?? "");
  const draftType = String(formData.get("draftType") ?? "");

  if (!leadId || !isDraftType(draftType)) {
    return { ok: false, message: "Invalid copilot request." };
  }

  const lead = await getLeadById(leadId);
  if (!lead) {
    return { ok: false, message: "Lead not found." };
  }

  const context = buildLeadContext(lead);

  let result;
  if (draftType === "REENGAGEMENT") {
    const customerContext: CustomerContext = {
      firstName: lead.customer.firstName,
      lastName: lead.customer.lastName,
      destinationHint: lead.destination,
      isReturning: lead.customer.isReturning,
      lastTripDestination: lead.destination,
    };
    result = await runCopilot((provider) => provider.draftReengagement(customerContext));
  } else {
    result = await runCopilot((provider) => {
      switch (draftType) {
        case "INQUIRY_SUMMARY":
          return provider.summarizeInquiry(context);
        case "NEXT_ACTION":
          return provider.recommendNextAction(context);
        case "INITIAL_RESPONSE":
          return provider.draftInitialResponse(context);
        case "ITINERARY":
          return provider.draftItinerary(context);
        case "QUOTE_FOLLOW_UP":
          return provider.draftQuoteFollowUp(context);
        default:
          return provider.summarizeInquiry(context);
      }
    });
  }

  const draft = await prisma.copilotDraft.create({
    data: {
      leadId,
      type: draftType,
      content: result.content,
      provider: result.provider,
    },
  });

  await prisma.activity.create({
    data: {
      leadId,
      type: "EMAIL_DRAFT",
      title: `AI draft generated (${draftType.replaceAll("_", " ").toLowerCase()})`,
      description: "Draft saved for employee review. No message was sent.",
      channel: result.modeLabel,
      isAutomated: false,
    },
  });

  revalidatePath(`/leads/${leadId}`);

  return {
    ok: true,
    message: "Draft generated for employee review.",
    content: result.content,
    modeLabel: result.modeLabel,
    draftId: draft.id,
  };
}
