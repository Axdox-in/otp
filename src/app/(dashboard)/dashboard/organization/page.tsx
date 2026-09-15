import { getContext } from "@/lib/dashboard/context";
import { supabaseServer } from "@/lib/supabase/server";
import { PageHeader, DataTable, EmptyState, Card } from "@/components/ui/primitives";
import { MemberRow } from "./member-row";
import type { Database } from "@/types/db";

interface MemberRecord {
  user_id: string;
  email: string;
  full_name: string | null;
  role: Database["member_role"];
  member_id: string;
}

export default async function OrganizationPage() {
  const ctx = await getContext();
  if (!ctx?.org) return <EmptyState title="Create an organization first" />;

  const supabase = await supabaseServer();
  const { data: members } = await supabase.rpc("list_org_members", { p_org: ctx.org.id });
  const list = (members as MemberRecord[]) ?? [];

  return (
    <div>
      <PageHeader title="Organization" description={ctx.org.name} />
      <Card className="mb-6 p-5">
        <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-3">
          <div><div className="text-muted-foreground">Name</div><div className="font-medium">{ctx.org.name}</div></div>
          <div><div className="text-muted-foreground">Slug</div><div className="font-mono">{ctx.org.slug}</div></div>
          <div><div className="text-muted-foreground">Plan</div><div className="font-medium capitalize">{ctx.org.plan}</div></div>
        </div>
      </Card>

      <h2 className="mb-3 text-sm font-semibold">Members</h2>
      <DataTable head={["Member", "Role", ""]}>
        {list.map((m) => (
          <MemberRow key={m.member_id} member={m} isSelf={m.user_id === ctx.userId} />
        ))}
      </DataTable>
      <p className="mt-3 text-xs text-muted-foreground">
        Email-invite flow for new members ships in Phase 3. For now, members are added when they accept an invite link.
      </p>
    </div>
  );
}
