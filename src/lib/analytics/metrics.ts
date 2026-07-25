import { differenceInMinutes } from "date-fns";
import type { Booking, Campaign, Lead, LeadStage, MarketingSource, Quote } from "@prisma/client";
import { safeDivide } from "@/lib/utils";
import type { FunnelCounts, SourceMetrics } from "@/types";

const QUALIFIED_STAGES: LeadStage[] = ["QUALIFIED", "QUOTE_SENT", "BOOKED"];

export function isQualifiedStage(stage: LeadStage): boolean {
  return QUALIFIED_STAGES.includes(stage);
}

export function countTotalLeads(leads: Pick<Lead, "id">[]): number {
  return leads.length;
}

export function countQualifiedLeads(leads: Pick<Lead, "stage">[]): number {
  return leads.filter((lead) => isQualifiedStage(lead.stage)).length;
}

export function countQuotesSent(leads: { quotes: Pick<Quote, "status" | "sentAt">[] }[]): number {
  return leads.filter((lead) =>
    lead.quotes.some((quote) => quote.status === "SENT" || quote.status === "ACCEPTED" || quote.sentAt != null),
  ).length;
}

export function countConfirmedBookings(bookings: Pick<Booking, "id">[]): number {
  return bookings.length;
}

export function leadToBookingConversion(leads: number, bookings: number): number | null {
  const ratio = safeDivide(bookings, leads);
  return ratio === null ? null : ratio * 100;
}

export function quoteToBookingConversion(quotesSent: number, bookings: number): number | null {
  const ratio = safeDivide(bookings, quotesSent);
  return ratio === null ? null : ratio * 100;
}

export function averageFirstResponseHours(
  leads: Pick<Lead, "createdAt" | "firstResponseAt">[],
): number | null {
  const responded = leads.filter((lead) => lead.firstResponseAt != null);
  if (responded.length === 0) return null;

  const totalMinutes = responded.reduce((sum, lead) => {
    return sum + differenceInMinutes(lead.firstResponseAt!, lead.createdAt);
  }, 0);

  return totalMinutes / responded.length / 60;
}

export function costPerLead(spend: number, leads: number): number | null {
  return safeDivide(spend, leads);
}

export function costPerBooking(spend: number, bookings: number): number | null {
  return safeDivide(spend, bookings);
}

export function returnOnAdSpend(revenue: number, spend: number): number | null {
  return safeDivide(revenue, spend);
}

export function buildFunnelCounts(
  leads: Pick<Lead, "stage">[],
  bookings: Pick<Booking, "id">[],
  quotesSentCount?: number,
): FunnelCounts {
  const byStage = {
    new: leads.filter((l) => l.stage === "NEW").length,
    contacted: leads.filter((l) => l.stage === "CONTACTED").length,
    qualified: leads.filter((l) => l.stage === "QUALIFIED").length,
    quoteSent: leads.filter((l) => l.stage === "QUOTE_SENT").length,
    booked: leads.filter((l) => l.stage === "BOOKED").length,
    lost: leads.filter((l) => l.stage === "LOST").length,
  };

  return {
    ...byStage,
    totalLeads: leads.length,
    qualifiedLeads: countQualifiedLeads(leads),
    quotesSent: quotesSentCount ?? byStage.quoteSent + byStage.booked,
    confirmedBookings: bookings.length,
  };
}

export function filterByDateRange<T extends { createdAt: Date }>(
  items: T[],
  start: Date,
  end: Date,
): T[] {
  return items.filter((item) => item.createdAt >= start && item.createdAt <= end);
}

export function filterBookingsByDateRange(
  bookings: Pick<Booking, "bookedAt">[],
  start: Date,
  end: Date,
) {
  return bookings.filter((booking) => booking.bookedAt >= start && booking.bookedAt <= end);
}

export interface LeadForAttribution extends Pick<
  Lead,
  "id" | "source" | "stage" | "campaignId" | "createdAt" | "destination"
> {
  quotes: Pick<Quote, "status" | "sentAt">[];
  bookings: Pick<Booking, "id" | "revenue" | "bookedAt">[];
}

export function computeSourceMetrics(
  leads: LeadForAttribution[],
  campaigns: Pick<Campaign, "channel" | "spend">[],
): SourceMetrics[] {
  const sources: MarketingSource[] = [
    "GOOGLE_ADS",
    "INSTAGRAM",
    "FACEBOOK",
    "ORGANIC_SEARCH",
    "REFERRAL",
    "EMAIL",
    "DIRECT",
  ];

  return sources.map((source) => {
    const sourceLeads = leads.filter((lead) => lead.source === source);
    const bookings = sourceLeads.flatMap((lead) => lead.bookings);
    const revenue = bookings.reduce((sum, booking) => sum + booking.revenue, 0);
    const spend = campaigns
      .filter((campaign) => campaign.channel === source)
      .reduce((sum, campaign) => sum + campaign.spend, 0);
    const qualified = countQualifiedLeads(sourceLeads);
    const bookingCount = bookings.length;

    return {
      source,
      leads: sourceLeads.length,
      qualified,
      bookings: bookingCount,
      revenue,
      spend,
      costPerLead: costPerLead(spend, sourceLeads.length),
      costPerBooking: costPerBooking(spend, bookingCount),
      leadToBooking: leadToBookingConversion(sourceLeads.length, bookingCount),
      roas: returnOnAdSpend(revenue, spend),
    };
  });
}

export function computeCampaignMetrics(
  campaign: Campaign,
  leads: LeadForAttribution[],
) {
  const attributed = leads.filter((lead) => lead.campaignId === campaign.id);
  const bookings = attributed.flatMap((lead) => lead.bookings);
  const quotes = countQuotesSent(attributed);
  const revenue = bookings.reduce((sum, booking) => sum + booking.revenue, 0);
  const bookingCount = bookings.length;

  return {
    id: campaign.id,
    name: campaign.name,
    channel: campaign.channel,
    source: campaign.channel,
    impressions: campaign.impressions,
    clicks: campaign.clicks,
    websiteSessions: campaign.websiteSessions,
    leads: attributed.length,
    qualified: countQualifiedLeads(attributed),
    quotes,
    bookings: bookingCount,
    revenue,
    spend: campaign.spend,
    costPerLead: costPerLead(campaign.spend, attributed.length),
    costPerBooking: costPerBooking(campaign.spend, bookingCount),
    leadToBooking: leadToBookingConversion(attributed.length, bookingCount),
    leadConversion: leadToBookingConversion(attributed.length, countQualifiedLeads(attributed)),
    bookingConversion: quoteToBookingConversion(quotes, bookingCount),
    roas: returnOnAdSpend(revenue, campaign.spend),
  };
}
