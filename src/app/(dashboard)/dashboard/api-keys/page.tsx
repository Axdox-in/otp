import { getContext } from "@/lib/dashboard/context";
import { supabaseServer } from "@/lib/supabase/server";
import { PageHeader, DataTable, EmptyState, Badge, Button } from "@/components/ui/primitives";
import { ProjectSwitcher } from "@/components/project-switcher";
import { CreateKeyForm } from "./create-key-form";
import { RevokeButton } from "./revoke-button";

export default async function ApiKeysPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { project: projectId } = await searchParams;
  const ctx = await getContext(projectId);
  if (!ctx) return null;
  if (!ctx.project) return <EmptyState title="Create a project first" hint="Projects → Create project." />;

  const supabase = await supabaseServer();
  const { data: keys } = await supabase
    .from("api_keys")
    .select("id, name, env, key_prefix, last_four, last_used_at, revoked_at, created_at")
    .eq("project_id", ctx.project.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader
        title="API Keys"
        description="Bearer tokens for the OTP API. Secrets are shown once at creation."
        action={<ProjectSwitcher projects={ctx.projects} currentId={ctx.project.id} />}
      />
      <CreateKeyForm projectId={ctx.project.id} />

      {!keys?.length ? (
        <EmptyState title="No keys yet" hint="Create a test key to start integrating." />
      ) : (
        <DataTable head={["Name", "Env", "Key", "Last used", "Status", ""]}>
          {keys.map((k) => (
            <tr key={k.id}>
              <td className="px-4 py-3 font-medium">{k.name}</td>
              <td className="px-4 py-3"><Badge tone={k.env === "live" ? "success" : "muted"}>{k.env}</Badge></td>
              <td className="px-4 py-3 font-mono text-xs">{k.key_prefix}…{k.last_four}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {k.last_used_at ? new Date(k.last_used_at).toLocaleString() : "never"}
              </td>
              <td className="px-4 py-3">
                {k.revoked_at ? <Badge tone="danger">revoked</Badge> : <Badge tone="success">active</Badge>}
              </td>
              <td className="px-4 py-3 text-right">
                {!k.revoked_at && <RevokeButton keyId={k.id} />}
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
