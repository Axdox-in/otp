"use server";
import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import { supabaseServer } from "@/lib/supabase/server";

export async function createWebhook(formData: FormData) {
  const projectId = String(formData.get("project_id"));
  const url = String(formData.get("url") || "").trim();
  if (!/^https:\/\//.test(url)) throw new Error("Webhook URL must be https://");
  const events = String(formData.get("events") || "verification.completed,verification.failed")
    .split(",").map((s) => s.trim()).filter(Boolean);

  const supabase = await supabaseServer();
  const { error } = await supabase.from("webhooks").insert({
    project_id: projectId,
    url,
    events,
    secret: `whsec_${randomBytes(24).toString("base64url")}`,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/webhooks");
}

export async function deleteWebhook(id: string) {
  const supabase = await supabaseServer();
  const { error } = await supabase.from("webhooks").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/webhooks");
}
