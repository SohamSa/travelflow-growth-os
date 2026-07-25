import { PageHeader } from "@/components/ui/PageHeader";
import { fetchDashboardData } from "@/lib/analytics/dashboard";
import { ExecutiveSummary, ReportsActions } from "@/features/reports/ReportsContent";

export const metadata = { title: "Reports" };
export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const data = await fetchDashboardData();

  return (
    <div>
      <PageHeader
        title="Executive Reports"
        description="Print-friendly summary of pipeline health, revenue, and recommendations for leadership review."
        actions={<ReportsActions />}
      />
      <ExecutiveSummary data={data} />
    </div>
  );
}
