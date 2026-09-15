import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ApiError } from "@/lib/errors";

/**
 * Server-side, atomic rate limiting via the `otp_rate_check` SQL function.
 * Enforces resend cooldown + per-recipient/hr + per-IP/hr in one round trip.
 */
export async function enforceRateLimit(params: {
  projectId: string;
  recipientHash: string;
  ip: string | null;
  cooldownSecs: number;
}) {
  const db = supabaseAdmin();
  const { data, error } = await db.rpc("otp_rate_check", {
    p_project: params.projectId,
    p_recipient: params.recipientHash,
    p_ip: params.ip,
    p_cooldown_sec: params.cooldownSecs,
  });
  if (error) throw new ApiError("internal_error", "Rate limit check failed.");
  if (data === false) {
    throw new ApiError("rate_limited", "Too many verification requests. Please wait and retry.");
  }
}

export function clientIp(req: Request): string | null {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip");
}
