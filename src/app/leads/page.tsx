import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { getLeadCountsByStage, listLeads } from "@/lib/leads/queries";
import { LeadsFilters } from "@/features/leads/LeadsFilters";
import { LeadsTable } from "@/features/leads/LeadsTable";
import { LeadsPipeline } from "@/features/leads/LeadsPipeline";
import { LeadsViewToggle } from "@/features/leads/LeadsViewToggle";
import { STAGE_LABELS } from "@/types";
import type { LeadStage, MarketingSource } from "@prisma/client";

export const metadata = { title: "Leads" };
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    stage?: string;
    source?: string;
    destination?: string;
    consultant?: string;
    view?: string;
  }>;
}

export default async function LeadsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const [leads, stageCounts] = await Promise.all([
    listLeads({
      search: params.search,
      stage: (params.stage as LeadStage | "ALL") ?? "ALL",
      source: (params.source as MarketingSource | "ALL") ?? "ALL",
      destination: params.destination ?? "ALL",
      consultant: params.consultant ?? "ALL",
    }),
    getLeadCountsByStage(),
  ]);

  const view = params.view ?? "table";

  return (
    <div>
      <PageHeader
        title="Lead Pipeline"
        description="Search, filter, and manage travel inquiries across the Horizon Trails consultant queue."
        actions={
          <Link href="/inquiry">
            <Button variant="coral">
              <Plus className="h-4 w-4" />
              New inquiry
            </Button>
          </Link>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {stageCounts.map(({ stage, count }) => (
          <div
            key={stage}
            className="rounded-lg border border-border bg-white px-3 py-2 shadow-sm"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate">
              {STAGE_LABELS[stage]}
            </p>
            <p className="font-serif text-xl font-semibold text-navy">{count}</p>
          </div>
        ))}
      </div>

      <Suspense fallback={null}>
        <LeadsFilters />
      </Suspense>

      <Suspense fallback={null}>
        <LeadsViewToggle />
      </Suspense>

      {view === "pipeline" ? <LeadsPipeline leads={leads} /> : <LeadsTable leads={leads} />}
    </div>
  );
}
