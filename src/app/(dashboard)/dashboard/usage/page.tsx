import { getContext } from "@/lib/dashboard/context";
import { supabaseServer } from "@/lib/supabase/server";
import { PageHeader, StatTile, DataTable, EmptyState } from "@/components/ui/primitives";
import { formatMicros } from "@/lib/utils";

export default async function UsagePage() {
  const ctx = await getContext();
  if (!ctx?.org) return <EmptyState title="Create an organization first" />;

  const supabase = await supabaseServer();
  const since = new Date(Date.now() - 30 * 864e5).toISOString();
  const { data: usage } = await supabase
    .from("usage_logs")
    .select("event, channel, cost_micros, created_at")
    .eq("org_id", ctx.org.id)
    .gte("created_at", since);

  const rows = usage ?? [];
  const sent = rows.filter((r) => r.event === "sent");
  const verified = rows.filter((r) => r.event === "verified").length;
  const costMicros = rows.reduce((s, r) => s + (r.cost_micros ?? 0), 0);

  const channels = ["whatsapp", "sms", "email"] as const;
  const byChannel = channels.map((c) => {
    const list = sent.filter((r) => r.channel === c);
    return { channel: c, count: list.length, cost: list.reduce((s, r) => s + (r.cost_micros ?? 0), 0) };
  });

  return (
    <div>
      <PageHeader title="Usage" description="Last 30 days across your organization." />
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatTile label="Sent" value={sent.length.toLocaleString()} />
        <StatTile label="Verified" value={verified.toLocaleString()} />
        <StatTile label="Verification rate" value={`${sent.length ? Math.round((verified / sent.length) * 100) : 0}%`} />
        <StatTile label="Est. channel cost" value={formatMicros(costMicros)} sub="provider cost, not price" />
      </div>

      <DataTable head={["Channel", "Sent", "Est. cost", "Avg / msg"]}>
        {byChannel.map((c) => (
          <tr key={c.channel}>
            <td className="px-4 py-3 font-medium capitalize">{c.channel}</td>
            <td className="px-4 py-3 tabular-nums">{c.count.toLocaleString()}</td>
            <td className="px-4 py-3 tabular-nums">{formatMicros(c.cost)}</td>
            <td className="px-4 py-3 tabular-nums">{c.count ? formatMicros(Math.round(c.cost / c.count)) : "—"}</td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
