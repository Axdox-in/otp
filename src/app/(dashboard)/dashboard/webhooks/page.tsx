import { getContext } from "@/lib/dashboard/context";
import { supabaseServer } from "@/lib/supabase/server";
import { PageHeader, Card, Input, Button, DataTable, EmptyState, Badge } from "@/components/ui/primitives";
import { ProjectSwitcher } from "@/components/project-switcher";
import { createWebhook } from "./actions";
import { DeleteWebhookButton } from "./delete-button";

export default async function WebhooksPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const sp = await searchParams;
  const ctx = await getContext(sp.project);
  if (!ctx) return null;
  if (!ctx.project) return <EmptyState title="Create a project first" />;

  const supabase = await supabaseServer();
  const { data: hooks } = await supabase
    .from("webhooks")
    .select("id, url, events, secret, active, created_at")
    .eq("project_id", ctx.project.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader
        title="Webhooks"
        description="We POST signed events (HMAC-SHA256 with the secret) on verification outcomes."
        action={<ProjectSwitcher projects={ctx.projects} currentId={ctx.project.id} />}
      />
      <Card className="mb-6 p-5">
        <form action={createWebhook} className="flex flex-wrap gap-2">
          <input type="hidden" name="project_id" value={ctx.project.id} />
          <Input name="url" placeholder="https://api.yourapp.com/webhooks/axdox" className="min-w-[320px] flex-1" required />
          <Input name="events" defaultValue="verification.completed,verification.failed" className="min-w-[260px]" />
          <Button type="submit">Add webhook</Button>
        </form>
      </Card>

      {!hooks?.length ? (
        <EmptyState title="No webhooks" hint="Add an endpoint to receive verification events." />
      ) : (
        <DataTable head={["URL", "Events", "Secret", "Status", ""]}>
          {hooks.map((h) => (
            <tr key={h.id}>
              <td className="px-4 py-3 font-mono text-xs">{h.url}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {h.events.map((e: string) => <Badge key={e} tone="muted">{e}</Badge>)}
                </div>
              </td>
              <td className="px-4 py-3 font-mono text-xs">{h.secret.slice(0, 12)}…</td>
              <td className="px-4 py-3">{h.active ? <Badge tone="success">active</Badge> : <Badge tone="muted">off</Badge>}</td>
              <td className="px-4 py-3 text-right"><DeleteWebhookButton id={h.id} /></td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
