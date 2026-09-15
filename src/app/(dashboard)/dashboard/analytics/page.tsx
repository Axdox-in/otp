import { getContext } from "@/lib/dashboard/context";
import { supabaseServer } from "@/lib/supabase/server";
import { PageHeader, StatTile, EmptyState } from "@/components/ui/primitives";
import { ProjectSwitcher } from "@/components/project-switcher";
import { AnalyticsCharts } from "./charts";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const sp = await searchParams;
  const ctx = await getContext(sp.project);
  if (!ctx) return null;
  if (!ctx.project) return <EmptyState title="Create a project first" />;

  const supabase = await supabaseServer();
  const since = new Date(Date.now() - 30 * 864e5).toISOString();
  const { data } = await supabase
    .from("otp_requests")
    .select("status, channel_used, country, created_at")
    .eq("project_id", ctx.project.id)
    .gte("created_at", since);

  const rows = data ?? [];
  const sentRows = rows.filter((r) => r.channel_used);
  const total = sentRows.length;
  const verified = rows.filter((r) => r.status === "verified").length;
  const chan = (c: string) => sentRows.filter((r) => r.channel_used === c).length;

  const channels = [
    { name: "WhatsApp", value: chan("whatsapp") },
    { name: "SMS", value: chan("sms") },
    { name: "Email", value: chan("email") },
  ].filter((c) => c.value > 0);

  // Daily buckets.
  const dayMap = new Map<string, { sent: number; verified: number }>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 864e5).toISOString().slice(5, 10);
    dayMap.set(d, { sent: 0, verified: 0 });
  }
  for (const r of rows) {
    const d = r.created_at.slice(5, 10);
    const bucket = dayMap.get(d);
    if (bucket) {
      if (r.channel_used) bucket.sent++;
      if (r.status === "verified") bucket.verified++;
    }
  }
  const daily = [...dayMap.entries()].map(([date, v]) => ({ date, ...v }));

  // Country breakdown (top 6).
  const countryMap = new Map<string, number>();
  for (const r of sentRows) countryMap.set(r.country ?? "XX", (countryMap.get(r.country ?? "XX") ?? 0) + 1);
  const countries = [...countryMap.entries()]
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return (
    <div>
      <PageHeader
        title="Verification Analytics"
        description="Delivery, conversion, and channel performance."
        action={<ProjectSwitcher projects={ctx.projects} currentId={ctx.project.id} />}
      />
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatTile label="Sent" value={total.toLocaleString()} />
        <StatTile label="Verified" value={verified.toLocaleString()} />
        <StatTile label="Verification rate" value={`${total ? Math.round((verified / total) * 100) : 0}%`} />
        <StatTile label="WhatsApp share" value={`${total ? Math.round((chan("whatsapp") / total) * 100) : 0}%`} />
      </div>

      {total === 0 ? (
        <EmptyState title="No data yet" hint="Send verifications to populate analytics." />
      ) : (
        <AnalyticsCharts daily={daily} channels={channels} countries={countries} />
      )}
    </div>
  );
}
