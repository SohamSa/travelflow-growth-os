import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { getLeadById } from "@/lib/leads/queries";
import { LeadDetailView } from "@/features/leads/LeadDetailView";
import { STAGE_LABELS } from "@/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await getLeadById(id);
  if (!lead) return { title: "Lead not found" };
  return {
    title: `${lead.customer.firstName} ${lead.customer.lastName} · ${STAGE_LABELS[lead.stage]}`,
  };
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await getLeadById(id);

  if (!lead) notFound();

  return (
    <div>
      <Link
        href="/leads"
        className="mb-4 inline-flex items-center gap-2 text-sm text-slate hover:text-teal"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to leads
      </Link>
      <PageHeader
        title={`${lead.customer.firstName} ${lead.customer.lastName}`}
        description={`${lead.destination} inquiry · ${STAGE_LABELS[lead.stage]} · Score ${lead.score}`}
      />
      <LeadDetailView lead={lead} />
    </div>
  );
}
