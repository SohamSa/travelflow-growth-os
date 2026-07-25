import { endOfDay, format, startOfDay, subDays } from "date-fns";
import type { MarketingSource } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  averageFirstResponseHours,
  buildFunnelCounts,
  computeCampaignMetrics,
  computeSourceMetrics,
  countConfirmedBookings,
  countQualifiedLeads,
  countQuotesSent,
  countTotalLeads,
  leadToBookingConversion,
  quoteToBookingConversion,
} from "@/lib/analytics/metrics";
import { buildRecommendations } from "@/lib/analytics/recommendations";
import {
  formatCurrency,
  formatHours,
  formatPercent,
  safeDivide,
} from "@/lib/utils";
import type { DashboardFilters, Recommendation } from "@/types";

export interface DashboardKpis {
  totalLeads: number;
  qualifiedLeads: number;
  quotesSent: number;
  confirmedBookings: number;
  leadToBooking: string;
  quoteToBooking: string;
  avgResponseTime: string;
  totalRevenue: string;
  totalSpend: string;
  roas: string;
}

export interface TrendPoint {
  period: string;
  avgHours: number | null;
  count: number;
}

export interface LostReasonCount {
  reason: string;
  count: number;
}

export interface NewVsReturning {
  newLeads: number;
  returningLeads: number;
  newBookings: number;
  returningBookings: number;
  newBookingRate: number | null;
  returningBookingRate: number | null;
}

export interface DestinationDemand {
  destination: string;
  leads: number;
  revenue: number;
}

export interface SpendRevenuePoint {
  source: string;
  spend: number;
  revenue: number;
}

export interface DashboardData {
  filters: DashboardFilters;
  kpis: DashboardKpis;
  funnel: ReturnType<typeof buildFunnelCounts>;
  sourceMetrics: ReturnType<typeof computeSourceMetrics>;
  destinationDemand: DestinationDemand[];
  responseTimeTrend: TrendPoint[];
  lostReasons: LostReasonCount[];
  newVsReturning: NewVsReturning;
  spendVsRevenue: SpendRevenuePoint[];
  recommendations: Recommendation[];
}

function parseFilters(params: {
  start?: string;
  end?: string;
  source?: string;
  destination?: string;
}): DashboardFilters {
  const end = params.end ? endOfDay(new Date(params.end)) : endOfDay(new Date());
  const start = params.start
    ? startOfDay(new Date(params.start))
    : startOfDay(subDays(end, 89));

  return {
    start,
    end,
    source: (params.source as MarketingSource | "ALL" | undefined) ?? "ALL",
    destination: params.destination ?? "ALL",
  };
}

