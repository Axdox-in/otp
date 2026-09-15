import { getContext } from "@/lib/dashboard/context";
import { supabaseServer } from "@/lib/supabase/server";
import { PageHeader, DataTable, EmptyState, Badge } from "@/components/ui/primitives";
import { ProjectSwitcher } from "@/components/project-switcher";
import Link from "next/link";

const STATUS_TONE: Record<string, "success" | "warn" | "danger" | "muted"> = {
  verified: "success",
  pending: "warn",
  failed: "danger",
  expired: "muted",
  cancelled: "muted",
};

export default async function LogsPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const ctx = await getContext(sp.project);
  if (!ctx) return null;
  if (!ctx.project) return <EmptyState title="Create a project first" />;

  const supabase = await supabaseServer();
  let query = supabase
    .from("otp_requests")
    .select("id, status, channel_used, recipient_masked, country, attempts, max_attempts, created_at, verified_at")
    .eq("project_id", ctx.project.id)
    .order("created_at", { ascending: false })
    .limit(100);
  if (sp.status) query = query.eq("status", sp.status);
  const { data: rows } = await query;

  const filters = ["all", "verified", "pending", "failed", "expired"];

  return (
    <div>
      <PageHeader
        title="OTP Logs"
        description="Recent verification requests (last 100)."
        action={<ProjectSwitcher projects={ctx.projects} currentId={ctx.project.id} />}
      />
      <div className="mb-4 flex gap-2">
        {filters.map((f) => (
          <Link
            key={f}
            href={`/dashboard/logs?project=${ctx.project!.id}${f === "all" ? "" : `&status=${f}`}`}
            className={`rounded-full px-3 py-1 text-xs ${
              (sp.status ?? "all") === f ? "bg-primary text-primary-foreground" : "border text-muted-foreground"
            }`}
          >
            {f}
          </Link>
        ))}
      </div>

      {!rows?.length ? (
        <EmptyState title="No verifications yet" hint="Call POST /api/v1/otp/send to see logs." />
      ) : (
        <DataTable head={["Recipient", "Channel", "Status", "Attempts", "Country", "Created"]}>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="px-4 py-3 font-mono text-xs">{r.recipient_masked}</td>
              <td className="px-4 py-3">{r.channel_used ? <Badge tone="muted">{r.channel_used}</Badge> : "—"}</td>
              <td className="px-4 py-3"><Badge tone={STATUS_TONE[r.status] ?? "muted"}>{r.status}</Badge></td>
              <td className="px-4 py-3 tabular-nums">{r.attempts}/{r.max_attempts}</td>
              <td className="px-4 py-3">{r.country ?? "—"}</td>
              <td className="px-4 py-3 text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
