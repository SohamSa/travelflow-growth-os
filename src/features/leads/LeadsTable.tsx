"use client";

import Link from "next/link";
import { format } from "date-fns";
import { Badge } from "@/components/ui/Badge";
import { SOURCE_LABELS, STAGE_LABELS, type LeadWithRelations } from "@/types";
import { formatCurrency } from "@/lib/utils";

function stageVariant(stage: string): "default" | "teal" | "sand" | "coral" {
  if (stage === "BOOKED") return "teal";
  if (stage === "LOST") return "coral";
  if (stage === "QUOTE_SENT") return "sand";
  return "default";
}

export function LeadsTable({ leads }: { leads: LeadWithRelations[] }) {
  if (leads.length === 0) {
    return <p className="text-sm text-slate">No leads match your filters.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border bg-surface text-xs uppercase tracking-wide text-slate">
          <tr>
            <th className="px-4 py-3">Customer</th>
            <th className="px-4 py-3">Destination</th>
            <th className="px-4 py-3">Stage</th>
            <th className="px-4 py-3">Source</th>
            <th className="px-4 py-3">Score</th>
            <th className="px-4 py-3">Consultant</th>
            <th className="px-4 py-3">Created</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id} className="border-b border-border last:border-0 hover:bg-surface/50">
              <td className="px-4 py-3">
                <Link href={`/leads/${lead.id}`} className="font-medium text-navy hover:text-teal">
                  {lead.customer.firstName} {lead.customer.lastName}
                </Link>
                <p className="text-xs text-slate">{lead.customer.email}</p>
              </td>
              <td className="px-4 py-3">{lead.destination}</td>
              <td className="px-4 py-3">
                <Badge variant={stageVariant(lead.stage)}>{STAGE_LABELS[lead.stage]}</Badge>
              </td>
              <td className="px-4 py-3">{SOURCE_LABELS[lead.source]}</td>
              <td className="px-4 py-3">
                <span className="font-medium">{lead.score}</span>
                {lead.customer.isReturning && (
                  <Badge variant="outline" className="ml-2">
                    Returning
                  </Badge>
                )}
              </td>
              <td className="px-4 py-3">{lead.assignedConsultant}</td>
              <td className="px-4 py-3 text-slate">
                {format(lead.createdAt, "MMM d, yyyy")}
                {lead.estimatedBudget != null && (
                  <p className="text-xs">{formatCurrency(lead.estimatedBudget)} budget</p>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
