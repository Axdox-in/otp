"use client";
import { useState } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Card, Input, Button } from "@/components/ui/primitives";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabaseBrowser().auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    setLoading(false);
    if (error) return setError(error.message);
    setMsg("Check your email to confirm your account, then sign in.");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-6">
      <div className="w-full max-w-sm animate-in">
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[var(--shadow-sm)]">
            <ShieldCheck className="h-5 w-5" strokeWidth={2.2} />
          </div>
          <span className="text-lg font-semibold tracking-tight">AXDOX Verify</span>
        </div>
        <Card className="p-6">
          <h1 className="text-xl font-semibold tracking-tight">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Start verifying users in minutes.</p>
          <form onSubmit={onSubmit} className="mt-5 space-y-3">
            <Input placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            <Input type="email" required placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input type="password" required minLength={8} placeholder="Password (min 8 chars)" value={password} onChange={(e) => setPassword(e.target.value)} />
            {error && <p className="text-sm text-red-500">{error}</p>}
            {msg && <p className="text-sm text-primary">{msg}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Creating…" : "Create account"}
            </Button>
          </form>
        </Card>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account? <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
