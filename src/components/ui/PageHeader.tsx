import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("mb-8 flex flex-wrap items-start justify-between gap-4", className)}>
      <div>
        <h1 className="font-serif text-3xl font-semibold text-navy">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-slate">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
