import { getContext } from "@/lib/dashboard/context";
import { PageHeader, Card, Input, Button, DataTable, EmptyState, Badge } from "@/components/ui/primitives";
import { createOrganization, createProject } from "./actions";

export default async function ProjectsPage() {
  const ctx = await getContext();
  if (!ctx) return null;

  if (!ctx.org) {
    return (
      <div className="max-w-md">
        <PageHeader title="Welcome to AXDOX" description="Create an organization to get started." />
        <Card className="p-5">
          <form action={createOrganization} className="flex gap-2">
            <Input name="name" placeholder="Acme Inc" required />
            <Button type="submit">Create org</Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Projects" description={`Organization: ${ctx.org.name}`} />
      <Card className="mb-6 p-5">
        <form action={createProject} className="flex gap-2">
          <Input name="name" placeholder="New project name" required className="max-w-xs" />
          <Button type="submit">Create project</Button>
        </form>
      </Card>

      {ctx.projects.length === 0 ? (
        <EmptyState title="No projects yet" hint="Create your first project above." />
      ) : (
        <DataTable head={["Name", "Channels", "OTP", "TTL", "Created"]}>
          {ctx.projects.map((p) => (
            <tr key={p.id}>
              <td className="px-4 py-3 font-medium">{p.name}</td>
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  {p.channel_order.map((c) => (
                    <Badge key={c} tone="muted">{c}</Badge>
                  ))}
                </div>
              </td>
              <td className="px-4 py-3 tabular-nums">{p.otp_length} digits</td>
              <td className="px-4 py-3 tabular-nums">{Math.round(p.otp_ttl_secs / 60)} min</td>
              <td className="px-4 py-3 text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
