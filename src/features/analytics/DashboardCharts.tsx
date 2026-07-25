"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { SOURCE_LABELS } from "@/types";
import type { DashboardData } from "@/lib/analytics/dashboard";

const TEAL = "#1a9b9b";
const NAVY = "#0b1e33";
const SAND = "#e8dfd4";
const CORAL = "#e07a5f";
const CHART_COLORS = [TEAL, NAVY, CORAL, "#2bb8b8", "#64748b", "#132d4a", "#c96850"];

export function DashboardCharts({ data }: { data: DashboardData }) {
  const funnelData = [
    { name: "New", value: data.funnel.new },
    { name: "Contacted", value: data.funnel.contacted },
    { name: "Qualified", value: data.funnel.qualified },
    { name: "Quote Sent", value: data.funnel.quoteSent },
    { name: "Booked", value: data.funnel.booked },
    { name: "Lost", value: data.funnel.lost },
  ];

  const leadsBySource = data.sourceMetrics
    .filter((s) => s.leads > 0)
    .map((s) => ({
      name: SOURCE_LABELS[s.source],
      leads: s.leads,
    }));

  const bookingsBySource = data.sourceMetrics
    .filter((s) => s.bookings > 0)
    .map((s) => ({
      name: SOURCE_LABELS[s.source],
      bookings: s.bookings,
    }));

  const revenueBySource = data.sourceMetrics
    .filter((s) => s.revenue > 0)
    .map((s) => ({
      name: SOURCE_LABELS[s.source],
      revenue: s.revenue,
    }));

  const spendRevenue = data.spendVsRevenue
    .filter((s) => s.spend > 0 || s.revenue > 0)
    .map((s) => ({
      name: SOURCE_LABELS[s.source as keyof typeof SOURCE_LABELS],
      spend: s.spend,
      revenue: s.revenue,
    }));

  const destinationData = data.destinationDemand.slice(0, 8);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Booking funnel</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnelData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#d4dce6" />
              <XAxis type="number" tick={{ fill: NAVY, fontSize: 12 }} />
              <YAxis dataKey="name" type="category" width={90} tick={{ fill: NAVY, fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill={TEAL} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Leads by source</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={leadsBySource} dataKey="leads" nameKey="name" cx="50%" cy="50%" outerRadius={90}>
                {leadsBySource.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bookings by source</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bookingsBySource}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d4dce6" />
              <XAxis dataKey="name" tick={{ fill: NAVY, fontSize: 11 }} />
              <YAxis tick={{ fill: NAVY, fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="bookings" fill={NAVY} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Revenue by source</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueBySource}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d4dce6" />
              <XAxis dataKey="name" tick={{ fill: NAVY, fontSize: 11 }} />
              <YAxis tick={{ fill: NAVY, fontSize: 12 }} />
              <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} />
              <Bar dataKey="revenue" fill={TEAL} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Spend vs revenue</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={spendRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d4dce6" />
              <XAxis dataKey="name" tick={{ fill: NAVY, fontSize: 11 }} />
              <YAxis tick={{ fill: NAVY, fontSize: 12 }} />
              <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} />
              <Legend />
              <Bar dataKey="spend" fill={SAND} name="Spend" radius={[4, 4, 0, 0]} />
              <Bar dataKey="revenue" fill={TEAL} name="Revenue" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Destination demand</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={destinationData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d4dce6" />
              <XAxis dataKey="destination" tick={{ fill: NAVY, fontSize: 11 }} />
              <YAxis tick={{ fill: NAVY, fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="leads" fill={NAVY} name="Leads" radius={[4, 4, 0, 0]} />
              <Bar dataKey="revenue" fill={CORAL} name="Revenue" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Response time trend</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.responseTimeTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d4dce6" />
              <XAxis dataKey="period" tick={{ fill: NAVY, fontSize: 11 }} />
              <YAxis tick={{ fill: NAVY, fontSize: 12 }} unit="h" />
              <Tooltip formatter={(v) => `${Number(v).toFixed(1)}h`} />
              <Line type="monotone" dataKey="avgHours" stroke={TEAL} strokeWidth={2} dot={{ fill: TEAL }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lost reasons</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          {data.lostReasons.length === 0 ? (
            <p className="text-sm text-slate">No lost leads in this period.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.lostReasons} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#d4dce6" />
                <XAxis type="number" tick={{ fill: NAVY, fontSize: 12 }} />
                <YAxis dataKey="reason" type="category" width={140} tick={{ fill: NAVY, fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill={CORAL} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>New vs returning customers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-surface p-4">
              <p className="text-sm text-slate">New leads</p>
              <p className="font-serif text-2xl font-semibold text-navy">
                {data.newVsReturning.newLeads}
              </p>
            </div>
            <div className="rounded-lg bg-surface p-4">
              <p className="text-sm text-slate">Returning leads</p>
              <p className="font-serif text-2xl font-semibold text-navy">
                {data.newVsReturning.returningLeads}
              </p>
            </div>
            <div className="rounded-lg bg-surface p-4">
              <p className="text-sm text-slate">New booking rate</p>
              <p className="font-serif text-2xl font-semibold text-teal">
                {data.newVsReturning.newBookingRate?.toFixed(1) ?? "—"}%
              </p>
            </div>
            <div className="rounded-lg bg-surface p-4">
              <p className="text-sm text-slate">Returning booking rate</p>
              <p className="font-serif text-2xl font-semibold text-teal">
                {data.newVsReturning.returningBookingRate?.toFixed(1) ?? "—"}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
