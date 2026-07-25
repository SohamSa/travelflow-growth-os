import { differenceInCalendarDays } from "date-fns";
import type { ContactMethod, MarketingSource } from "@prisma/client";
import type { LeadScoreResult, PriorityLabel } from "@/types";

export interface LeadScoreInput {
  travelStartDate?: Date | null;
  travelEndDate?: Date | null;
  estimatedBudget?: number | null;
  destination?: string | null;
  phone?: string | null;
  preferredContactMethod?: ContactMethod | null;
  travelerCount?: number | null;
  specialRequests?: string | null;
  source?: MarketingSource | null;
  isReturning?: boolean;
  now?: Date;
}

function priorityFromScore(score: number): PriorityLabel {
  if (score >= 75) return "High";
  if (score >= 45) return "Medium";
  return "Standard";
}

/**
 * Transparent rule-based lead score (0–100). Not machine learning.
 */
export function calculateLeadScore(input: LeadScoreInput): LeadScoreResult {
  let score = 0;
  const factors: string[] = [];
  const now = input.now ?? new Date();

  if (input.travelStartDate && input.travelEndDate) {
    score += 15;
    factors.push("+15 Travel dates provided");
  } else if (input.travelStartDate || input.travelEndDate) {
    score += 8;
    factors.push("+8 Partial travel dates provided");
  }

  if (input.estimatedBudget != null && input.estimatedBudget > 0) {
    score += 12;
    factors.push("+12 Budget provided");
  }

  if (input.destination && input.destination.trim().length > 0) {
    score += 10;
    factors.push("+10 Specific destination selected");
  }

  if (input.phone && input.phone.trim().length >= 7) {
    score += 8;
    factors.push("+8 Phone number provided");
  }

  if (input.preferredContactMethod) {
    score += 5;
    factors.push("+5 Preferred contact method selected");
  }

  if (input.travelerCount != null && input.travelerCount > 0) {
    score += 5;
    factors.push("+5 Traveler count provided");
  }

  const requests = input.specialRequests?.trim() ?? "";
  if (requests.length >= 40) {
    score += 12;
    factors.push("+12 Detailed special requests show strong intent");
  } else if (requests.length >= 10) {
    score += 6;
    factors.push("+6 Special requests included");
  }

  if (input.source === "REFERRAL") {
    score += 15;
    factors.push("+15 Referral source (historically strongest conversion)");
  } else if (input.source === "GOOGLE_ADS") {
    score += 8;
    factors.push("+8 Paid search intent signal");
  } else if (input.source === "DIRECT" || input.source === "ORGANIC_SEARCH") {
    score += 5;
    factors.push("+5 High-intent inbound source");
  }

  if (input.isReturning) {
    score += 12;
    factors.push("+12 Returning customer");
  }

  if (input.travelStartDate) {
    const daysUntil = differenceInCalendarDays(input.travelStartDate, now);
    if (daysUntil >= 0 && daysUntil <= 90) {
      score += 10;
      factors.push("+10 Travel date within 90 days");
    } else if (daysUntil > 90 && daysUntil <= 180) {
      score += 5;
      factors.push("+5 Travel date within 180 days");
    }
  }

  const clamped = Math.max(0, Math.min(100, score));
  return {
    score: clamped,
    priority: priorityFromScore(clamped),
    factors,
  };
}

export function serializeScoreExplanation(factors: string[]): string {
  return JSON.stringify(factors);
}
