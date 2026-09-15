import "server-only";
import { supabaseServer } from "@/lib/supabase/server";

export interface Project {
  id: string;
  org_id: string;
  name: string;
  channel_order: ("whatsapp" | "sms" | "email")[];
  otp_length: number;
  otp_ttl_secs: number;
  max_attempts: number;
  resend_cooldown_secs: number;
  allowed_countries: string[];
  created_at: string;
}

export interface Org {
  id: string;
  name: string;
  slug: string;
  plan: "free" | "payg" | "growth" | "enterprise";
}

export interface DashboardContext {
  userId: string;
  email: string;
  org: Org | null;
  projects: Project[];
  project: Project | null;
}

/**
 * Loads the signed-in user's primary org + projects (RLS-scoped).
 * `preferredProjectId` selects the active project; falls back to the first.
 */
export async function getContext(preferredProjectId?: string): Promise<DashboardContext | null> {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: orgs } = await supabase
    .from("organizations")
    .select("id, name, slug, plan")
    .order("created_at")
    .limit(1);
  const org = (orgs?.[0] as Org) ?? null;

  let projects: Project[] = [];
  if (org) {
    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("org_id", org.id)
      .order("created_at");
    projects = (data as Project[]) ?? [];
  }

  const project = projects.find((p) => p.id === preferredProjectId) ?? projects[0] ?? null;
  return { userId: user.id, email: user.email ?? "", org, projects, project };
}
