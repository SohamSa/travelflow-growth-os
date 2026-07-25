"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { createInquiry, type InquiryActionState } from "@/app/actions/inquiries";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { DESTINATIONS, SOURCE_LABELS, TRIP_TYPE_LABELS } from "@/types";

const INTEREST_OPTIONS = [
  "culture",
  "local food",
  "moderate luxury",
  "museums",
  "hiking",
  "beaches",
  "nightlife",
  "wildlife",
  "photography",
  "spa",
  "history",
  "wine",
  "family activities",
  "adventure sports",
];

const initialState: InquiryActionState = { ok: false };

export function InquiryForm() {
  const [state, formAction, pending] = useActionState(createInquiry, initialState);

  if (state.ok && state.leadId) {
    return (
      <Card className="max-w-2xl">
        <CardContent className="py-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-teal/10">
            <CheckCircle2 className="h-8 w-8 text-teal" />
          </div>
          <h2 className="font-serif text-2xl font-semibold text-navy">Inquiry received</h2>
          <p className="mt-2 text-slate">{state.message}</p>
          <p className="mt-4 text-sm text-slate">
            Your inquiry has been scored, assigned to a consultant, and queued for follow-up
            automations.
          </p>
          <Link
            href={`/leads/${state.leadId}`}
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-coral px-5 py-2.5 text-sm font-medium text-white hover:bg-coral-hover"
          >
            View lead profile
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>Plan your journey</CardTitle>
        <p className="text-sm text-slate">
          Submit a travel inquiry for Horizon Trails Travel. All fields are required unless noted.
        </p>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input
              name="fullName"
              label="Full name"
              required
              error={state.errors?.fullName?.[0]}
            />
          </div>
          <Input
            name="email"
            type="email"
            label="Email"
            required
            error={state.errors?.email?.[0]}
          />
          <Input
            name="phone"
            type="tel"
            label="Phone"
            required
            error={state.errors?.phone?.[0]}
          />
          <Select
            name="preferredDestination"
            label="Preferred destination"
            required
            error={state.errors?.preferredDestination?.[0]}
            options={DESTINATIONS.map((d) => ({ value: d, label: d }))}
          />
          <Select
            name="tripType"
            label="Trip type"
            required
            error={state.errors?.tripType?.[0]}
            options={Object.entries(TRIP_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
          />
          <Input
            name="travelStartDate"
            type="date"
            label="Travel start date"
            required
            error={state.errors?.travelStartDate?.[0]}
          />
          <Input
            name="travelEndDate"
            type="date"
            label="Travel end date"
            required
            error={state.errors?.travelEndDate?.[0]}
          />
          <Input
            name="travelerCount"
            type="number"
            label="Number of travelers"
            min={1}
            defaultValue={2}
            required
            error={state.errors?.travelerCount?.[0]}
          />
          <Input
            name="estimatedBudget"
            type="number"
            label="Estimated budget (USD)"
            min={500}
            required
            error={state.errors?.estimatedBudget?.[0]}
          />
          <Select
            name="preferredContactMethod"
            label="Preferred contact method"
            required
            options={[
              { value: "EMAIL", label: "Email" },
              { value: "PHONE", label: "Phone" },
              { value: "EITHER", label: "Either" },
            ]}
          />
          <Select
            name="marketingSource"
            label="How did you hear about us?"
            required
            options={Object.entries(SOURCE_LABELS).map(([value, label]) => ({ value, label }))}
          />

          <div className="sm:col-span-2">
            <fieldset>
              <legend className="mb-2 block text-sm font-medium text-navy">
                Interests (select at least one)
              </legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {INTEREST_OPTIONS.map((interest) => (
                  <label
                    key={interest}
                    className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm capitalize"
                  >
                    <input type="checkbox" name="interests" value={interest} className="accent-teal" />
                    {interest}
                  </label>
                ))}
              </div>
              {state.errors?.interests?.[0] && (
                <p className="mt-1 text-xs text-red-600">{state.errors.interests[0]}</p>
              )}
            </fieldset>
          </div>

          <div className="sm:col-span-2">
            <Textarea
              name="specialRequests"
              label="Special requests (optional)"
              placeholder="Dietary needs, accessibility, celebration details…"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="flex items-start gap-3 text-sm text-slate">
              <input type="checkbox" name="consent" required className="mt-1 accent-teal" />
              <span>
                I consent to Horizon Trails Travel storing my inquiry details and contacting me
                about travel planning. This demo does not send real emails or process payments.
              </span>
            </label>
            {state.errors?.consent?.[0] && (
              <p className="mt-1 text-xs text-red-600">{state.errors.consent[0]}</p>
            )}
          </div>

          {state.message && !state.ok && (
            <p className="sm:col-span-2 text-sm text-red-600">{state.message}</p>
          )}

          <div className="sm:col-span-2">
            <Button type="submit" variant="coral" size="lg" disabled={pending}>
              {pending ? "Submitting inquiry…" : "Submit inquiry"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
