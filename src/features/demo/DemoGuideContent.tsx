"use client";

import { useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { resetDemoData } from "@/app/actions/demo";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export function DemoResetButton() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  return (
    <div>
      <Button
        variant="coral"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await resetDemoData();
            setMessage(result.message);
          })
        }
      >
        <RefreshCw className={`h-4 w-4 ${pending ? "animate-spin" : ""}`} />
        {pending ? "Resetting…" : "Reset demo data"}
      </Button>
      {message && <p className="mt-2 text-sm text-slate">{message}</p>}
    </div>
  );
}

export function DemoGuideContent() {
  return (
    <div className="space-y-6">
      <Card className="border-teal/30 bg-teal/5">
        <CardContent className="py-4 text-sm text-navy">
          <strong>Disclaimer:</strong> This demo is a hypothesis based on publicly described travel-agency
          workflows and marketing patterns. It uses fictional Horizon Trails Travel data—not real JSP Media
          client records, CRM exports, or proprietary metrics.
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Three problems this prototype addresses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-slate">
          <div>
            <h3 className="font-medium text-navy">1. Fragmented inquiry handling</h3>
            <p className="mt-1">
              Travel inquiries arrive from web forms, ads, referrals, and email—with no unified scoring,
              assignment, or SLA tracking. Consultants lose time triaging instead of selling.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-navy">2. Marketing spend without booking attribution</h3>
            <p className="mt-1">
              Campaign dashboards show clicks and impressions, but leadership cannot see cost per booking,
              ROAS by channel, or which destinations drive revenue.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-navy">3. Manual follow-up at scale</h3>
            <p className="mt-1">
              Quote follow-ups, overdue reminders, and re-engagement depend on consultant memory. High-intent
              leads stall in Quote Sent while automations and AI drafts could accelerate response—under human
              review.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Architecture overview</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate">
          <ul className="space-y-2">
            <li>
              <Badge variant="teal" className="mr-2">
                Frontend
              </Badge>
              Next.js 15 App Router, Tailwind v4, Recharts dashboards, left-nav workspace shell
            </li>
            <li>
              <Badge variant="teal" className="mr-2">
                Data
              </Badge>
              Prisma + SQLite with seeded demo dataset (customers, leads, campaigns, bookings)
            </li>
            <li>
              <Badge variant="teal" className="mr-2">
                Intelligence
              </Badge>
              Rule-based lead scoring, analytics metrics, recommendation engine
            </li>
            <li>
              <Badge variant="teal" className="mr-2">
                Automation
              </Badge>
              Configurable rules for acknowledgment, tasks, overdue reminders, re-engagement
            </li>
            <li>
              <Badge variant="teal" className="mr-2">
                AI
              </Badge>
              Copilot with Demo AI Mode (default) or optional local Ollama—all drafts labeled for employee review
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Maya&apos;s story (sample consultant workflow)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate">
          <p>
            Maya opens the dashboard Monday morning and filters to Instagram leads for Italy. She sees a
            recommendation to protect referral conversion and notices three Quote Sent leads with no follow-up.
          </p>
          <p>
            She opens a high-score lead, reviews the AI inquiry summary, edits the initial response draft, and
            moves the stage to Contacted. She records a quote, then runs the automation evaluator to create
            overdue tasks for uncontacted leads from the weekend.
          </p>
          <p>
            By afternoon, she converts one quote to a booking—visible immediately in funnel and revenue charts.
            No emails were sent automatically; every customer-facing draft required her approval.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>JSP Media mapping (hypothesis)</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate">
          <p>
            For a boutique travel marketing client like those JSP Media serves, this workspace maps to:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>Inquiry capture → WordPress/form integrations or landing pages</li>
            <li>Lead pipeline → CRM stage management with consultant ownership</li>
            <li>Campaign analytics → Google/Meta spend imported or entered manually</li>
            <li>Automations → operational guardrails, not autonomous sending</li>
            <li>Copilot → draft acceleration for consultants, not customer-facing chatbots</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recommended demo sequence (~12 minutes)</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal space-y-3 pl-5 text-sm text-slate">
            <li>
              <strong className="text-navy">Dashboard</strong> — Show KPI cards, funnel, spend vs revenue, and
              one recommendation card.
            </li>
            <li>
              <strong className="text-navy">Inquiry</strong> — Submit a new inquiry; highlight scoring and link
              to lead profile.
            </li>
            <li>
              <strong className="text-navy">Lead detail</strong> — Stage change, note, quote, copilot draft with
              Demo AI Mode badge.
            </li>
            <li>
              <strong className="text-navy">Automations</strong> — Toggle a rule, run evaluator, show recent runs.
            </li>
            <li>
              <strong className="text-navy">Campaigns</strong> — Compare CPL, CPB, and ROAS across channels.
            </li>
            <li>
              <strong className="text-navy">Reports</strong> — Print preview and CSV export for leadership.
            </li>
          </ol>

          <div className="mt-6 border-t border-border pt-6">
            <p className="mb-3 text-sm font-medium text-navy">Reset between demos</p>
            <DemoResetButton />
            <p className="mt-2 text-xs text-slate-light">
              Also available via <code className="rounded bg-surface px-1">npm run db:reset</code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
