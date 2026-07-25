"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { SOURCE_LABELS } from "@/types";
import type { CampaignMetrics } from "@/types";

export function CampaignCharts({ campaigns }: { campaigns: CampaignMetrics[] }) {
  const roasData = campaigns.map((c) => ({
    name: c.name.length > 20 ? `${c.name.slice(0, 18)}…` : c.name,
    roas: c.roas ?? 0,
    spend: c.spend,
    revenue: c.revenue,
  }));

  const cplData = campaigns.map((c) => ({
    name: c.name.length > 20 ? `${c.name.slice(0, 18)}…` : c.name,
    cpl: c.costPerLead ?? 0,
    cpb: c.costPerBooking ?? 0,
  }));

  return (
    <div className="mb-8 grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>ROAS by campaign</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={roasData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d4dce6" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v, name) => (name === "roas" ? `${Number(v).toFixed(2)}x` : `$${Number(v).toLocaleString()}`)} />
              <Bar dataKey="roas" fill="#1a9b9b" name="ROAS" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>CPL & CPB by campaign</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cplData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d4dce6" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} />
              <Bar dataKey="cpl" fill="#0b1e33" name="CPL" radius={[4, 4, 0, 0]} />
              <Bar dataKey="cpb" fill="#e07a5f" name="CPB" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

export function CampaignTable({ campaigns }: { campaigns: CampaignMetrics[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border bg-surface text-xs uppercase tracking-wide text-slate">
          <tr>
            <th className="px-4 py-3">Campaign</th>
            <th className="px-4 py-3">Channel</th>
            <th className="px-4 py-3">Spend</th>
            <th className="px-4 py-3">Leads</th>
            <th className="px-4 py-3">Bookings</th>
            <th className="px-4 py-3">Revenue</th>
            <th className="px-4 py-3">CPL</th>
            <th className="px-4 py-3">CPB</th>
            <th className="px-4 py-3">ROAS</th>
            <th className="px-4 py-3">Lead conv.</th>
            <th className="px-4 py-3">Booking conv.</th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map((c) => (
            <tr key={c.id} className="border-b border-border last:border-0 hover:bg-surface/50">
              <td className="px-4 py-3 font-medium text-navy">{c.name}</td>
              <td className="px-4 py-3">{SOURCE_LABELS[c.channel]}</td>
              <td className="px-4 py-3">{formatCurrency(c.spend)}</td>
              <td className="px-4 py-3">{c.leads}</td>
              <td className="px-4 py-3">{c.bookings}</td>
              <td className="px-4 py-3">{formatCurrency(c.revenue)}</td>
              <td className="px-4 py-3">{formatCurrency(c.costPerLead)}</td>
              <td className="px-4 py-3">{formatCurrency(c.costPerBooking)}</td>
              <td className="px-4 py-3">{c.roas == null ? "—" : `${c.roas.toFixed(2)}x`}</td>
              <td className="px-4 py-3">{formatPercent(c.leadConversion)}</td>
              <td className="px-4 py-3">{formatPercent(c.bookingConversion)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
