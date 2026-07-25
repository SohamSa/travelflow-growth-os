import type { LeadStage, MarketingSource, TripType } from "@prisma/client";

export interface LeadContext {
  leadId: string;
  firstName: string;
  lastName: string;
  email: string;
  destination: string;
  travelStartDate?: Date | null;
  travelEndDate?: Date | null;
  travelerCount: number;
  estimatedBudget?: number | null;
  tripType: TripType;
  interests: string[];
  specialRequests?: string | null;
  source: MarketingSource;
  stage: LeadStage;
  score: number;
  assignedConsultant: string;
  isReturning: boolean;
  recentActivityTitles?: string[];
}

export interface CustomerContext {
  firstName: string;
  lastName: string;
  destinationHint?: string;
  isReturning: boolean;
  lastTripDestination?: string;
}

export interface CopilotResult {
  content: string;
  provider: "ollama" | "demo";
  label: "Draft for employee review";
  modeLabel: "Ollama" | "Demo AI Mode";
}

export interface TravelCopilotProvider {
  summarizeInquiry(input: LeadContext): Promise<CopilotResult>;
  recommendNextAction(input: LeadContext): Promise<CopilotResult>;
  draftInitialResponse(input: LeadContext): Promise<CopilotResult>;
  draftItinerary(input: LeadContext): Promise<CopilotResult>;
  draftQuoteFollowUp(input: LeadContext): Promise<CopilotResult>;
  draftReengagement(input: CustomerContext): Promise<CopilotResult>;
}
