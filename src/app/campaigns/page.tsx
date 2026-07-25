import { PageHeader } from "@/components/ui/PageHeader";
import { prisma } from "@/lib/db/prisma";
import { computeCampaignMetrics } from "@/lib/analytics/metrics";
import { CampaignCharts, CampaignTable } from "@/features/campaigns/CampaignViews";

export const metadata = { title: "Campaigns" };
export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const [campaigns, leads] = await Promise.all([
    prisma.campaign.findMany({ orderBy: { startDate: "desc" } }),
    prisma.lead.findMany({
      include: {
        quotes: { select: { status: true, sentAt: true } },
        bookings: { select: { id: true, revenue: true, bookedAt: true } },
      },
    }),
  ]);

  const metrics = campaigns.map((c) => computeCampaignMetrics(c, leads));

  return (
    <div>
      <PageHeader
        title="Campaign Performance"
        description="Compare spend, lead volume, and booking outcomes across Horizon Trails marketing campaigns."
      />
      <CampaignCharts campaigns={metrics} />
      <CampaignTable campaigns={metrics} />
    </div>
  );
}
