import { PageHeader } from "@/components/ui/PageHeader";
import { prisma } from "@/lib/db/prisma";
import { ensureAutomationRules } from "@/lib/automation/engine";
import { AutomationsView } from "@/features/automations/AutomationsView";

export const metadata = { title: "Automations" };
export const dynamic = "force-dynamic";

export default async function AutomationsPage() {
  await ensureAutomationRules(prisma);

  const [rules, recentRuns] = await Promise.all([
    prisma.automationRule.findMany({ orderBy: { name: "asc" } }),
    prisma.automationRun.findMany({
      take: 20,
      orderBy: { executedAt: "desc" },
      include: {
        rule: { select: { name: true } },
        lead: {
          select: {
            customer: { select: { firstName: true, lastName: true } },
          },
        },
      },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Automations"
        description="Configure and monitor workflow rules for acknowledgments, follow-ups, overdue reminders, and re-engagement."
      />
      <AutomationsView rules={rules} recentRuns={recentRuns} />
    </div>
  );
}
