import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <DashboardShell email={user.email ?? ""}>{children}</DashboardShell>;
}
