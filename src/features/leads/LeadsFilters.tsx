"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { CONSULTANTS, DESTINATIONS, PIPELINE_STAGES, SOURCE_LABELS, STAGE_LABELS } from "@/types";

export function LeadsFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function apply(form: FormData) {
    const params = new URLSearchParams();
    const search = String(form.get("search") ?? "").trim();
    const stage = String(form.get("stage") ?? "ALL");
    const source = String(form.get("source") ?? "ALL");
    const destination = String(form.get("destination") ?? "ALL");
    const consultant = String(form.get("consultant") ?? "ALL");
    const view = searchParams.get("view") ?? "table";

    if (search) params.set("search", search);
    if (stage !== "ALL") params.set("stage", stage);
    if (source !== "ALL") params.set("source", source);
    if (destination !== "ALL") params.set("destination", destination);
    if (consultant !== "ALL") params.set("consultant", consultant);
    params.set("view", view);

    startTransition(() => router.push(`/leads?${params.toString()}`));
  }

  return (
    <form
      action={apply}
      className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-white p-4 shadow-sm"
    >
      <div className="relative min-w-[200px] flex-1">
        <Search className="absolute left-3 top-9 h-4 w-4 text-slate-light" />
        <Input
          name="search"
          label="Search"
          placeholder="Name, email, destination…"
          defaultValue={searchParams.get("search") ?? ""}
          className="pl-9"
        />
      </div>
      <Select
        name="stage"
        label="Stage"
        defaultValue={searchParams.get("stage") ?? "ALL"}
        className="w-36"
        options={[
          { value: "ALL", label: "All stages" },
          ...PIPELINE_STAGES.map((s) => ({ value: s, label: STAGE_LABELS[s] })),
        ]}
      />
      <Select
        name="source"
        label="Source"
        defaultValue={searchParams.get("source") ?? "ALL"}
        className="w-36"
        options={[
          { value: "ALL", label: "All sources" },
          ...Object.entries(SOURCE_LABELS).map(([value, label]) => ({ value, label })),
        ]}
      />
      <Select
        name="destination"
        label="Destination"
        defaultValue={searchParams.get("destination") ?? "ALL"}
        className="w-36"
        options={[
          { value: "ALL", label: "All" },
          ...DESTINATIONS.map((d) => ({ value: d, label: d })),
        ]}
      />
      <Select
        name="consultant"
        label="Consultant"
        defaultValue={searchParams.get("consultant") ?? "ALL"}
        className="w-40"
        options={[
          { value: "ALL", label: "All consultants" },
          ...CONSULTANTS.map((c) => ({ value: c, label: c })),
        ]}
      />
      <Button type="submit" variant="secondary" disabled={pending}>
        Filter
      </Button>
    </form>
  );
}
