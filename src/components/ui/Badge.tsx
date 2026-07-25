import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type BadgeVariant = "default" | "teal" | "sand" | "demo" | "outline" | "coral";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variants: Record<BadgeVariant, string> = {
  default: "bg-surface text-navy border border-border",
  teal: "bg-teal/10 text-teal border border-teal/20",
  sand: "bg-sand text-navy border border-sand",
  demo: "bg-teal text-white",
  outline: "border border-border bg-transparent text-slate",
  coral: "bg-coral/10 text-coral border border-coral/20",
};

export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
