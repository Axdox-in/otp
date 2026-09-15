import Link from "next/link";
import {
  ArrowRight, ArrowDown, Server, Smartphone, KeyRound, Info, Lightbulb,
  AlertTriangle, ChevronDown, Zap, Globe, ShieldCheck,
} from "lucide-react";
import { CodeBlock } from "@/components/code-block";
import { CodeTabs } from "@/components/code-tabs";
import { Badge } from "@/components/ui/primitives";
import { DocsShell } from "@/components/docs-shell";
import { API, sendTabs, verifyTabs, statusTabs, exampleTabs, sdkTabs, webhookTabs } from "@/lib/docs-snippets";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Docs — AXDOX Verify",
  description: "Add phone & email verification to your app in minutes.",
};

/* ---------- helpers ---------- */
function H({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="scroll-mt-24 mt-16 border-t pt-10 text-[26px] font-bold tracking-tight first:mt-0 first:border-t-0 first:pt-0">
      {children}
    </h2>
  );
}

function Method({ m }: { m: "POST" | "GET" }) {
  return (
    <span className={cn(
      "rounded-md px-2 py-0.5 font-mono text-[11px] font-bold tracking-wide",
      m === "POST" ? "bg-green-500/15 text-green-600 dark:text-green-400" : "bg-blue-500/15 text-blue-600 dark:text-blue-400",
    )}>{m}</span>
  );
}

function Endpoint({ method, path }: { method: "POST" | "GET"; path: string }) {
  return (
    <div className="my-4 flex items-center gap-3 rounded-xl border bg-muted/40 px-4 py-3">
      <Method m={method} />
      <code className="text-sm">{path}</code>
    </div>
  );
}

function Callout({ variant = "info", children }: { variant?: "info" | "tip" | "warn"; children: React.ReactNode }) {
  const map = {
    info: { cls: "border-primary/25 bg-primary/[0.06]", ic: "text-primary", Icon: Info },
    tip: { cls: "border-green-500/25 bg-green-500/[0.06]", ic: "text-green-600 dark:text-green-400", Icon: Lightbulb },
    warn: { cls: "border-amber-500/30 bg-amber-500/[0.08]", ic: "text-amber-600 dark:text-amber-400", Icon: AlertTriangle },
  }[variant];
  const { Icon } = map;
  return (
    <div className={cn("my-5 flex gap-3 rounded-xl border p-4 text-sm text-muted-foreground [&_p]:m-0", map.cls)}>
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", map.ic)} />
      <div>{children}</div>
    </div>
  );
}

