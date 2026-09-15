import type { Database } from "@/types/db";

export interface Plan {
  tier: Database["plan_tier"];
  name: string;
  monthlyUsd: number;
  includedVerifications: number;
  overageUsd: number; // per verification beyond included
  features: string[];
  stripePriceId?: string;
  razorpayPlanId?: string;
}

/**
 * Pricing is per successful verification (channel cost is absorbed in the rate).
 * Overage widens on WhatsApp/email-heavy traffic — that's your margin lever.
 */
export const PLANS: Record<Database["plan_tier"], Plan> = {
  free: {
    tier: "free",
    name: "Free",
    monthlyUsd: 0,
    includedVerifications: 100,
    overageUsd: 0, // hard cap on free
    features: ["100 verifications/mo", "All channels", "Test + live keys", "Community support"],
  },
  payg: {
    tier: "payg",
    name: "Pay as you go",
    monthlyUsd: 0,
    includedVerifications: 0,
    overageUsd: 0.04,
    features: ["$0.04 / verification", "No commitment", "WhatsApp → SMS → Email fallback", "Email support"],
    stripePriceId: process.env.STRIPE_PRICE_PAYG,
  },
  growth: {
    tier: "growth",
    name: "Growth",
    monthlyUsd: 99,
    includedVerifications: 5000,
    overageUsd: 0.03,
    features: ["5,000 verifications included", "$0.03 overage", "Webhooks + analytics", "Priority support"],
    stripePriceId: process.env.STRIPE_PRICE_GROWTH,
  },
  enterprise: {
    tier: "enterprise",
    name: "Enterprise",
    monthlyUsd: 0, // custom
    includedVerifications: 0,
    overageUsd: 0.02,
    features: ["Volume pricing from $0.02", "SLA + SSO", "Dedicated routes", "Solutions support"],
  },
};
