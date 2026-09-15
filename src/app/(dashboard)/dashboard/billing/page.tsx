import { getContext } from "@/lib/dashboard/context";
import { PLANS } from "@/lib/billing/plans";
import { PageHeader, Card, Button, Badge, EmptyState } from "@/components/ui/primitives";

export default async function BillingPage() {
  const ctx = await getContext();
  if (!ctx?.org) return <EmptyState title="Create an organization first" />;
  const current = ctx.org.plan;

  return (
    <div>
      <PageHeader
        title="Billing"
        description={`Current plan: ${PLANS[current].name}. Checkout (Stripe / Razorpay) ships in Phase 3.`}
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Object.values(PLANS).map((plan) => {
          const active = plan.tier === current;
          return (
            <Card key={plan.tier} className={`flex flex-col p-5 ${active ? "ring-2 ring-primary" : ""}`}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{plan.name}</h3>
                {active && <Badge tone="success">current</Badge>}
              </div>
              <div className="mt-3 text-3xl font-bold">
                {plan.monthlyUsd > 0 ? `$${plan.monthlyUsd}` : plan.tier === "enterprise" ? "Custom" : "$0"}
                {plan.monthlyUsd > 0 && <span className="text-sm font-normal text-muted-foreground">/mo</span>}
              </div>
              {plan.overageUsd > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">${plan.overageUsd.toFixed(2)} / verification overage</p>
              )}
              <ul className="mt-4 flex-1 space-y-1.5 text-sm text-muted-foreground">
                {plan.features.map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
              <Button className="mt-5" variant={active ? "outline" : "default"} disabled={active}>
                {active ? "Current plan" : plan.tier === "enterprise" ? "Contact sales" : "Upgrade"}
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
