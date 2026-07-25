"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { format, subDays } from "date-fns";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { DESTINATIONS, SOURCE_LABELS } from "@/types";

export function DashboardFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const today = format(new Date(), "yyyy-MM-dd");
  const defaultStart = format(subDays(new Date(), 89), "yyyy-MM-dd");

  const apply = useCallback(
    (form: FormData) => {
      const params = new URLSearchParams();
      const start = String(form.get("start") ?? defaultStart);
      const end = String(form.get("end") ?? today);
      const source = String(form.get("source") ?? "ALL");
      const destination = String(form.get("destination") ?? "ALL");

      params.set("start", start);
      params.set("end", end);
      if (source !== "ALL") params.set("source", source);
      if (destination !== "ALL") params.set("destination", destination);

      startTransition(() => {
        router.push(`/dashboard?${params.toString()}`);
      });
    },
    [router, defaultStart, today],
  );

  return (
    <form
      action={apply}
      className="no-print mb-6 flex flex-wrap items-end gap-4 rounded-xl border border-border bg-white p-4 shadow-sm"
    >
      <div className="flex items-center gap-2 text-sm font-medium text-navy">
        <Filter className="h-4 w-4 text-teal" />
        Filters
      </div>
      <Input
        name="start"
        type="date"
        label="From"
        defaultValue={searchParams.get("start") ?? defaultStart}
        className="w-40"
      />
      <Input
        name="end"
        type="date"
        label="To"
        defaultValue={searchParams.get("end") ?? today}
        className="w-40"
      />
      <Select
        name="source"
        label="Source"
        defaultValue={searchParams.get("source") ?? "ALL"}
        className="w-44"
        options={[
          { value: "ALL", label: "All sources" },
          ...Object.entries(SOURCE_LABELS).map(([value, label]) => ({ value, label })),
        ]}
      />
      <Select
        name="destination"
        label="Destination"
        defaultValue={searchParams.get("destination") ?? "ALL"}
        className="w-44"
        options={[
          { value: "ALL", label: "All destinations" },
          ...DESTINATIONS.map((d) => ({ value: d, label: d })),
        ]}
      />
      <Button type="submit" disabled={pending} variant="secondary">
        {pending ? "Applying…" : "Apply"}
      </Button>
    </form>
  );
}
