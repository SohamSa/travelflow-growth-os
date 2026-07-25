import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string;
  subtext?: string;
  icon?: LucideIcon;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export function MetricCard({
  label,
  value,
  subtext,
  icon: Icon,
  trend,
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-white p-5 shadow-sm",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate">{label}</p>
          <p className="mt-1 font-serif text-2xl font-semibold text-navy">{value}</p>
          {subtext && (
            <p
              className={cn(
                "mt-1 text-xs",
                trend === "up" && "text-teal",
                trend === "down" && "text-coral",
                !trend && "text-slate-light",
              )}
            >
              {subtext}
            </p>
          )}
        </div>
        {Icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal/10">
            <Icon className="h-5 w-5 text-teal" />
          </div>
        )}
      </div>
    </div>
  );
}
