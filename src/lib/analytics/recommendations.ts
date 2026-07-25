import type { Recommendation, SourceMetrics } from "@/types";
import { SOURCE_LABELS } from "@/types";
import { formatCurrency, formatPercent } from "@/lib/utils";

interface RecommendationInput {
  sourceMetrics: SourceMetrics[];
  avgResponseHours: number | null;
  quoteStageCount: number;
  bookedCount: number;
  totalLeads: number;
  destinationDemand: { destination: string; leads: number; revenue: number }[];
  returningBookingRate: number | null;
  newBookingRate: number | null;
  weakCampaigns: { name: string; spend: number; roas: number | null }[];
}

export function buildRecommendations(input: RecommendationInput): Recommendation[] {
  const recommendations: Recommendation[] = [];

  const paidWithBookings = input.sourceMetrics
    .filter((s) => s.bookings > 0 && s.leads > 0)
    .sort((a, b) => (b.leadToBooking ?? 0) - (a.leadToBooking ?? 0));

  if (paidWithBookings[0]) {
    const top = paidWithBookings[0];
    recommendations.push({
      id: "top-channel-conversion",
      insight: `${SOURCE_LABELS[top.source]} converts inquiries into bookings most efficiently.`,
      supportingMetric: `Lead-to-booking conversion: ${formatPercent(top.leadToBooking)} (${top.bookings} bookings from ${top.leads} leads)`,
      whyItMatters:
        "Knowing which channels produce booked journeys—not just inquiries—helps the agency allocate marketing effort with confidence.",
      recommendedAction: `Protect and modestly expand ${SOURCE_LABELS[top.source]} while keeping creative quality and response SLAs consistent.`,
      label: "Data-driven recommendation",
    });
  }

  const weak = input.weakCampaigns
    .filter((c) => c.spend >= 2000 && (c.roas === null || c.roas < 1.2))
    .sort((a, b) => b.spend - a.spend)[0];

  if (weak) {
    recommendations.push({
      id: "weak-roas-campaign",
      insight: `"${weak.name}" is spending heavily with weak return on advertising spend.`,
      supportingMetric: `Spend ${formatCurrency(weak.spend)} · ROAS ${weak.roas === null ? "—" : weak.roas.toFixed(2)}x`,
      whyItMatters:
        "High spend without bookings quietly erodes margin and obscures which campaigns deserve budget.",
      recommendedAction:
        "Pause or rebuild creative and landing-page alignment, then re-measure after a controlled test window.",
      label: "Data-driven recommendation",
    });
  }

  if (input.avgResponseHours != null && input.avgResponseHours > 12) {
    recommendations.push({
      id: "slow-response",
      insight: "Average first response time is slower than the demo SLA target of 12 hours.",
      supportingMetric: `Average first response: ${input.avgResponseHours.toFixed(1)} hours`,
      whyItMatters:
        "Travel inquiries cool quickly. Faster acknowledgment correlates with stronger qualification and booking rates in this dataset.",
      recommendedAction:
        "Keep the new-inquiry automation enabled and prioritize High-score leads in the consultant queue each morning.",
      label: "Data-driven recommendation",
    });
  }

  if (input.quoteStageCount > 0 && input.bookedCount >= 0) {
    const dropOff = input.quoteStageCount;
    if (dropOff >= Math.max(3, Math.floor(input.totalLeads * 0.05))) {
      recommendations.push({
        id: "quote-dropoff",
        insight: "A meaningful share of opportunities is sitting in Quote Sent without converting.",
        supportingMetric: `${dropOff} leads currently in Quote Sent · ${input.bookedCount} bookings in the selected window`,
        whyItMatters:
          "Quote-stage follow-up is a major drop-off area. Personalized nudges often recover revenue without new ad spend.",
        recommendedAction:
          "Use the AI copilot quote follow-up draft, then complete the task within 72 hours of quote send.",
        label: "Data-driven recommendation",
      });
    }
  }

  const topDestination = [...input.destinationDemand].sort((a, b) => b.revenue - a.revenue)[0];
  if (topDestination && topDestination.revenue > 0) {
    recommendations.push({
      id: "destination-demand",
      insight: `${topDestination.destination} shows strong demand and booking value.`,
      supportingMetric: `${topDestination.leads} leads · ${formatCurrency(topDestination.revenue)} booking revenue`,
      whyItMatters:
        "Destination focus helps marketing creative, consultant expertise, and package design stay aligned with proven demand.",
      recommendedAction: `Feature ${topDestination.destination} in the next campaign cycle and prepare reusable itinerary outlines for consultants.`,
      label: "Data-driven recommendation",
    });
  }

  if (
    input.returningBookingRate != null &&
    input.newBookingRate != null &&
    input.returningBookingRate > input.newBookingRate
  ) {
    recommendations.push({
      id: "returning-customers",
      insight: "Returning customers convert to bookings more effectively than first-time inquirers.",
      supportingMetric: `Returning booking rate ${formatPercent(input.returningBookingRate)} vs new ${formatPercent(input.newBookingRate)}`,
      whyItMatters:
        "Retention and re-engagement can grow revenue without proportional increases in paid acquisition spend.",
      recommendedAction:
        "Enable the previous-customer re-engagement automation and personalize outreach with past trip context.",
      label: "Data-driven recommendation",
    });
  }

  return recommendations.slice(0, 6);
}
