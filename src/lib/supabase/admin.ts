import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { publicEnv, serverEnv } from "@/lib/env";

let _admin: SupabaseClient | null = null;

/**
 * Service-role client. BYPASSES RLS — use ONLY in trusted server contexts
 * (OTP API, webhooks, background jobs) where access is already authorized
 * by API key or signature. Never import into a client component.
 */
export function supabaseAdmin(): SupabaseClient {
  if (!_admin) {
    _admin = createClient(publicEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv().SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _admin;
}