export async function fetchDashboardData(
  params: {
    start?: string;
    end?: string;
    source?: string;
    destination?: string;
  } = {},
): Promise<DashboardData> {
  const filters = parseFilters(params);

  const [leads, campaigns, bookingsInRange] = await Promise.all([
    prisma.lead.findMany({
      where: {
        createdAt: { gte: filters.start, lte: filters.end },
        ...(filters.source && filters.source !== "ALL" ? { source: filters.source } : {}),
        ...(filters.destination && filters.destination !== "ALL"
          ? { destination: filters.destination }
          : {}),
      },
      include: {
        customer: { select: { isReturning: true } },
        quotes: { select: { status: true, sentAt: true } },
        bookings: { select: { id: true, revenue: true, bookedAt: true } },
      },
    }),
    prisma.campaign.findMany(),
    prisma.booking.findMany({
      where: { bookedAt: { gte: filters.start, lte: filters.end } },
      include: {
        lead: {
          select: {
            source: true,
            destination: true,
            customer: { select: { isReturning: true } },
          },
        },
      },
    }),
  ]);

  const filteredBookings = bookingsInRange.filter((booking) => {
    const lead = booking.lead;
    if (filters.source && filters.source !== "ALL" && lead.source !== filters.source) {
      return false;
    }
    if (
      filters.destination &&
      filters.destination !== "ALL" &&
      lead.destination !== filters.destination
    ) {
      return false;
    }
    return true;
  });

  const quotesSent = countQuotesSent(leads);
  const bookingCount = countConfirmedBookings(filteredBookings);
  const totalLeads = countTotalLeads(leads);
  const qualifiedLeads = countQualifiedLeads(leads);
  const avgResponse = averageFirstResponseHours(leads);
  const totalRevenue = filteredBookings.reduce((sum, b) => sum + b.revenue, 0);
  const totalSpend = campaigns.reduce((sum, c) => sum + c.spend, 0);
  const roas = safeDivide(totalRevenue, totalSpend);

  const funnel = buildFunnelCounts(leads, filteredBookings, quotesSent);
  const sourceMetrics = computeSourceMetrics(leads, campaigns);

  const destinationMap = new Map<string, { leads: number; revenue: number }>();
  for (const lead of leads) {
    const entry = destinationMap.get(lead.destination) ?? { leads: 0, revenue: 0 };
    entry.leads += 1;
    entry.revenue += lead.bookings.reduce((s, b) => s + b.revenue, 0);
    destinationMap.set(lead.destination, entry);
  }
  const destinationDemand = [...destinationMap.entries()]
    .map(([destination, data]) => ({ destination, ...data }))
    .sort((a, b) => b.revenue - a.revenue);

  const weekBuckets = new Map<string, { totalHours: number; count: number }>();
  for (const lead of leads) {
    if (!lead.firstResponseAt) continue;
    const key = format(lead.createdAt, "MMM d");
    const bucket = weekBuckets.get(key) ?? { totalHours: 0, count: 0 };
    const hours =
      (lead.firstResponseAt.getTime() - lead.createdAt.getTime()) / (1000 * 60 * 60);
    bucket.totalHours += hours;
    bucket.count += 1;
    weekBuckets.set(key, bucket);
  }
  const responseTimeTrend: TrendPoint[] = [...weekBuckets.entries()]
    .slice(-12)
    .map(([period, data]) => ({
      period,
      avgHours: safeDivide(data.totalHours, data.count),
      count: data.count,
    }));

  const lostMap = new Map<string, number>();
  for (const lead of leads.filter((l) => l.stage === "LOST" && l.lostReason)) {
    lostMap.set(lead.lostReason!, (lostMap.get(lead.lostReason!) ?? 0) + 1);
  }
  const lostReasons: LostReasonCount[] = [...lostMap.entries()]
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);

  const newLeads = leads.filter((l) => !l.customer.isReturning);
  const returningLeads = leads.filter((l) => l.customer.isReturning);
  const newBookings = filteredBookings.filter((b) => !b.lead.customer.isReturning).length;
  const returningBookings = filteredBookings.filter((b) => b.lead.customer.isReturning).length;

  const newVsReturning: NewVsReturning = {
    newLeads: newLeads.length,
    returningLeads: returningLeads.length,
    newBookings,
    returningBookings,
    newBookingRate: leadToBookingConversion(newLeads.length, newBookings),
    returningBookingRate: leadToBookingConversion(returningLeads.length, returningBookings),
  };

  const spendVsRevenue = sourceMetrics.map((s) => ({
    source: s.source,
    spend: s.spend,
    revenue: s.revenue,
  }));

  const campaignMetrics = campaigns.map((c) => computeCampaignMetrics(c, leads));
  const weakCampaigns = campaignMetrics.map((c) => ({
    name: c.name,
    spend: c.spend,
    roas: c.roas,
  }));

  const recommendations = buildRecommendations({
    sourceMetrics,
    avgResponseHours: avgResponse,
    quoteStageCount: leads.filter((l) => l.stage === "QUOTE_SENT").length,
    bookedCount: bookingCount,
    totalLeads,
    destinationDemand,
    returningBookingRate: newVsReturning.returningBookingRate,
    newBookingRate: newVsReturning.newBookingRate,
    weakCampaigns,
  });

  return {
    filters,
    kpis: {
      totalLeads,
      qualifiedLeads,
      quotesSent,
      confirmedBookings: bookingCount,
      leadToBooking: formatPercent(leadToBookingConversion(totalLeads, bookingCount)),
      quoteToBooking: formatPercent(quoteToBookingConversion(quotesSent, bookingCount)),
      avgResponseTime: formatHours(avgResponse),
      totalRevenue: formatCurrency(totalRevenue),
      totalSpend: formatCurrency(totalSpend),
      roas: roas === null ? "—" : `${roas.toFixed(2)}x`,
    },
    funnel,
    sourceMetrics,
    destinationDemand,
    responseTimeTrend,
    lostReasons,
    newVsReturning,
    spendVsRevenue,
    recommendations,
  };
}
