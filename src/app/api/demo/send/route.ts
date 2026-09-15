import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Demo-only proxy: exactly what an external customer's server would do — call
 * the AXDOX public API with a Bearer key. Used by the /demo page.
 */
export async function POST(req: Request) {
  const key = process.env.AXDOX_DEMO_KEY;
  if (!key) {
    return NextResponse.json({ error: { message: "AXDOX_DEMO_KEY not configured" } }, { status: 500 });
  }
  const { to, email_fallback } = await req.json().catch(() => ({}));
  if (!to) return NextResponse.json({ error: { message: "Missing 'to'" } }, { status: 400 });

  const origin = new URL(req.url).origin;
  const r = await fetch(`${origin}/api/v1/otp/send`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    // Pass the email so the cascade can fall back WhatsApp → SMS → Email.
    body: JSON.stringify({ to, email_fallback }),
  });
  const data = await r.json();
  return NextResponse.json(data, { status: r.status });
}
