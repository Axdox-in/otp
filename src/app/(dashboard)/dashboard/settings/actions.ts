"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import type { Database } from "@/types/db";

const VALID: Database["channel_type"][] = ["whatsapp", "sms", "email"];

export async function updateProjectSettings(formData: FormData) {
  const projectId = String(formData.get("project_id"));

  const order = String(formData.get("channel_order") || "")
    .split(",").map((s) => s.trim().toLowerCase())
    .filter((c): c is Database["channel_type"] => (VALID as string[]).includes(c));
  if (order.length === 0) throw new Error("channel_order must include at least one of: whatsapp, sms, email");

  const otp_length = Math.min(10, Math.max(4, Number(formData.get("otp_length")) || 6));
  const otp_ttl_secs = Math.min(1800, Math.max(30, Number(formData.get("otp_ttl_secs")) || 300));
  const max_attempts = Math.min(10, Math.max(1, Number(formData.get("max_attempts")) || 5));
  const resend_cooldown_secs = Math.max(0, Number(formData.get("resend_cooldown_secs")) || 45);
  const allowed_countries = String(formData.get("allowed_countries") || "")
    .split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);

  const supabase = await supabaseServer();
  const { error } = await supabase
    .from("projects")
    .update({ channel_order: order, otp_length, otp_ttl_secs, max_attempts, resend_cooldown_secs, allowed_countries })
    .eq("id", projectId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/settings");
}
