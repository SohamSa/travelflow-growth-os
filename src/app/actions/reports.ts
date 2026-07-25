"use server";

import { endOfDay, startOfDay, subDays } from "date-fns";
import { prisma } from "@/lib/db/prisma";
import { SOURCE_LABELS } from "@/types";
import { formatCurrency } from "@/lib/utils";

function escapeCsv(value: string | number | null | undefined): string {
  const str = value == null ? "" : String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function exportLeadsCsv(params?: {
  start?: string;
  end?: string;
}): Promise<{ ok: boolean; csv?: string; filename?: string; message?: string }> {
  try {
    const end = params?.end ? endOfDay(new Date(params.end)) : endOfDay(new Date());
    const start = params?.start
      ? startOfDay(new Date(params.start))
      : startOfDay(subDays(end, 89));

    const leads = await prisma.lead.findMany({
      where: { createdAt: { gte: start, lte: end } },
      include: {
        customer: true,
        bookings: true,
        quotes: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const headers = [
      "Lead ID",
      "Customer",
      "Email",
      "Destination",
      "Stage",
      "Source",
      "Score",
      "Consultant",
      "Created",
      "Bookings",
      "Revenue",
    ];

    const rows = leads.map((lead) => {
      const revenue = lead.bookings.reduce((s, b) => s + b.revenue, 0);
      return [
        lead.id,
        `${lead.customer.firstName} ${lead.customer.lastName}`,
        lead.customer.email,
        lead.destination,
        lead.stage,
        SOURCE_LABELS[lead.source],
        lead.score,
        lead.assignedConsultant,
        lead.createdAt.toISOString(),
        lead.bookings.length,
        formatCurrency(revenue),
      ]
        .map(escapeCsv)
        .join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");
    const filename = `horizon-trails-leads-${start.toISOString().slice(0, 10)}.csv`;

    return { ok: true, csv, filename };
  } catch {
    return { ok: false, message: "Export failed." };
  }
}

export async function exportExecutiveSummaryCsv(): Promise<{
  ok: boolean;
  csv?: string;
  filename?: string;
  message?: string;
}> {
  try {
    const [leadCount, bookingCount, revenueAgg, campaigns] = await Promise.all([
      prisma.lead.count(),
      prisma.booking.count(),
      prisma.booking.aggregate({ _sum: { revenue: true } }),
      prisma.campaign.findMany(),
    ]);

    const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
    const totalRevenue = revenueAgg._sum.revenue ?? 0;

    const rows = [
      ["Metric", "Value"],
      ["Total Leads", leadCount],
      ["Total Bookings", bookingCount],
      ["Total Revenue", formatCurrency(totalRevenue)],
      ["Total Ad Spend", formatCurrency(totalSpend)],
      ["ROAS", totalSpend > 0 ? (totalRevenue / totalSpend).toFixed(2) : "—"],
    ];

    const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
    return { ok: true, csv, filename: "horizon-trails-executive-summary.csv" };
  } catch {
    return { ok: false, message: "Export failed." };
  }
}
