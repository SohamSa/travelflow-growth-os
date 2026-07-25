"use client";

import { useTransition } from "react";
import { format } from "date-fns";
import { Play, Power } from "lucide-react";
import { runEvaluation, toggleRule } from "@/app/actions/automations";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

interface Rule {
  id: string;
  name: string;
  trigger: string;
  action: string;
  enabled: boolean;
  runCount: number;
  lastRunAt: Date | null;
}

interface Run {
  id: string;
  status: string;
  summary: string;
  executedAt: Date;
  rule: { name: string };
  lead: { customer: { firstName: string; lastName: string } } | null;
}

export function AutomationsView({
  rules,
  recentRuns,
}: {
  rules: Rule[];
  recentRuns: Run[];
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-slate">
          Rules run on new inquiries automatically. Use the evaluator for overdue and lifecycle triggers.
        </p>
        <Button
          variant="coral"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await runEvaluation();
            })
          }
        >
          <Play className="h-4 w-4" />
          Run evaluator
        </Button>
      </div>

      <div className="grid gap-4">
        {rules.map((rule) => (
          <Card key={rule.id}>
            <CardContent className="flex flex-wrap items-start justify-between gap-4 py-5">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium text-navy">{rule.name}</h3>
                  <Badge variant={rule.enabled ? "teal" : "outline"}>
                    {rule.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-slate">
                  <span className="font-medium text-navy">Trigger: </span>
                  {rule.trigger}
                </p>
                <p className="mt-1 text-sm text-slate">
                  <span className="font-medium text-navy">Action: </span>
                  {rule.action}
                </p>
                <p className="mt-2 text-xs text-slate-light">
                  {rule.runCount} runs
                  {rule.lastRunAt && ` · Last run ${format(rule.lastRunAt, "MMM d, yyyy h:mm a")}`}
                </p>
              </div>
              <form
                action={(fd) => {
                  startTransition(async () => {
                    await toggleRule(fd);
                  });
                }}
              >
                <input type="hidden" name="ruleId" value={rule.id} />
                <input type="hidden" name="enabled" value={String(rule.enabled)} />
                <Button type="submit" variant="secondary" size="sm" disabled={pending}>
                  <Power className="h-4 w-4" />
                  {rule.enabled ? "Disable" : "Enable"}
                </Button>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent automation runs</CardTitle>
        </CardHeader>
        <CardContent>
          {recentRuns.length === 0 ? (
            <p className="text-sm text-slate">No runs recorded yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentRuns.map((run) => (
                <li
                  key={run.id}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-border p-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-navy">{run.rule.name}</p>
                    <p className="text-slate">{run.summary}</p>
                    {run.lead && (
                      <p className="text-xs text-slate-light">
                        Lead: {run.lead.customer.firstName} {run.lead.customer.lastName}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <Badge variant={run.status === "SUCCESS" ? "teal" : "sand"}>{run.status}</Badge>
                    <p className="mt-1 text-xs text-slate-light">
                      {format(run.executedAt, "MMM d, yyyy h:mm a")}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
