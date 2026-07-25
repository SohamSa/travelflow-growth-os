import type { LeadStage, MarketingSource, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { LeadWithRelations } from "@/types";

export interface LeadListFilters {
  search?: string;
  stage?: LeadStage | "ALL";
  source?: MarketingSource | "ALL";
  destination?: string | "ALL";
  consultant?: string | "ALL";
}

const leadInclude = {
  customer: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      preferredContactMethod: true,
      isReturning: true,
    },
  },
  campaign: true,
  quotes: { orderBy: { createdAt: "desc" as const } },
  bookings: { orderBy: { bookedAt: "desc" as const } },
  activities: { orderBy: { occurredAt: "desc" as const }, take: 5 },
  tasks: { orderBy: { dueAt: "asc" as const } },
  copilotDrafts: { orderBy: { createdAt: "desc" as const }, take: 10 },
} satisfies Prisma.LeadInclude;

export async function listLeads(filters: LeadListFilters = {}) {
  const where: Prisma.LeadWhereInput = {};

  if (filters.stage && filters.stage !== "ALL") {
    where.stage = filters.stage;
  }
  if (filters.source && filters.source !== "ALL") {
    where.source = filters.source;
  }
  if (filters.destination && filters.destination !== "ALL") {
    where.destination = filters.destination;
  }
  if (filters.consultant && filters.consultant !== "ALL") {
    where.assignedConsultant = filters.consultant;
  }
  if (filters.search?.trim()) {
    const q = filters.search.trim();
    const parts = q.split(/\s+/).filter(Boolean);
    const nameClauses =
      parts.length >= 2
        ? [
            {
              AND: [
                { customer: { firstName: { contains: parts[0] } } },
                { customer: { lastName: { contains: parts.slice(1).join(" ") } } },
              ],
            },
          ]
        : [];

    where.OR = [
      { destination: { contains: q } },
      { assignedConsultant: { contains: q } },
      { customer: { firstName: { contains: q } } },
      { customer: { lastName: { contains: q } } },
      { customer: { email: { contains: q } } },
      ...nameClauses,
      ...(parts.length === 1
        ? [
            { customer: { firstName: { contains: parts[0] } } },
            { customer: { lastName: { contains: parts[0] } } },
          ]
        : []),
    ];
  }

  return prisma.lead.findMany({
    where,
    include: leadInclude,
    orderBy: [{ score: "desc" }, { createdAt: "desc" }],
  });
}

export async function getLeadById(id: string): Promise<LeadWithRelations | null> {
  return prisma.lead.findUnique({
    where: { id },
    include: {
      ...leadInclude,
      activities: { orderBy: { occurredAt: "desc" } },
      copilotDrafts: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function getLeadCountsByStage() {
  const stages: LeadStage[] = [
    "NEW",
    "CONTACTED",
    "QUALIFIED",
    "QUOTE_SENT",
    "BOOKED",
    "LOST",
  ];
  const counts = await Promise.all(
    stages.map(async (stage) => ({
      stage,
      count: await prisma.lead.count({ where: { stage } }),
    })),
  );
  return counts;
}
