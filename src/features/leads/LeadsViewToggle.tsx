"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";

export function LeadsViewToggle() {
  const searchParams = useSearchParams();
  const view = searchParams.get("view") ?? "table";

  function buildHref(nextView: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", nextView);
    return `/leads?${params.toString()}`;
  }

  return (
    <div className="mb-4 flex gap-2">
      <Link
        href={buildHref("table")}
        className={cn(
          "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition",
          view === "table"
            ? "border-teal bg-teal text-white"
            : "border-border bg-white text-navy hover:bg-surface",
        )}
      >
        <List className="h-4 w-4" />
        Table
      </Link>
      <Link
        href={buildHref("pipeline")}
        className={cn(
          "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition",
          view === "pipeline"
            ? "border-teal bg-teal text-white"
            : "border-border bg-white text-navy hover:bg-surface",
        )}
      >
        <LayoutGrid className="h-4 w-4" />
        Pipeline
      </Link>
    </div>
  );
}
