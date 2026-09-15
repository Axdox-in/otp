"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  const fullName = String(formData.get("full_name") || "").trim();
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  // RLS "users update self" restricts this to the caller's own row.
  const { error } = await supabase.from("users").update({ full_name: fullName }).eq("id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/profile");
}
