"use client";

import { useTransition } from "react";
import { format } from "date-fns";
import {
  addNote,
  completeTask,
  createQuote,
  createTask,
  recordBooking,
  updateStage,
} from "@/app/actions/leads";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { CopilotPanel } from "@/features/copilot/CopilotPanel";
import {
  CONSULTANTS,
  LOST_REASONS,
  PIPELINE_STAGES,
  SOURCE_LABELS,
  STAGE_LABELS,
  TRIP_TYPE_LABELS,
  type LeadWithRelations,
} from "@/types";
import { formatCurrency, parseInterests, parseScoreExplanation } from "@/lib/utils";

export function LeadDetailView({ lead }: { lead: LeadWithRelations }) {
  const [pending, startTransition] = useTransition();

  function runAction(action: (fd: FormData) => Promise<{ ok: boolean; message: string }>, fd: FormData) {
    startTransition(async () => {
      await action(fd);
    });
  }

  const factors = parseScoreExplanation(lead.scoreExplanation);
  const interests = parseInterests(lead.interests);

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <div className="space-y-6 xl:col-span-2">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>
                  {lead.customer.firstName} {lead.customer.lastName}
                </CardTitle>
                <p className="mt-1 text-sm text-slate">{lead.customer.email}</p>
              </div>
              <Badge variant="teal">{STAGE_LABELS[lead.stage]}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm">
              <div>
                <dt className="text-slate">Destination</dt>
                <dd className="font-medium text-navy">{lead.destination}</dd>
              </div>
              <div>
                <dt className="text-slate">Trip type</dt>
                <dd className="font-medium text-navy">{TRIP_TYPE_LABELS[lead.tripType]}</dd>
              </div>
              <div>
                <dt className="text-slate">Travelers</dt>
                <dd className="font-medium text-navy">{lead.travelerCount}</dd>
              </div>
              <div>
                <dt className="text-slate">Dates</dt>
                <dd className="font-medium text-navy">
                  {lead.travelStartDate && lead.travelEndDate
                    ? `${format(lead.travelStartDate, "MMM d")} – ${format(lead.travelEndDate, "MMM d, yyyy")}`
                    : "Not specified"}
                </dd>
              </div>
              <div>
                <dt className="text-slate">Budget</dt>
                <dd className="font-medium text-navy">{formatCurrency(lead.estimatedBudget)}</dd>
              </div>
              <div>
                <dt className="text-slate">Source</dt>
                <dd className="font-medium text-navy">{SOURCE_LABELS[lead.source]}</dd>
              </div>
              <div>
                <dt className="text-slate">Consultant</dt>
                <dd className="font-medium text-navy">{lead.assignedConsultant}</dd>
              </div>
              <div>
                <dt className="text-slate">Score</dt>
                <dd className="font-medium text-teal">{lead.score}/100</dd>
              </div>
              <div>
                <dt className="text-slate">Customer type</dt>
                <dd className="font-medium text-navy">
                  {lead.customer.isReturning ? "Returning" : "New"}
                </dd>
              </div>
            </dl>

            {interests.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-slate">Interests</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {interests.map((i) => (
                    <Badge key={i} variant="sand" className="capitalize">
                      {i}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {lead.specialRequests && (
              <div className="mt-4 rounded-lg bg-sand/40 p-3 text-sm">
                <p className="font-medium text-navy">Special requests</p>
                <p className="mt-1 text-slate">{lead.specialRequests}</p>
              </div>
            )}

            {factors.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-navy">Score breakdown</p>
                <ul className="mt-2 space-y-1 text-xs text-slate">
                  {factors.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Update stage</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              action={(fd) => runAction(updateStage, fd)}
              className="flex flex-wrap items-end gap-3"
            >
              <input type="hidden" name="leadId" value={lead.id} />
              <Select
                name="stage"
                label="Stage"
                defaultValue={lead.stage}
                className="w-44"
                options={PIPELINE_STAGES.map((s) => ({ value: s, label: STAGE_LABELS[s] }))}
              />
              <Select
                name="lostReason"
                label="Lost reason (if lost)"
                className="w-56"
                options={[
                  { value: "", label: "Select reason…" },
                  ...LOST_REASONS.map((r) => ({ value: r, label: r })),
                ]}
              />
              <Button type="submit" disabled={pending}>
                Update stage
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Add note</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={(fd) => runAction(addNote, fd)} className="space-y-3">
                <input type="hidden" name="leadId" value={lead.id} />
                <Textarea name="note" label="Note" required placeholder="Consultant observation…" />
                <Button type="submit" variant="secondary" disabled={pending}>
                  Save note
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Create task</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={(fd) => runAction(createTask, fd)} className="space-y-3">
                <input type="hidden" name="leadId" value={lead.id} />
                <Input name="title" label="Title" required />
                <Input
                  name="dueAt"
                  type="datetime-local"
                  label="Due at"
                  required
                  defaultValue={format(new Date(Date.now() + 86400000), "yyyy-MM-dd'T'HH:mm")}
                />
                <Select
                  name="priority"
                  label="Priority"
                  defaultValue="MEDIUM"
                  options={[
                    { value: "LOW", label: "Low" },
                    { value: "MEDIUM", label: "Medium" },
                    { value: "HIGH", label: "High" },
                  ]}
                />
                <Select
                  name="assignedTo"
                  label="Assigned to"
                  defaultValue={lead.assignedConsultant}
                  options={CONSULTANTS.map((c) => ({ value: c, label: c }))}
                />
                <Button type="submit" variant="secondary" disabled={pending}>
                  Create task
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Send quote</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={(fd) => runAction(createQuote, fd)} className="space-y-3">
                <input type="hidden" name="leadId" value={lead.id} />
                <Input name="amount" type="number" label="Quote amount (USD)" required min={100} />
                <Button type="submit" variant="coral" disabled={pending}>
                  Record quote
                </Button>
              </form>
              {lead.quotes.length > 0 && (
                <ul className="mt-4 space-y-2 text-sm">
                  {lead.quotes.map((q) => (
                    <li key={q.id} className="flex justify-between text-slate">
                      <span>{formatCurrency(q.amount)}</span>
                      <Badge>{q.status}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Record booking</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={(fd) => runAction(recordBooking, fd)} className="space-y-3">
                <input type="hidden" name="leadId" value={lead.id} />
                <Input name="revenue" type="number" label="Revenue (USD)" required min={100} />
                <Input name="bookingReference" label="Reference (optional)" placeholder="HT-ABC123" />
                <Button type="submit" variant="coral" disabled={pending}>
                  Record booking
                </Button>
              </form>
              {lead.bookings.length > 0 && (
                <ul className="mt-4 space-y-2 text-sm">
                  {lead.bookings.map((b) => (
                    <li key={b.id} className="flex justify-between text-slate">
                      <span>{b.bookingReference}</span>
                      <span>{formatCurrency(b.revenue)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {lead.tasks.length === 0 ? (
              <p className="text-sm text-slate">No tasks yet.</p>
            ) : (
              <ul className="space-y-3">
                {lead.tasks.map((task) => (
                  <li
                    key={task.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3"
                  >
                    <div>
                      <p className={`text-sm font-medium ${task.completedAt ? "text-slate line-through" : "text-navy"}`}>
                        {task.title}
                      </p>
                      <p className="text-xs text-slate">
                        Due {format(task.dueAt, "MMM d, yyyy h:mm a")} · {task.assignedTo}
                      </p>
                    </div>
                    {!task.completedAt && (
                      <form action={(fd) => runAction(completeTask, fd)}>
                        <input type="hidden" name="taskId" value={task.id} />
                        <input type="hidden" name="leadId" value={lead.id} />
                        <Button type="submit" size="sm" variant="secondary">
                          Complete
                        </Button>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="relative space-y-4 border-l border-border pl-6">
              {lead.activities.map((activity) => (
                <li key={activity.id} className="relative">
                  <span className="absolute -left-[1.6rem] top-1 h-3 w-3 rounded-full border-2 border-white bg-teal" />
                  <p className="text-sm font-medium text-navy">{activity.title}</p>
                  <p className="text-sm text-slate">{activity.description}</p>
                  <p className="mt-1 text-xs text-slate-light">
                    {format(activity.occurredAt, "MMM d, yyyy h:mm a")}
                    {activity.isAutomated && " · Automated"}
                    {activity.channel && ` · ${activity.channel}`}
                  </p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>

      <div>
        <CopilotPanel leadId={lead.id} existingDrafts={lead.copilotDrafts} />
      </div>
    </div>
  );
}
