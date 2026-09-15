"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import type { Database } from "@/types/db";

export async function updateMemberRole(memberId: string, role: Database["member_role"]) {
  const supabase = await supabaseServer();
  // RLS "members managed by admins" enforces caller is owner/admin.
  const { error } = await supabase.from("members").update({ role }).eq("id", memberId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/organization");
}

export async function removeMember(memberId: string) {
  const supabase = await supabaseServer();
  const { error } = await supabase.from("members").delete().eq("id", memberId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/organization");
}