function ResLabel({ children = "Response" }: { children?: string }) {
  return <div className="mb-1 mt-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{children}</div>;
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="group border-b last:border-0">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-medium text-foreground [&::-webkit-details-marker]:hidden">
        <span>{q}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <div className="pb-4 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </details>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{n}</div>
      <div className="pt-0.5">
        <div className="font-medium text-foreground">{title}</div>
        <div className="text-sm text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}

/* ---------- page ---------- */
export default function DocsPage() {
  return (
    <DocsShell>
      <div className="animate-in [&_p]:leading-relaxed [&_p]:text-muted-foreground">
        {/* Hero */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge>API v1</Badge>
          <span className="rounded-full border bg-card px-2.5 py-0.5 font-mono text-[11px] text-muted-foreground">
            Base URL: {API}
          </span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-[42px] sm:leading-[1.08]">
          Verify users in minutes
        </h1>
        <p className="mt-4 max-w-2xl text-lg">
          AXDOX Verify confirms a user owns a phone number or email by sending a one-time code — over
          <strong className="text-foreground"> WhatsApp, SMS, or Email</strong>, automatically. Two API calls. About 10 lines of code.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            [Zap, "Fast to add", "Two endpoints: send & verify."],
            [Globe, "Any language", "REST API + SDKs. 9 code samples."],
            [ShieldCheck, "Secure by default", "Hashing, expiry, rate limits, fraud guards."],
          ].map(([Icon, t, d]) => {
            const I = Icon as typeof Zap;
            return (
              <div key={t as string} className="rounded-xl border bg-card p-4">
                <I className="h-5 w-5 text-primary" />
                <div className="mt-2 text-sm font-semibold text-foreground">{t as string}</div>
                <div className="text-xs text-muted-foreground">{d as string}</div>
              </div>
            );
          })}
        </div>

        <H id="introduction">Introduction</H>
        <p>
          You call two endpoints from your app&apos;s backend: one to <strong className="text-foreground">send</strong> a code,
          one to <strong className="text-foreground">check</strong> it. AXDOX generates the code, delivers it through the best
          available channel, and tells you if the user entered it correctly. That&apos;s the whole product.
        </p>
        <Callout variant="tip">
          Your users never see &quot;AXDOX&quot; — they just receive a code. You only need your API key and these two endpoints.
        </Callout>

        <H id="how-it-works">How it works</H>
        <p>Your app&apos;s server talks to AXDOX. Your users only receive the code — they never talk to AXDOX directly.</p>
        <div className="my-5 rounded-2xl border bg-card p-5 shadow-[var(--shadow-sm)]">
          <div className="flex flex-col items-center gap-2 text-center text-sm">
            <div className="flex items-center gap-2 rounded-lg border bg-background px-4 py-2.5"><Smartphone className="h-4 w-4 text-muted-foreground" /> User enters phone/email on <strong className="text-foreground">your</strong> site</div>
            <ArrowDown className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2 rounded-lg border bg-background px-4 py-2.5"><Server className="h-4 w-4 text-muted-foreground" /> Your server → <code className="rounded bg-muted px-1.5 py-0.5">POST /otp/send</code></div>
            <ArrowDown className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-4 py-2.5 font-medium text-primary">AXDOX sends the code → WhatsApp, else SMS, else Email</div>
            <ArrowDown className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2 rounded-lg border bg-background px-4 py-2.5"><Server className="h-4 w-4 text-muted-foreground" /> User types code → your server → <code className="rounded bg-muted px-1.5 py-0.5">POST /otp/verify</code></div>
            <ArrowDown className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-4 py-2.5 font-medium text-primary">AXDOX replies ✓ verified — you log the user in</div>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex gap-3 rounded-xl border bg-card p-4 text-sm text-muted-foreground">
            <Server className="h-5 w-5 shrink-0 text-primary" />
            <div><strong className="text-foreground">You call our URL.</strong> Requests go to <code className="rounded bg-muted px-1 py-0.5">{API}</code> — not your own site.</div>
          </div>
          <div className="flex gap-3 rounded-xl border bg-card p-4 text-sm text-muted-foreground">
            <KeyRound className="h-5 w-5 shrink-0 text-primary" />
            <div><strong className="text-foreground">Your key identifies you.</strong> Keep it on your server, never in the browser.</div>
          </div>
        </div>

        <H id="quickstart">Quick start</H>
        <div className="my-5 space-y-4 rounded-2xl border bg-card p-5">
          <Step n={1} title="Create a project">Sign in to the <Link href="/dashboard" className="text-primary hover:underline">dashboard</Link> and create a project.</Step>
          <Step n={2} title="Get your API key"><strong className="text-foreground">API Keys → Create key</strong>, copy the secret (shown once). Use a <code className="rounded bg-muted px-1 py-0.5">test</code> key while building.</Step>
          <Step n={3} title="Call two endpoints from your backend">Send a code, then check it. That&apos;s the whole integration.</Step>
        </div>
        <p className="text-sm">Send a code — pick your language (the choice applies to every sample on this page):</p>
        <CodeTabs tabs={sendTabs} />
        <p className="text-sm">Then check the code the user typed — see <a href="#verify-otp" className="text-primary hover:underline">Verify an OTP</a>.</p>

        <H id="example">Full example — verify at signup</H>
        <p>The complete flow: add <strong className="text-foreground">two routes on your own server</strong> — one starts verification, one confirms it. Your frontend only ever calls your own routes.</p>
        <CodeTabs tabs={exampleTabs} />

        <H id="authentication">Authentication</H>
        <p>Send your API key in the <code className="rounded bg-muted px-1.5 py-0.5">Authorization</code> header as a Bearer token. Keys are <code className="rounded bg-muted px-1.5 py-0.5">axk_test_…</code> (building) or <code className="rounded bg-muted px-1.5 py-0.5">axk_live_…</code> (production).</p>
        <CodeBlock label="header" code={`Authorization: Bearer axk_live_YOUR_KEY`} />
        <Callout variant="warn">Keep API keys on your <strong className="text-foreground">server only</strong> — never in frontend/browser code, or anyone could read and use them.</Callout>

        <H id="send-otp">Send an OTP</H>
        <Endpoint method="POST" path="/api/v1/otp/send" />
        <CodeTabs tabs={sendTabs} />
        <ResLabel>Parameters</ResLabel>
        <div className="my-2 overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left"><tr><th className="px-4 py-2 font-semibold">Field</th><th className="px-4 py-2 font-semibold">Type</th><th className="px-4 py-2 font-semibold">Description</th></tr></thead>
            <tbody className="divide-y [&_td]:px-4 [&_td]:py-2 [&_td]:align-top">
              <tr><td className="font-mono text-xs">to</td><td className="text-muted-foreground">string, required</td><td className="text-muted-foreground">Phone in E.164 (<code>+14155552671</code>) or an email address.</td></tr>
              <tr><td className="font-mono text-xs">email_fallback</td><td className="text-muted-foreground">string</td><td className="text-muted-foreground">Email used as final fallback when <code>to</code> is a phone.</td></tr>
              <tr><td className="font-mono text-xs">channel</td><td className="text-muted-foreground">string</td><td className="text-muted-foreground">Force one: <code>whatsapp</code>, <code>sms</code>, <code>email</code> (default: auto).</td></tr>
              <tr><td className="font-mono text-xs">metadata</td><td className="text-muted-foreground">object</td><td className="text-muted-foreground">Optional key/values stored with the request.</td></tr>
            </tbody>
          </table>
        </div>
        <ResLabel />
        <CodeBlock label="200 · application/json" code={`{
  "request_id": "8f3c1e2a-...",
  "status": "pending",
  "channel": "whatsapp",
  "to": "+14*****2671",
  "expires_at": "2026-01-01T10:05:00Z"
}`} />

        <H id="verify-otp">Verify an OTP</H>
        <Endpoint method="POST" path="/api/v1/otp/verify" />
        <CodeTabs tabs={verifyTabs} />
        <ResLabel />
        <CodeBlock label="200 · application/json" code={`{ "status": "approved", "verified": true }
// status: approved | denied | expired | already_verified`} />
        <p>Codes are single-use, expire (5 min default), and lock after a few wrong tries — configurable in <strong className="text-foreground">Settings</strong>.</p>

        <H id="status">Check status</H>
        <Endpoint method="GET" path="/api/v1/otp/status?request_id=…" />
        <CodeTabs tabs={statusTabs} />
        <ResLabel />
        <CodeBlock label="200 · application/json" code={`{ "request_id": "8f3c...", "status": "verified", "channel": "whatsapp",
  "attempts": 1, "expires_at": "...", "verified_at": "..." }`} />

        <H id="channels">Channels &amp; fallback</H>
        <p>AXDOX tries channels in order and stops at the first that delivers:</p>
        <div className="my-4 flex flex-wrap items-center gap-2 text-sm">
          <Badge tone="success">1 · WhatsApp</Badge> <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <Badge tone="warn">2 · SMS</Badge> <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <Badge tone="muted">3 · Email</Badge>
        </div>
        <p>Change the order per project in <strong className="text-foreground">Settings</strong>, or force one with the <code className="rounded bg-muted px-1.5 py-0.5">channel</code> field. Add <code className="rounded bg-muted px-1.5 py-0.5">email_fallback</code> to also cover email for phone recipients.</p>

        <H id="sdks">SDKs <span className="align-middle text-base font-normal text-muted-foreground">(optional)</span></H>
        <p>You can call the REST API directly in <strong className="text-foreground">any language</strong> (see samples above). For convenience we also ship thin SDKs for these languages:</p>
        <CodeTabs tabs={sdkTabs} />
        <Callout variant="info">Don&apos;t see your language here? Just use the <a href="#send-otp" className="text-primary underline">REST examples</a> — an SDK is only a small wrapper around the same two HTTP calls.</Callout>

        <H id="errors">Errors</H>
        <p>Errors return a stable <code className="rounded bg-muted px-1.5 py-0.5">code</code> to branch on, plus a <code className="rounded bg-muted px-1.5 py-0.5">request_id</code> for support.</p>
        <CodeBlock label="error shape" code={`{ "error": { "code": "rate_limited", "message": "..." }, "request_id": "..." }`} />
        <div className="my-4 overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left"><tr><th className="px-4 py-2 font-semibold">Code</th><th className="px-4 py-2 font-semibold">HTTP</th><th className="px-4 py-2 font-semibold">Meaning</th></tr></thead>
            <tbody className="divide-y [&_td]:px-4 [&_td]:py-2 [&_td]:text-muted-foreground [&_td:first-child]:font-mono [&_td:first-child]:text-xs">
              <tr><td>unauthorized</td><td>401</td><td>Missing or invalid API key.</td></tr>
              <tr><td>invalid_recipient</td><td>400</td><td>Phone/email is malformed.</td></tr>
              <tr><td>rate_limited</td><td>429</td><td>Too many requests for this recipient/IP.</td></tr>
              <tr><td>expired</td><td>410</td><td>The code expired.</td></tr>
              <tr><td>max_attempts_exceeded</td><td>429</td><td>Too many wrong guesses.</td></tr>
              <tr><td>all_channels_failed</td><td>502</td><td>No channel could deliver.</td></tr>
            </tbody>
          </table>
        </div>

        <H id="rate-limits">Rate limits</H>
        <p>To stop abuse and SMS-pumping fraud, sends are limited per recipient and per IP, with a resend cooldown. Hitting a limit returns <code className="rounded bg-muted px-1.5 py-0.5">429 rate_limited</code> — wait and retry. Limits are configurable per project.</p>

        <H id="webhooks">Webhooks</H>
        <p>Get notified on your own server the moment a verification finishes — no polling. Register an endpoint in the dashboard under <strong className="text-foreground">Webhooks</strong>.</p>
        <Callout variant="info">Events are delivered as an HTTPS <code className="rounded bg-muted px-1 py-0.5">POST</code> with a JSON body. Every request is signed so you can confirm it came from AXDOX.</Callout>
        <ResLabel>Events</ResLabel>
        <div className="my-2 overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left"><tr><th className="px-4 py-2 font-semibold">Event</th><th className="px-4 py-2 font-semibold">Fires when</th></tr></thead>
            <tbody className="divide-y [&_td]:px-4 [&_td]:py-2 [&_td]:text-muted-foreground [&_td:first-child]:font-mono [&_td:first-child]:text-xs">
              <tr><td>verification.completed</td><td>The user entered the correct code.</td></tr>
              <tr><td>verification.failed</td><td>Expired, or too many wrong attempts.</td></tr>
            </tbody>
          </table>
        </div>
        <ResLabel>Example payload</ResLabel>
        <CodeBlock label="POST to your endpoint" code={`{
  "type": "verification.completed",
  "request_id": "8f3c...",
  "channel": "whatsapp",
  "to": "+14*****2671",
  "verified_at": "2026-01-01T10:04:12Z"
}`} />
        <p className="mt-4 font-medium text-foreground">Verify the signature</p>
        <p>Each request includes an <code className="rounded bg-muted px-1.5 py-0.5">X-AXDOX-Signature</code> header — an HMAC-SHA256 of the raw body using your webhook secret. Always check it before trusting the event.</p>
        <CodeTabs tabs={webhookTabs} />

        <H id="faq">FAQ</H>
        <div className="my-4 rounded-2xl border bg-card px-5">
          <Faq q="Which URL do I call — mine or AXDOX's?">Always <strong className="text-foreground">AXDOX&apos;s URL</strong> (<code className="rounded bg-muted px-1 py-0.5">{API}</code>). Your own website&apos;s address is irrelevant — your server just makes HTTP calls to AXDOX.</Faq>
          <Faq q="Where does my API key go?">On your <strong className="text-foreground">server only</strong> (an environment variable). Never in frontend/browser code.</Faq>
          <Faq q="Do my users see &quot;AXDOX&quot;?">No. They just receive a code on WhatsApp/SMS/email. AXDOX is invisible to them.</Faq>
          <Faq q="Do I generate or store the code myself?">No. AXDOX generates it, stores it securely, and checks it. You only pass the code the user typed to <code className="rounded bg-muted px-1 py-0.5">/verify</code>.</Faq>
          <Faq q="Which channel gets used?">Automatic: WhatsApp first, then SMS, then Email. The <code className="rounded bg-muted px-1 py-0.5">/send</code> response tells you which was used.</Faq>
          <Faq q="Test vs live keys?">Use <code className="rounded bg-muted px-1 py-0.5">axk_test_</code> while building, then switch to <code className="rounded bg-muted px-1 py-0.5">axk_live_</code> in production. Same code, different key.</Faq>
        </div>

        <H id="going-live">Going live</H>
        <div className="my-4 space-y-4 rounded-2xl border bg-card p-5">
          <Step n={1} title="Swap to a live key">Replace your <code className="rounded bg-muted px-1 py-0.5">axk_test_</code> key with an <code className="rounded bg-muted px-1 py-0.5">axk_live_</code> key.</Step>
          <Step n={2} title="Lock down countries">Restrict allowed countries in Settings to the markets you serve.</Step>
          <Step n={3} title="Protect your keys">Keep them server-side; rotate immediately if exposed.</Step>
          <Step n={4} title="Watch the numbers">Monitor delivery &amp; conversion in Analytics.</Step>
        </div>
        <div className="my-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-gradient-to-br from-primary/10 to-transparent p-6">
          <div>
            <div className="text-lg font-semibold">Ready to integrate?</div>
            <div className="text-sm text-muted-foreground">Grab an API key and send your first code.</div>
          </div>
          <Link href="/dashboard/api-keys" className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
            Get API keys <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </DocsShell>
  );
}
