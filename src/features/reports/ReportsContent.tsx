"use client";

import { useTransition } from "react";
import { Download, Printer } from "lucide-react";
import { exportExecutiveSummaryCsv, exportLeadsCsv } from "@/app/actions/reports";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { DashboardData } from "@/lib/analytics/dashboard";

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function ReportsActions() {
  const [pending, startTransition] = useTransition();

  return (
    <div className="no-print flex flex-wrap gap-2">
      <Button variant="secondary" onClick={() => window.print()}>
        <Printer className="h-4 w-4" />
        Print report
      </Button>
      <Button
        variant="coral"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await exportLeadsCsv();
            if (result.ok && result.csv && result.filename) {
              downloadCsv(result.csv, result.filename);
            }
          })
        }
      >
        <Download className="h-4 w-4" />
        Export leads CSV
      </Button>
      <Button
        variant="secondary"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await exportExecutiveSummaryCsv();
            if (result.ok && result.csv && result.filename) {
              downloadCsv(result.csv, result.filename);
            }
          })
        }
      >
        <Download className="h-4 w-4" />
        Export summary CSV
      </Button>
    </div>
  );
}

export function ExecutiveSummary({ data }: { data: DashboardData }) {
  return (
    <div className="space-y-6 print:text-black">
      <Card>
        <CardHeader>
          <CardTitle>Executive summary</CardTitle>
          <p className="text-sm text-slate">
            Horizon Trails Travel · TravelFlow Growth OS · Demo workspace report
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-surface p-4">
              <p className="text-sm text-slate">Total leads</p>
              <p className="font-serif text-2xl font-semibold">{data.kpis.totalLeads}</p>
            </div>
            <div className="rounded-lg bg-surface p-4">
              <p className="text-sm text-slate">Bookings</p>
              <p className="font-serif text-2xl font-semibold">{data.kpis.confirmedBookings}</p>
            </div>
            <div className="rounded-lg bg-surface p-4">
              <p className="text-sm text-slate">Revenue</p>
              <p className="font-serif text-2xl font-semibold">{data.kpis.totalRevenue}</p>
            </div>
            <div className="rounded-lg bg-surface p-4">
              <p className="text-sm text-slate">ROAS</p>
              <p className="font-serif text-2xl font-semibold">{data.kpis.roas}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <h3 className="font-medium text-navy">Pipeline snapshot</h3>
              <ul className="mt-2 space-y-1 text-sm text-slate">
                <li>New: {data.funnel.new}</li>
                <li>Contacted: {data.funnel.contacted}</li>
                <li>Qualified: {data.funnel.qualified}</li>
                <li>Quote sent: {data.funnel.quoteSent}</li>
                <li>Booked: {data.funnel.booked}</li>
                <li>Lost: {data.funnel.lost}</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-navy">Conversion metrics</h3>
              <ul className="mt-2 space-y-1 text-sm text-slate">
                <li>Lead → booking: {data.kpis.leadToBooking}</li>
                <li>Quote → booking: {data.kpis.quoteToBooking}</li>
                <li>Avg first response: {data.kpis.avgResponseTime}</li>
                <li>Ad spend: {data.kpis.totalSpend}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {data.recommendations.length > 0 && (
        <Card className="print-break">
          <CardHeader>
            <CardTitle>Key recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.recommendations.slice(0, 4).map((rec) => (
              <div key={rec.id} className="border-b border-border pb-4 last:border-0">
                <p className="font-medium text-navy">{rec.insight}</p>
                <p className="mt-1 text-sm text-slate">{rec.supportingMetric}</p>
                <p className="mt-2 text-sm">{rec.recommendedAction}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
