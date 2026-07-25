"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  Bot,
  Compass,
  FileText,
  LayoutDashboard,
  Mail,
  Users,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inquiry", label: "Inquiry", icon: Mail },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/campaigns", label: "Campaigns", icon: BarChart3 },
  { href: "/automations", label: "Automations", icon: Zap },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/demo", label: "Demo Guide", icon: BookOpen },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-sand-light">
      <aside className="no-print fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-navy text-white">
        <div className="border-b border-white/10 px-5 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal">
              <Compass className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-serif text-lg font-semibold leading-tight">TravelFlow</p>
              <p className="text-xs text-slate-light">Growth OS</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="demo">Demo Workspace</Badge>
            <Badge variant="outline" className="border-white/20 text-white/80">
              <Bot className="mr-1 h-3 w-3" />
              Demo AI Mode
            </Badge>
          </div>
          <p className="mt-3 text-xs text-slate-light">Horizon Trails Travel</p>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-teal text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 px-5 py-4">
          <p className="text-xs text-slate-light">
            Prototype only · Fictional agency data
          </p>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col pl-64">
        <main className="flex-1 px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
