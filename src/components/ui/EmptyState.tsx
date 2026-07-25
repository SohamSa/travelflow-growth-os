import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  className,
  action,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface px-6 py-12 text-center",
        className,
      )}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sand">
        <Icon className="h-6 w-6 text-teal" />
      </div>
      <h3 className="font-serif text-lg font-semibold text-navy">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-slate">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
