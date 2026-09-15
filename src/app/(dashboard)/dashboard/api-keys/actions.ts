"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { generateApiKey } from "@/lib/security/api-key";

/**
 * Create an API key for a project. The RLS-bound client verifies the caller
 * can write to the project; the admin client persists the hash. The plaintext
 * key is returned ONCE and never stored.
 */
export async function createApiKey(formData: FormData) {
  const projectId = String(formData.get("project_id"));
  const env = (String(formData.get("env")) === "live" ? "live" : "test") as "test" | "live";
  const name = String(formData.get("name") || "default");

  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Authorization check via RLS: this read succeeds only if the user can see the project.
  const { data: project, error } = await supabase.from("projects").select("id").eq("id", projectId).single();
  if (error || !project) throw new Error("Project not found or access denied");

  const key = generateApiKey(env);
  const { error: insErr } = await supabaseAdmin().from("api_keys").insert({
    project_id: projectId,
    name,
    env,
    key_prefix: key.keyPrefix,
    key_hash: key.keyHash,
    last_four: key.lastFour,
    created_by: user.id,
  });
  if (insErr) throw new Error("Failed to create key");

  await supabaseAdmin().from("audit_logs").insert({
    actor_id: user.id,
    action: "apikey.create",
    target: projectId,
    metadata: { env, name },
  });

  revalidatePath("/dashboard/api-keys");
  // Return the plaintext once for the UI to display.
  return { fullKey: key.fullKey, prefix: key.keyPrefix };
}

export async function revokeApiKey(keyId: string) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  // RLS on api_keys enforces the caller has developer+ role on the org.
  const { error } = await supabase.from("api_keys").update({ revoked_at: new Date().toISOString() }).eq("id", keyId);
  if (error) throw new Error("Failed to revoke key");
  revalidatePath("/dashboard/api-keys");
}
