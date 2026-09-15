import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { serverEnv } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Database } from "@/types/db";

export const runtime = "nodejs";

/** GET: Meta webhook verification handshake. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  if (mode === "subscribe" && token === serverEnv().WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    return new Response(challenge ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

/** POST: delivery/read status updates → update provider_logs. */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifySignature(req, raw)) return new Response("Invalid signature", { status: 401 });

  const payload = JSON.parse(raw);
  const db = supabaseAdmin();

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      for (const status of change.value?.statuses ?? []) {
        const messageId: string = status.id;
        const state: string = status.status; // sent | delivered | read | failed
        await db
          .from("provider_logs")
          .update({ status: normalize(state) })
          .eq("provider_message_id", messageId)
          .eq("provider", "whatsapp_cloud");
      }
    }
  }
  return NextResponse.json({ received: true });
}

function normalize(s: string): Database["provider_status"] {
  const map: Record<string, Database["provider_status"]> = {
    sent: "sent",
    delivered: "delivered",
    read: "read",
    failed: "failed",
  };
  return map[s] ?? "accepted";
}

function verifySignature(req: Request, raw: string): boolean {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) return true; // dev fallback — set WHATSAPP_APP_SECRET in prod
  const header = req.headers.get("x-hub-signature-256") ?? "";
  const expected = "sha256=" + createHmac("sha256", secret).update(raw).digest("hex");
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
