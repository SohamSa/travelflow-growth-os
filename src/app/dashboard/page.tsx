import { Suspense } from "react";
import {
  Clock,
  DollarSign,
  FileText,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { MetricCard } from "@/components/ui/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { fetchDashboardData } from "@/lib/analytics/dashboard";
import { DashboardFilters } from "@/features/analytics/DashboardFilters";
import { DashboardCharts } from "@/features/analytics/DashboardCharts";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    start?: string;
    end?: string;
    source?: string;
    destination?: string;
  }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const data = await fetchDashboardData(params);

  return (
    <div>
      <PageHeader
        title="Growth Dashboard"
        description="Marketing performance, pipeline health, and data-driven recommendations for Horizon Trails Travel."
      />

      <Suspense fallback={null}>
        <DashboardFilters />
      </Suspense>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <MetricCard label="Total leads" value={String(data.kpis.totalLeads)} icon={Users} />
        <MetricCard label="Qualified" value={String(data.kpis.qualifiedLeads)} icon={Target} />
        <MetricCard label="Quotes sent" value={String(data.kpis.quotesSent)} icon={FileText} />
        <MetricCard label="Bookings" value={String(data.kpis.confirmedBookings)} icon={TrendingUp} />
        <MetricCard label="Avg response" value={data.kpis.avgResponseTime} icon={Clock} />
        <MetricCard label="Lead → booking" value={data.kpis.leadToBooking} />
        <MetricCard label="Quote → booking" value={data.kpis.quoteToBooking} />
        <MetricCard label="Revenue" value={data.kpis.totalRevenue} icon={DollarSign} />
        <MetricCard label="Ad spend" value={data.kpis.totalSpend} />
        <MetricCard label="ROAS" value={data.kpis.roas} trend="up" />
      </div>

      <DashboardCharts data={data} />

      {data.recommendations.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 font-serif text-xl font-semibold text-navy">Recommendations</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {data.recommendations.map((rec) => (
              <Card key={rec.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-base">{rec.insight}</CardTitle>
                    <Badge variant="teal">{rec.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p>
                    <span className="font-medium text-navy">Supporting metric: </span>
                    <span className="text-slate">{rec.supportingMetric}</span>
                  </p>
                  <p>
                    <span className="font-medium text-navy">Why it matters: </span>
                    <span className="text-slate">{rec.whyItMatters}</span>
                  </p>
                  <p className="rounded-lg bg-sand/40 p-3 text-navy">
                    <span className="font-medium">Recommended action: </span>
                    {rec.recommendedAction}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
