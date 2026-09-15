import { supabaseServer } from "@/lib/supabase/server";
import { PageHeader, StatTile, EmptyState } from "@/components/ui/primitives";

/** Aggregates the signed-in user's org usage into headline verification metrics. */
export default async function DashboardHome() {
  const supabase = await supabaseServer();

  const { data: usage } = await supabase
    .from("usage_logs")
    .select("event, channel, created_at")
    .gte("created_at", new Date(Date.now() - 30 * 864e5).toISOString());

  const rows = usage ?? [];
  const sent = rows.filter((r) => r.event === "sent");
  const verified = rows.filter((r) => r.event === "verified").length;
  const totalSent = sent.length;
  const byChannel = (c: string) => sent.filter((r) => r.channel === c).length;
  const pct = (n: number) => (totalSent ? Math.round((n / totalSent) * 100) : 0);

  const tiles = [
    { label: "Sent (30d)", value: totalSent.toLocaleString() },
    { label: "Verified", value: verified.toLocaleString() },
    { label: "Verification rate", value: `${pct(verified)}%` },
    { label: "WhatsApp share", value: `${pct(byChannel("whatsapp"))}%` },
    { label: "SMS fallback", value: `${pct(byChannel("sms"))}%` },
    { label: "Email fallback", value: `${pct(byChannel("email"))}%` },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" description="Last 30 days across your organization." />
      <div className="stagger grid grid-cols-2 gap-4 md:grid-cols-3">
        {tiles.map((t) => (
          <StatTile key={t.label} label={t.label} value={t.value} />
        ))}
      </div>
      {totalSent === 0 && (
        <div className="mt-6">
          <EmptyState
            title="No verifications yet"
            hint="Create a project, generate an API key, and call POST /api/v1/otp/send to see data here."
          />
        </div>
      )}
    </div>
  );
}
