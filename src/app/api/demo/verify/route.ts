import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const key = process.env.AXDOX_DEMO_KEY;
  if (!key) {
    return NextResponse.json({ error: { message: "AXDOX_DEMO_KEY not configured" } }, { status: 500 });
  }
  const { request_id, code } = await req.json().catch(() => ({}));
  if (!request_id || !code) {
    return NextResponse.json({ error: { message: "Missing request_id or code" } }, { status: 400 });
  }

  const origin = new URL(req.url).origin;
  const r = await fetch(`${origin}/api/v1/otp/verify`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ request_id, code }),
  });
  const data = await r.json();
  return NextResponse.json(data, { status: r.status });
}
