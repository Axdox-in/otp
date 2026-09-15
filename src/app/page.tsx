import Link from "next/link";
import {
  ShieldCheck, ArrowRight, MessageCircle, Smartphone, Mail,
  Zap, Globe, Lock, GitFork, BarChart3, RefreshCw,
} from "lucide-react";
import { CodeTabs } from "@/components/code-tabs";
import { sendTabs } from "@/lib/docs-snippets";

const FEATURES = [
  [MessageCircle, "WhatsApp-first", "Reach users on the channel they actually read — cheaper and higher-converting than SMS."],
  [GitFork, "Automatic fallback", "If WhatsApp can't deliver, it falls back to SMS, then Email. One request, best channel."],
  [Zap, "10-line integration", "Two endpoints: send and verify. SDKs for Node, Python, PHP — or plain REST."],
  [Lock, "Secure by default", "Hashed codes, single-use, expiry, rate limits, and SMS-pumping fraud protection."],
  [Globe, "Global reach", "WhatsApp, SMS and Email across countries, with per-project routing controls."],
  [BarChart3, "Built-in analytics", "See delivery, verification rate, channel mix and cost — live in your dashboard."],
] as const;

const CHANNELS = [
  [MessageCircle, "WhatsApp", "Primary"],
  [Smartphone, "SMS", "Fallback"],
  [Mail, "Email", "Final fallback"],
] as const;

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[var(--shadow-sm)]">
              <ShieldCheck className="h-[18px] w-[18px]" strokeWidth={2.2} />
            </div>
            <span className="font-semibold tracking-tight">AXDOX Verify</span>
          </div>
          <nav className="flex items-center gap-2 text-sm sm:gap-4">
            <Link href="/demo" className="text-muted-foreground hover:text-foreground">Demo</Link>
            <Link href="/docs" className="hidden text-muted-foreground hover:text-foreground sm:inline">Docs</Link>
            <Link href="/login" className="hidden text-muted-foreground hover:text-foreground sm:inline">Sign in</Link>
            <Link href="/register" className="inline-flex items-center gap-1 rounded-lg bg-primary px-3.5 py-1.5 font-medium text-primary-foreground hover:opacity-90">
              Get started <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/[0.07] to-transparent" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div className="animate-in">
            <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> WhatsApp · SMS · Email — one API
            </div>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
              User verification,<br /> the <span className="text-primary">WhatsApp-first</span> way.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted-foreground">
              Send one-time codes over WhatsApp, with automatic SMS and Email fallback. Add it to your app in
              minutes — we handle delivery, security, and fraud protection.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/register" className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground hover:opacity-90">
                Start for free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/demo" className="inline-flex items-center gap-1.5 rounded-lg border px-5 py-2.5 font-medium hover:bg-muted">
                ▶ Live demo
              </Link>
              <Link href="/docs" className="inline-flex items-center gap-1.5 rounded-lg border px-5 py-2.5 font-medium hover:bg-muted">
                Read the docs
              </Link>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">Free tier included · No credit card to start</p>
          </div>

          {/* Live code sample */}
          <div className="animate-in [animation-delay:80ms]">
            <div className="rounded-2xl border bg-card p-2 shadow-[var(--shadow-lg)]">
              <CodeTabs tabs={sendTabs} />
            </div>
          </div>
        </div>
      </section>

      {/* Channels */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-3 px-6 py-6 text-sm sm:gap-6">
          <span className="text-muted-foreground">Delivered over</span>
          {CHANNELS.map(([Icon, name, role]) => (
            <div key={name} className="flex items-center gap-2 rounded-lg border bg-card px-3 py-1.5">
              <Icon className="h-4 w-4 text-primary" />
              <span className="font-medium">{name}</span>
              <span className="text-xs text-muted-foreground">{role}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">Everything you need to verify users</h2>
          <p className="mt-3 text-muted-foreground">One API that picks the best channel, keeps codes safe, and shows you exactly what&apos;s happening.</p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(([Icon, title, desc]) => (
            <div key={title} className="rounded-2xl border bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t bg-muted/30">
        <div className="mx-auto max-w-4xl px-5 py-16 sm:px-6 lg:py-24">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">Live in three steps</h2>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              ["Create a project", "Sign up and grab an API key from the dashboard."],
              ["Call /send", "Send a code — WhatsApp first, SMS & Email as fallback."],
              ["Call /verify", "Confirm the code the user typed. Done."],
            ].map(([t, d], i) => (
              <div key={t} className="relative rounded-2xl border bg-card p-6">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{i + 1}</div>
                <h3 className="mt-4 font-semibold">{t}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/docs" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
              See the full docs <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-6 lg:py-24">
        <div className="overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/15 via-card to-card p-8 text-center sm:p-14">
          <RefreshCw className="mx-auto h-8 w-8 text-primary" />
          <h2 className="mt-4 text-3xl font-bold tracking-tight">Start verifying users today</h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">Free tier included. Add WhatsApp-first verification to your app in minutes.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/register" className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground hover:opacity-90">
              Get your API key <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/docs" className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-6 py-3 font-medium hover:bg-muted">
              Read the docs
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span className="font-medium text-foreground">AXDOX Verify</span>
          </div>
          <div className="flex gap-5">
            <Link href="/docs" className="hover:text-foreground">Docs</Link>
            <Link href="/login" className="hover:text-foreground">Sign in</Link>
            <Link href="/register" className="hover:text-foreground">Get started</Link>
          </div>
          <span>© {new Date().getFullYear()} AXDOX</span>
        </div>
      </footer>
    </div>
  );
}
