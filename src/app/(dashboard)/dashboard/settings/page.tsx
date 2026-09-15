import { getContext } from "@/lib/dashboard/context";
import { PageHeader, Card, Input, Button, EmptyState } from "@/components/ui/primitives";
import { ProjectSwitcher } from "@/components/project-switcher";
import { updateProjectSettings } from "./actions";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-sm font-medium">{label}</div>
      {hint && <div className="mb-1 text-xs text-muted-foreground">{hint}</div>}
      {children}
    </label>
  );
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const sp = await searchParams;
  const ctx = await getContext(sp.project);
  if (!ctx) return null;
  if (!ctx.project) return <EmptyState title="Create a project first" />;
  const p = ctx.project;

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Project Settings"
        description={p.name}
        action={<ProjectSwitcher projects={ctx.projects} currentId={p.id} />}
      />
      <Card className="p-6">
        <form action={updateProjectSettings} className="space-y-5">
          <input type="hidden" name="project_id" value={p.id} />
          <Field label="Channel order" hint="Fallback cascade. Comma-separated: whatsapp, sms, email">
            <Input name="channel_order" defaultValue={p.channel_order.join(", ")} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="OTP length" hint="4–10 digits"><Input name="otp_length" type="number" defaultValue={p.otp_length} /></Field>
            <Field label="TTL (seconds)" hint="30–1800"><Input name="otp_ttl_secs" type="number" defaultValue={p.otp_ttl_secs} /></Field>
            <Field label="Max verify attempts" hint="1–10"><Input name="max_attempts" type="number" defaultValue={p.max_attempts} /></Field>
            <Field label="Resend cooldown (s)"><Input name="resend_cooldown_secs" type="number" defaultValue={p.resend_cooldown_secs} /></Field>
          </div>
          <Field label="Allowed countries" hint="ISO codes, comma-separated. Empty = allow all (tighten to blunt SMS pumping).">
            <Input name="allowed_countries" defaultValue={p.allowed_countries.join(", ")} placeholder="US, IN, GB" />
          </Field>
          <Button type="submit">Save settings</Button>
        </form>
      </Card>
    </div>
  );
}
