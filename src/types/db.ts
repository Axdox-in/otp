/**
 * Hand-maintained enum/type helpers.
 * For full row typing, generate with:
 *   supabase gen types typescript --project-id <id> > src/types/supabase.ts
 */
export interface Database {
  channel_type: "whatsapp" | "sms" | "email";
  otp_status: "pending" | "verified" | "failed" | "expired" | "cancelled";
  provider_status: "accepted" | "sent" | "delivered" | "read" | "failed" | "undelivered";
  member_role: "owner" | "admin" | "developer" | "viewer";
  plan_tier: "free" | "payg" | "growth" | "enterprise";
}
