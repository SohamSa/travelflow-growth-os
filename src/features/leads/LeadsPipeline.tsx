"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { PIPELINE_STAGES, STAGE_LABELS, type LeadWithRelations } from "@/types";

export function LeadsPipeline({ leads }: { leads: LeadWithRelations[] }) {
  return (
    <div className="grid gap-4 overflow-x-auto lg:grid-cols-6">
      {PIPELINE_STAGES.map((stage) => {
        const stageLeads = leads.filter((l) => l.stage === stage);
        return (
          <div key={stage} className="min-w-[200px] rounded-xl border border-border bg-surface p-3">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-navy">{STAGE_LABELS[stage]}</h3>
              <Badge>{stageLeads.length}</Badge>
            </div>
            <div className="space-y-2">
              {stageLeads.map((lead) => (
                <Link
                  key={lead.id}
                  href={`/leads/${lead.id}`}
                  className="block rounded-lg border border-border bg-white p-3 shadow-sm transition hover:border-teal/40"
                >
                  <p className="text-sm font-medium text-navy">
                    {lead.customer.firstName} {lead.customer.lastName}
                  </p>
                  <p className="text-xs text-slate">{lead.destination}</p>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-teal">Score {lead.score}</span>
                    <span className="text-slate-light">{lead.assignedConsultant.split(" ")[0]}</span>
                  </div>
                </Link>
              ))}
              {stageLeads.length === 0 && (
                <p className="py-4 text-center text-xs text-slate-light">Empty</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
