"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, ShieldCheck } from "lucide-react";
import { SidebarNav } from "./sidebar-nav";
import { SignOut } from "./sign-out";
import { PageFade } from "./page-fade";
import { cn } from "@/lib/utils";

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[var(--shadow-sm)]">
        <ShieldCheck className="h-[18px] w-[18px]" strokeWidth={2.2} />
      </div>
      <div className="leading-tight">
        <div className="text-sm font-semibold tracking-tight">AXDOX</div>
        <div className="text-[11px] text-muted-foreground">Verify</div>
      </div>
    </div>
  );
}

export function DashboardShell({ email, children }: { email: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the drawer whenever the route changes (i.e. a nav link was tapped).
  useEffect(() => setOpen(false), [pathname]);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const initial = (email?.[0] ?? "?").toUpperCase();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b bg-background/90 px-4 backdrop-blur lg:hidden">
        <Brand />
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Backdrop (mobile only) */}
      <div
        onClick={() => setOpen(false)}
        className={cn(
          "fixed inset-0 z-30 bg-black/40 transition-opacity duration-300 lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-hidden="true"
      />

      {/* Sidebar: drawer on mobile, sticky column on desktop */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r bg-[hsl(var(--sidebar))] px-3 py-5 transition-transform duration-300 ease-out",
          "lg:sticky lg:top-0 lg:z-0 lg:h-screen lg:translate-x-0",
          open ? "translate-x-0 shadow-[var(--shadow-lg)]" : "-translate-x-full lg:shadow-none",
        )}
      >
        <div className="flex items-center justify-between px-2 pb-6">
          <Brand />
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <SidebarNav />
        </div>

        <div className="mt-4 flex items-center gap-2.5 rounded-lg border bg-card px-3 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-medium">{email}</div>
            <SignOut />
          </div>
        </div>
      </aside>

      {/* Main content (offset for the mobile top bar) */}
      <main className="min-w-0 flex-1 pt-14 lg:pt-0">
        <div className="mx-auto max-w-6xl px-5 py-6 sm:px-8 sm:py-8">
          <PageFade>{children}</PageFade>
        </div>
      </main>
    </div>
  );
}
