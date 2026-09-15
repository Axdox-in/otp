"use client";
import { useState } from "react";
import {
  ShieldCheck, MessageCircle, FileText, Loader2, CheckCircle2, Download,
  ArrowLeft, Code2, Building2,
} from "lucide-react";

type Step = "form" | "otp" | "done";

export default function DemoPage() {
  const [step, setStep] = useState<Step>("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDev, setShowDev] = useState(false);
  const [lastApi, setLastApi] = useState<unknown>(null);

  const [form, setForm] = useState({ name: "", email: "", phone: "+91", service: "Interior Design" });
  const [requestId, setRequestId] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [channel, setChannel] = useState("");

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const r = await fetch("/api/demo/send", {
        method: "POST", headers: { "Content-Type": "application/json" },
        // send the email too, so it can fall back WhatsApp → SMS → Email
        body: JSON.stringify({ to: form.phone, email_fallback: form.email }),
      });
      const data = await r.json();
      setLastApi(data);
      if (!r.ok) throw new Error(data?.error?.message || data?.error?.code || "Could not send code");
      setRequestId(data.request_id);
      setChannel(data.channel);
      setDevCode(data.dev_code ?? null);
      setStep("otp");
    } catch (err) { setError((err as Error).message); }
    finally { setLoading(false); }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const r = await fetch("/api/demo/verify", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request_id: requestId, code }),
      });
      const data = await r.json();
      setLastApi(data);
      if (!r.ok || !data.verified) throw new Error("Incorrect or expired code. Try again.");
      setStep("done");
    } catch (err) { setError((err as Error).message); }
    finally { setLoading(false); }
  }

  function reset() {
    setStep("form"); setError(null); setCode(""); setRequestId(""); setDevCode(null); setLastApi(null);
  }

  return (
    <div className="min-h-screen bg-[#0f1720] text-slate-100">
      {/* demo ribbon */}
      <div className="bg-amber-400 py-1.5 text-center text-xs font-medium text-amber-950">
        ⚡ Live demo — this sample website is powered by the AXDOX Verify API
      </div>

      {/* fake company nav */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400 text-amber-950"><Building2 className="h-5 w-5" /></div>
          <span className="text-lg font-bold tracking-tight">Meridian Interiors</span>
        </div>
        <nav className="hidden gap-6 text-sm text-slate-400 sm:flex">
          <span>Projects</span><span>Services</span><span>About</span><span>Contact</span>
        </nav>
      </header>

      <main className="mx-auto grid max-w-5xl items-center gap-10 px-6 py-12 lg:grid-cols-2 lg:py-20">
        {/* left: marketing */}
        <div>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Transform your space.
          </h1>
          <p className="mt-4 max-w-md text-slate-400">
            Download our 2026 design catalogue — 40 pages of projects, materials, and pricing. Verify your WhatsApp number and it&apos;s yours instantly.
          </p>
          <div className="mt-6 flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800/40 p-4">
            <FileText className="h-8 w-8 text-amber-400" />
            <div>
              <div className="font-semibold">Meridian Catalogue 2026.pdf</div>
              <div className="text-xs text-slate-400">12 MB · 40 pages</div>
            </div>
          </div>
        </div>

        {/* right: the OTP-gated card */}
        <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-6 shadow-2xl">
          {step === "form" && (
            <form onSubmit={sendOtp} className="space-y-3">
              <h2 className="text-xl font-bold">Download the brochure</h2>
              <p className="text-sm text-slate-400">Fill in your details — we&apos;ll send a code to your WhatsApp.</p>
              <input required placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2.5 text-sm outline-none focus:border-amber-400" />
              <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2.5 text-sm outline-none focus:border-amber-400" />
              <input required placeholder="WhatsApp number (+91…)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2.5 text-sm outline-none focus:border-amber-400" />
              <select value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })} className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2.5 text-sm outline-none focus:border-amber-400">
                <option>Interior Design</option><option>Modular Kitchen</option><option>Office Fit-out</option><option>Renovation</option>
              </select>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-400 py-3 font-semibold text-amber-950 hover:bg-amber-300 disabled:opacity-60">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                {loading ? "Sending…" : "Send WhatsApp code"}
              </button>
              <p className="text-center text-xs text-slate-500">🔒 Verified by AXDOX — we never share your number.</p>
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={verifyOtp} className="space-y-3">
              <button type="button" onClick={reset} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200"><ArrowLeft className="h-3 w-3" /> Back</button>
              <h2 className="text-xl font-bold">Enter the code</h2>
              <p className="text-sm text-slate-400">We sent a code to <b className="text-slate-200">{form.phone}</b> via <b className="text-amber-400">{channel}</b>.</p>
              {devCode && (
                <div className="rounded-lg border border-amber-400/40 bg-amber-400/10 p-2 text-center text-xs text-amber-300">
                  Demo mode — your code is <b className="font-mono text-base">{devCode}</b>
                </div>
              )}
              <input required inputMode="numeric" maxLength={6} placeholder="6-digit code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-3 text-center font-mono text-2xl tracking-[0.4em] outline-none focus:border-amber-400" />
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-400 py-3 font-semibold text-amber-950 hover:bg-amber-300 disabled:opacity-60">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                {loading ? "Verifying…" : "Verify & download"}
              </button>
            </form>
          )}

          {step === "done" && (
            <div className="space-y-4 text-center">
              <CheckCircle2 className="mx-auto h-14 w-14 text-green-400" />
              <h2 className="text-xl font-bold">Verified! 🎉</h2>
              <p className="text-sm text-slate-400">Thanks {form.name || "there"} — your number is confirmed. Here&apos;s your catalogue.</p>
              <a href="/catalogue.pdf" download="Meridian-Catalogue-2026.pdf" className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-500 py-3 font-semibold text-white hover:bg-green-400">
                <Download className="h-4 w-4" /> Download Catalogue.pdf
              </a>
              <div className="rounded-lg border border-slate-700 bg-slate-900 p-3 text-left text-xs text-slate-400">
                <div className="mb-1 font-semibold text-slate-300">Lead captured ✓</div>
                {form.name} · {form.email} · {form.phone} · {form.service}
              </div>
              <button onClick={reset} className="text-xs text-slate-400 hover:text-slate-200">Run the demo again</button>
            </div>
          )}
        </div>
      </main>

      {/* dev peek + footer */}
      <div className="mx-auto max-w-5xl px-6 pb-16">
        <button onClick={() => setShowDev((v) => !v)} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300">
          <Code2 className="h-3.5 w-3.5" /> {showDev ? "Hide" : "Show"} the API response (for developers)
        </button>
        {showDev && (
          <pre className="mt-2 overflow-x-auto rounded-lg border border-slate-700 bg-slate-900 p-3 text-xs text-slate-300">
{lastApi ? JSON.stringify(lastApi, null, 2) : "// run the demo to see the live API response"}
          </pre>
        )}
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="h-3.5 w-3.5 text-amber-400" /> Powered by <b className="text-slate-300">AXDOX Verify</b> — WhatsApp-first OTP
        </div>
      </div>
    </div>
  );
}
