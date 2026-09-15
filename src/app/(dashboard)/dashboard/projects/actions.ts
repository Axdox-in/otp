"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { getContext } from "@/lib/dashboard/context";

export async function createOrganization(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Organization name is required");
  const slug =
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") +
    "-" + Math.random().toString(36).slice(2, 6);
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("create_organization", { p_name: name, p_slug: slug });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard", "layout");
}

export async function createProject(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Project name is required");
  const ctx = await getContext();
  if (!ctx?.org) throw new Error("Create an organization first");
  const supabase = await supabaseServer();
  const { error } = await supabase.from("projects").insert({ org_id: ctx.org.id, name });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/projects");
}
