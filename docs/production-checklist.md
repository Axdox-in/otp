# Production Checklist

## Security
- [ ] `OTP_PEPPER` and `API_KEY_PEPPER` are 32+ random bytes, stored only in Vercel env.
- [ ] Service-role key never shipped to the client (only imported in `server-only` modules).
- [ ] RLS enabled on every table (`0003_rls.sql`) — verify with the Supabase linter.
- [ ] WhatsApp webhook signature verification on (`WHATSAPP_APP_SECRET` set).
- [ ] Rate limits tuned: resend cooldown, per-recipient/hr, per-IP/hr.
- [ ] API keys are hashed at rest; plaintext shown once; revocation works.
- [ ] No OTP code, full phone, or secret is ever logged.

## Reliability
- [ ] At least two SMS providers configured for failover.
- [ ] SES domain verified + warmed; SPF/DKIM/DMARC aligned.
- [ ] `expire_stale_otps()` scheduled via pg_cron.
- [ ] Sentry DSN set; error alerts routed.
- [ ] PostHog capturing funnel events (sent → delivered → verified).

## Billing
- [ ] Stripe + Razorpay webhooks verified and idempotent.
- [ ] Free-plan hard cap enforced; wallet debits atomic via the ledger.
- [ ] GST/VAT handled (Stripe Tax / Razorpay).

## Compliance
- [ ] India: DLT entity + header + template registered for SMS.
- [ ] Privacy Policy, ToS, DPA published; PII hashed; retention job running.
- [ ] Country allow-lists set per project to blunt SMS pumping.

## Pre-launch
- [ ] `npm run typecheck` and `npm run build` pass.
- [ ] Load test `/api/v1/otp/send` and `/verify`.
- [ ] Test + live key separation verified end-to-end.
