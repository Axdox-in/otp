# AXDOX Verify

**WhatsApp-first verification API with automatic SMS and Email fallback.**
One endpoint verifies a user through the best available channel: WhatsApp → SMS → Email.

Stack: Next.js 15 (App Router) · TypeScript · Tailwind · Supabase (Postgres + Auth + RLS) · Vercel · Stripe/Razorpay · Sentry/PostHog.

---

## Architecture

```
Client / SDK ──▶ POST /api/v1/otp/send ─┐
                                         ▼
                          authenticateRequest (API key, hashed)
                                         ▼
                          enforceRateLimit (otp_rate_check RPC)
                                         ▼
                    sendVerification()  ── the fallback orchestrator
                       │  generate code (CSPRNG) → hash (HMAC, bound to request id)
                       │  create otp_requests row (Postgres = OTP store, TTL)
                       ▼
              ┌───────────────── cascade over project.channel_order ─────────────────┐
              ▼                         ▼                              ▼
     whatsappProvider           selectSmsProvider()            selectEmailProvider()
     (Meta Cloud API)      Telnyx│Twilio│MSG91│Vonage│         SES │ Resend │ SendGrid
                                  Exotel│Gupshup
              └── first success stops the cascade; each attempt logged to provider_logs ┘
                                         ▼
                    usage_logs (analytics + billing)  ·  webhooks fire on completion
```

Every provider implements one interface (`SendProvider`) so the cascade is
channel-agnostic and providers are hot-swappable.

---

## Folder structure

```
axdox-verify/
├─ supabase/migrations/        0001_schema · 0002_functions_triggers · 0003_rls
├─ src/
│  ├─ app/
│  │  ├─ api/v1/otp/{send,verify,status}/route.ts   # public API
│  │  ├─ api/webhooks/whatsapp/route.ts             # delivery receipts
│  │  ├─ (auth)/{login,register}/                    # Supabase Auth
│  │  └─ (dashboard)/{dashboard,api-keys,...}/       # RLS-scoped UI
│  ├─ lib/
│  │  ├─ env.ts                          # zod-validated env
│  │  ├─ errors.ts                       # stable ApiError codes
│  │  ├─ supabase/{admin,server,client}.ts
│  │  ├─ otp/{crypto,recipient}.ts       # CSPRNG, HMAC, masking, E.164
│  │  ├─ security/{api-key,rate-limit}.ts
│  │  ├─ providers/
│  │  │  ├─ types.ts  whatsapp.ts
│  │  │  ├─ sms/{index,twilio,msg91,vonage,telnyx,exotel,gupshup}.ts
│  │  │  └─ email/{index,resend,ses,sendgrid}.ts
│  │  ├─ services/verification.ts        # send + verify orchestrator
│  │  └─ billing/plans.ts
│  └─ middleware.ts                      # session refresh + dashboard guard
├─ sdks/{node,python,php}/               # official SDKs
├─ docs/{quickstart,deployment,production-checklist}.md
└─ postman/AXDOX-Verify.postman_collection.json
```

---

## Run locally

```bash
npm install
cp .env.example .env.local          # fill in Supabase + at least one provider per channel
openssl rand -hex 32                 # set OTP_PEPPER and API_KEY_PEPPER
supabase db push                     # apply the three migrations
npm run dev                          # http://localhost:3000
```

Then: register → create an org (RPC `create_organization`) → create a project →
generate an API key → call the API (see `docs/quickstart.md`).

---

## Security model (OWASP-aligned)

- **OTP codes** never stored — only `HMAC(code + request_id, pepper)`, verified in constant time.
- **API keys** stored as `SHA-256(pepper + key)`; plaintext shown once; scoped; revocable.
- **PII** (phone/email) stored hashed + masked, never plaintext, in `otp_requests`.
- **Rate limiting** atomic in Postgres: resend cooldown + per-recipient/hr + per-IP/hr (pumping guard).
- **RLS** on every table; the OTP API uses the service role behind API-key auth.
- **Single-use** codes, attempt caps, TTL expiry, signed WhatsApp webhooks.

---

## Build status

**✅ Phase 1 — Backend core (this commit)**
Schema + RLS + functions · OTP engine · provider abstraction (WhatsApp + 6 SMS + 3 email) ·
fallback orchestrator · v1 API (send/verify/status) · WhatsApp webhook · API-key + rate-limit
security · auth pages · dashboard shell + analytics + API-key management · billing plans ·
Node/Python/PHP SDKs · docs · Postman.

**🚧 Phase 2 — Dashboard depth (next)**
Full pages for Projects, OTP Logs, Analytics charts (Recharts), Usage, Webhooks CRUD,
Organization/members management, Settings/Profile. Each follows the existing
`(dashboard)/api-keys` server-action + RLS pattern.

**🚧 Phase 3 — Billing + ops**
Stripe + Razorpay checkout & webhooks, wallet debits wired to `usage_logs`, GST/VAT,
Sentry/PostHog wiring, webhook-based delivery-driven fallback (currently send-time fallback),
and SDK packaging/publishing.

See `docs/deployment.md` and `docs/production-checklist.md` before going live.
