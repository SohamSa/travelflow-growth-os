import { format } from "date-fns";
import { SOURCE_LABELS, TRIP_TYPE_LABELS } from "@/types";
import type {
  CopilotResult,
  CustomerContext,
  LeadContext,
  TravelCopilotProvider,
} from "@/lib/ai/types";

function datesLabel(input: LeadContext): string {
  if (input.travelStartDate && input.travelEndDate) {
    return `${format(input.travelStartDate, "MMM d, yyyy")} – ${format(input.travelEndDate, "MMM d, yyyy")}`;
  }
  return "dates to be confirmed";
}

function budgetLabel(input: LeadContext): string {
  if (input.estimatedBudget == null) return "a flexible budget";
  return `about $${Math.round(input.estimatedBudget).toLocaleString("en-US")}`;
}

function interestsLabel(input: LeadContext): string {
  return input.interests.length > 0 ? input.interests.join(", ") : "general leisure travel";
}

function wrap(content: string): CopilotResult {
  return {
    content: `${content.trim()}\n\n— Draft for employee review. Do not send without human approval. This content does not confirm live availability, guarantee prices, book travel, or process payments.`,
    provider: "demo",
    label: "Draft for employee review",
    modeLabel: "Demo AI Mode",
  };
}

export class DemoTravelCopilotProvider implements TravelCopilotProvider {
  async summarizeInquiry(input: LeadContext): Promise<CopilotResult> {
    return wrap(
      `Inquiry summary for ${input.firstName} ${input.lastName}\n\n` +
        `${input.firstName} inquired about a ${TRIP_TYPE_LABELS[input.tripType].toLowerCase()} trip to ${input.destination} for ${input.travelerCount} traveler${input.travelerCount === 1 ? "" : "s"} (${datesLabel(input)}). ` +
        `Estimated budget is ${budgetLabel(input)}. Interests include ${interestsLabel(input)}. ` +
        `Source: ${SOURCE_LABELS[input.source]}. Current stage: ${input.stage.replaceAll("_", " ")}. Lead score: ${input.score}/100.` +
        (input.specialRequests
          ? ` Special requests: ${input.specialRequests}`
          : " No special requests were noted.") +
        (input.isReturning ? " This appears to be a returning customer." : ""),
    );
  }

  async recommendNextAction(input: LeadContext): Promise<CopilotResult> {
    const actions: Record<string, string> = {
      NEW: `Call or email ${input.firstName} within one business day to acknowledge the ${input.destination} inquiry, confirm dates (${datesLabel(input)}), and clarify must-have experiences around ${interestsLabel(input)}.`,
      CONTACTED: `Qualify budget fit (${budgetLabel(input)}) and traveler priorities, then propose 2–3 ${input.destination} directions aligned to a ${TRIP_TYPE_LABELS[input.tripType].toLowerCase()} trip.`,
      QUALIFIED: `Prepare a tailored ${input.destination} quote for ${input.travelerCount} travelers and send it with a clear next-step CTA.`,
      QUOTE_SENT: `Follow up on the open quote. Reference ${input.firstName}'s interest in ${interestsLabel(input)} and offer one optional upgrade and one value-preserving alternative.`,
      BOOKED: `Send a pre-trip checklist and collect any remaining preferences before departure.`,
      LOST: `Log the lost reason clearly and schedule a polite re-engagement in 60–90 days if timing was the blocker.`,
    };

    return wrap(
      `Recommended next action\n\n${actions[input.stage] ?? actions.NEW}\n\nAssigned consultant: ${input.assignedConsultant}.`,
    );
  }

  async draftInitialResponse(input: LeadContext): Promise<CopilotResult> {
    return wrap(
      `Subject: Your ${input.destination} trip inquiry with Horizon Trails Travel\n\n` +
        `Hi ${input.firstName},\n\n` +
        `Thank you for reaching out about a ${TRIP_TYPE_LABELS[input.tripType].toLowerCase()} getaway to ${input.destination}. ` +
        `I'd love to help shape something special for ${input.travelerCount === 2 ? "the two of you" : `your group of ${input.travelerCount}`} around ${datesLabel(input)}, with room for ${interestsLabel(input)}.\n\n` +
        `To keep planning accurate, could you confirm whether ${budgetLabel(input)} is still the right range, and share any must-have experiences or pacing preferences?\n\n` +
        `I'll prepare thoughtful options for your review—nothing will be booked without your approval.\n\n` +
        `Warmly,\n${input.assignedConsultant}\nHorizon Trails Travel`,
    );
  }

  async draftItinerary(input: LeadContext): Promise<CopilotResult> {
    const days =
      input.travelStartDate && input.travelEndDate
        ? Math.max(
            3,
            Math.round(
              (input.travelEndDate.getTime() - input.travelStartDate.getTime()) /
                (1000 * 60 * 60 * 24),
            ) + 1,
          )
        : 5;

    const focus = input.interests[0] ?? "local highlights";
    const secondary = input.interests[1] ?? "relaxed evenings";

    return wrap(
      `Draft itinerary outline — ${input.destination} (${days} days)\n` +
        `Traveler: ${input.firstName} ${input.lastName} · ${TRIP_TYPE_LABELS[input.tripType]} · ${input.travelerCount} travelers\n\n` +
        `Day 1: Arrival, neighborhood orientation, welcome dinner featuring ${secondary}.\n` +
        `Day 2: Guided cultural morning focused on ${focus}; afternoon at a leisurely pace.\n` +
        `Day 3: Signature experience in ${input.destination} aligned to ${TRIP_TYPE_LABELS[input.tripType].toLowerCase()} travel.\n` +
        `Day 4: Flexible day for ${interestsLabel(input)}; optional upgrade experiences available on request.\n` +
        (days > 4
          ? `Days 5–${days}: Mix of curated highlights and free time; departure logistics on the final day.\n\n`
          : `\n`) +
        `Notes: Timing, vendors, and pricing in this outline are fictional placeholders for employee planning. Availability and rates must be verified before any client commitment.`,
    );
  }

  async draftQuoteFollowUp(input: LeadContext): Promise<CopilotResult> {
    return wrap(
      `Subject: Checking in on your ${input.destination} quote\n\n` +
        `Hi ${input.firstName},\n\n` +
        `I wanted to follow up on the ${input.destination} proposal I shared for ${datesLabel(input)}. ` +
        `If helpful, I can adjust the mix of experiences around ${interestsLabel(input)} or reshape the plan to better fit ${budgetLabel(input)}.\n\n` +
        `Happy to hop on a quick call, or I can send a revised outline—whichever is easier.\n\n` +
        `Looking forward to your thoughts,\n${input.assignedConsultant}\nHorizon Trails Travel`,
    );
  }

  async draftReengagement(input: CustomerContext): Promise<CopilotResult> {
    const place =
      input.lastTripDestination ?? input.destinationHint ?? "your next destination";
    return wrap(
      `Subject: Ready for another journey, ${input.firstName}?\n\n` +
        `Hi ${input.firstName},\n\n` +
        `It's been a while since we planned ${input.isReturning ? "your previous trip" : "together"}, and I thought of you while reviewing fresh ideas for ${place}. ` +
        `If a getaway is on your mind—anniversary, family escape, or something new—I'd love to sketch a few thoughtful options for your review.\n\n` +
        `No pressure and nothing is booked unless you ask us to proceed.\n\n` +
        `Warmly,\nHorizon Trails Travel`,
    );
  }
}
