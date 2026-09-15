"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, Menu, X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const DOCS_TOC = [
  ["Introduction", "introduction"],
  ["How it works", "how-it-works"],
  ["Quick start", "quickstart"],
  ["Full example", "example"],
  ["Authentication", "authentication"],
  ["Send an OTP", "send-otp"],
  ["Verify an OTP", "verify-otp"],
  ["Check status", "status"],
  ["Channels & fallback", "channels"],
  ["SDKs", "sdks"],
  ["Errors", "errors"],
  ["Rate limits", "rate-limits"],
  ["Webhooks", "webhooks"],
  ["FAQ", "faq"],
  ["Going live", "going-live"],
] as const;

export function DocsShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>(DOCS_TOC[0][1]);

  // Lock scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Scrollspy: highlight the section currently in view.
  useEffect(() => {
    const ids = DOCS_TOC.map(([, id]) => id);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    ids.forEach((id) => { const el = document.getElementById(id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  const nav = (
    <nav className="flex flex-col gap-0.5">
      {DOCS_TOC.map(([label, id]) => {
        const isActive = active === id;
        return (
          <a
            key={id}
            href={`#${id}`}
            onClick={() => setOpen(false)}
            className={cn(
              "relative rounded-lg px-3 py-2 text-sm transition-colors",
              isActive ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <span className={cn("absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-primary transition-opacity", isActive ? "opacity-100" : "opacity-0")} />
            {label}
          </a>
        );
      })}
    </nav>
  );

  const brand = (
    <Link href="/" className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[var(--shadow-sm)]">
        <ShieldCheck className="h-[18px] w-[18px]" strokeWidth={2.2} />
      </div>
      <div className="leading-tight">
        <div className="text-sm font-semibold tracking-tight">AXDOX</div>
        <div className="text-[11px] text-muted-foreground">Docs</div>
      </div>
    </Link>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b bg-background/90 px-4 backdrop-blur lg:hidden">
        {brand}
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        className={cn("fixed inset-0 z-30 bg-black/40 transition-opacity duration-300 lg:hidden", open ? "opacity-100" : "pointer-events-none opacity-0")}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r bg-[hsl(var(--sidebar))] px-3 py-5 transition-transform duration-300 ease-out",
          "lg:sticky lg:top-0 lg:z-0 lg:h-screen lg:translate-x-0",
          open ? "translate-x-0 shadow-[var(--shadow-lg)]" : "-translate-x-full lg:shadow-none",
        )}
      >
        <div className="flex items-center justify-between px-2 pb-6">
          {brand}
          <button onClick={() => setOpen(false)} aria-label="Close menu" className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 px-2 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">On this page</div>
        <div className="flex-1 overflow-y-auto">{nav}</div>

        <Link
          href="/dashboard"
          className="mt-4 inline-flex items-center justify-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Go to Dashboard <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </aside>

      {/* Content */}
      <main className="min-w-0 flex-1 pt-14 lg:pt-0">
        <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-10">{children}</div>
      </main>
    </div>
  );
}
