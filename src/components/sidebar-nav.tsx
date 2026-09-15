"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FolderKanban, KeyRound, ScrollText, BarChart3,
  Gauge, CreditCard, Webhook, Building2, Settings, UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/projects", label: "Projects", icon: FolderKanban },
  { href: "/dashboard/api-keys", label: "API Keys", icon: KeyRound },
  { href: "/dashboard/logs", label: "OTP Logs", icon: ScrollText },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/usage", label: "Usage", icon: Gauge },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/webhooks", label: "Webhooks", icon: Webhook },
  { href: "/dashboard/organization", label: "Organization", icon: Building2 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
  { href: "/dashboard/profile", label: "Profile", icon: UserRound },
];

export function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-0.5">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm",
              active
                ? "bg-primary/10 font-medium text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <span
              className={cn(
                "absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-primary transition-all duration-200",
                active ? "opacity-100" : "opacity-0",
              )}
            />
            <Icon
              className={cn(
                "h-[18px] w-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110",
                active ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
              )}
              strokeWidth={2}
            />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
