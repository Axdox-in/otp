# AXDOX Verify — Complete Implementation Guide

Everything needed to set up, run, test, extend, and deploy AXDOX Verify — a
WhatsApp-first OTP verification platform with automatic SMS and Email fallback.

> **What it is:** a Twilio-Verify-style API. Your customers sign up on the
> dashboard, get an API key, and call two endpoints (`/send`, `/verify`) from
> their own website. AXDOX generates the code, delivers it via the best channel
> (WhatsApp → SMS → Email), and confirms it — handling security, retries, and
> abuse protection.

---

## 0. Table of contents
1. Architecture at a glance
2. Prerequisites
3. Project structure
4. Setup — step by step
5. First run (create account → org → project → key)
6. Testing (no external accounts needed)
7. Configure channels (Email, WhatsApp, SMS)
8. How your customers integrate
9. Dashboard reference
10. Security model
11. Database schema
12. Deployment (Vercel + Supabase)
13. Going live checklist
14. Helper scripts
15. Troubleshooting (issues we hit + fixes)
16. Current status

---

## 1. Architecture at a glance

```
CUSTOMER'S WEBSITE                    AXDOX (this app)                 CHANNELS
─────────────────                    ────────────────                 ────────
 user enters phone ──▶ POST /api/v1/otp/send ──▶ auth key ─▶ rate limit
                                                  │
                                                  ▼
                                        generate code (CSPRNG)
                                        store HMAC hash (Postgres, TTL)
                                                  │
                                                  ▼
                                        Fallback engine  ──▶ WhatsApp (Meta Cloud API)
                                        (per project order) ─▶ SMS (Twilio/MSG91/…)
                                                            └▶ Email (SES/Resend/…)
 user enters code ──▶ POST /api/v1/otp/verify ─▶ constant-time hash compare
                                                  ▼
                                          { verified: true }  +  usage/analytics
```

- **Frontend + API:** Next.js 15 (App Router), TypeScript, Tailwind, shadcn-style UI.
- **Data/Auth:** Supabase (Postgres + Auth + Row Level Security).
- **Deploy:** Vercel (app) + Supabase (DB). Monitoring: Sentry/PostHog (optional).

---

## 2. Prerequisites
- **Node.js 20+** (tested on 22). Check: `node -v`
- A **Supabase** account (free tier is fine).
- For real delivery (optional at first): a **Resend** account (email), a **Meta
  Business** account (WhatsApp), and/or a **Twilio/MSG91** account (SMS).

---

## 3. Project structure

```
axdox-verify/
├─ supabase/
│  ├─ migrations/0001_schema.sql ... 0004_members_view.sql   # schema, RLS, functions
│  ├─ ALL_MIGRATIONS.sql          # all four combined (paste-once)
│  └─ FIX_users_backfill.sql      # backfill fix for pre-existing users
├─ src/
│  ├─ app/
│  │  ├─ page.tsx                  # landing page
│  │  ├─ docs/page.tsx            # public API docs
│  │  ├─ (auth)/login, register    # Supabase Auth screens
│  │  ├─ (dashboard)/…             # dashboard (see §9); URLs are /dashboard/*
│  │  └─ api/
│  │     ├─ v1/otp/{send,verify,status}/route.ts   # PUBLIC API
│  │     └─ webhooks/whatsapp/route.ts             # delivery receipts
│  ├─ lib/
│  │  ├─ env.ts                    # validated env
│  │  ├─ errors.ts                 # stable error codes
│  │  ├─ supabase/{admin,server,client}.ts
│  │  ├─ otp/{crypto,recipient}.ts # code gen/hash, phone/email parsing
│  │  ├─ security/{api-key,rate-limit}.ts
│  │  ├─ providers/                # WhatsApp, SMS (×6), Email (×3), dev echo
│  │  ├─ services/verification.ts  # the send/verify orchestrator
│  │  ├─ dashboard/context.ts      # loads org+projects for the UI
│  │  └─ billing/plans.ts
│  ├─ components/                  # UI primitives, sidebar, code-block, etc.
│  └─ middleware.ts                # session refresh + /dashboard guard
├─ sdks/{node,python,php}/         # official SDKs
├─ scripts/                        # seed + test helpers (see §14)
├─ docs/{quickstart,deployment,production-checklist}.md
└─ .env.local                      # your secrets (never commit)
```

---

## 4. Setup — step by step

### 4.1 Install
```bash
cd axdox-verify
npm install
```

### 4.2 Create a Supabase project
1. supabase.com → New project. Note the project ref.
2. **Settings → API** → copy: Project URL, anon key, service_role key.

### 4.3 Apply the database schema
Easiest: Supabase → **SQL Editor** → paste the contents of
`supabase/ALL_MIGRATIONS.sql` → **Run**.
(Or with the CLI: `supabase link --project-ref <ref>` then `supabase db push`.)

Then run `supabase/FIX_users_backfill.sql` too (safe to run anytime; it also
backfills any accounts created before the schema existed).

Optional (recommended): enable `pg_cron` and schedule OTP expiry:
```sql
select cron.schedule('expire-otps', '*/5 * * * *', $$select expire_stale_otps()$$);
```

### 4.4 Configure environment
Copy the template and fill it in:
```bash
cp .env.example .env.local
```
Generate the two secrets (run twice):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Minimum to boot:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...        # server only — bypasses RLS
OTP_PEPPER=<random 64 hex>
API_KEY_PEPPER=<random 64 hex>
AXDOX_DEV_ECHO=true                  # dev: prints OTP to console, no provider needed
```
> ⚠️ Changing `OTP_PEPPER`/`API_KEY_PEPPER` later invalidates all existing OTP
> hashes and API keys. Set them once and keep them safe.

### 4.5 Run
```bash
npm run dev
```
Open the URL it prints (e.g. http://localhost:3000).

---

## 5. First run

1. Go to `/register` → sign up → **confirm the email** Supabase sends → `/login`.
2. Run `FIX_users_backfill.sql` if you registered before applying the schema.
3. **Dashboard → Projects → create organization → create project.**
4. **API Keys → Create key** → copy the `axk_test_…` secret (shown once).

Or skip the clicking with the seed script:
```bash
node scripts/seed.mjs your@email.com   # creates org + project + prints a test key
```

---

## 6. Testing (no external accounts needed)

With `AXDOX_DEV_ECHO=true`, OTPs are printed to the terminal and returned as
`dev_code` in the send response — so you can test the whole flow offline.

One-command smoke test (server must be running):
```bash
node scripts/test-otp.mjs axk_test_YOUR_KEY
node scripts/test-otp.mjs axk_test_YOUR_KEY user@example.com     # email recipient
node scripts/test-otp.mjs axk_test_YOUR_KEY +14155552671         # phone → WhatsApp first
```
Expected: `✅ SUCCESS — full send → verify flow works!`
Then check the **Dashboard / Logs / Analytics** — they populate with real data.

---

## 7. Configure channels

Providers live behind one interface; enable any subset by setting env vars.
Priority order and per-country routing are in `src/lib/providers/`.

### 7.1 Email — Resend (fastest) or Amazon SES (cheapest)
**Resend:** create an API key at resend.com, then:
```
RESEND_API_KEY=re_...
EMAIL_FROM="AXDOX <onboarding@resend.dev>"   # test sender: delivers only to your own Resend email
```
To email **anyone**, verify your domain in Resend (add DNS records) and set
`EMAIL_FROM="AXDOX <verify@yourdomain.com>"`.

**Amazon SES** (cheapest at scale, ~$0.10/1k): verify a domain (SPF/DKIM/DMARC),
then set `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `EMAIL_FROM`.

### 7.2 WhatsApp — Meta Cloud API (your headline channel)
**In Meta:**
1. business.facebook.com → create a Business portfolio.
2. developers.facebook.com → Create App → **Business** → add **WhatsApp**.
3. WhatsApp → **API Setup**: copy the **Phone number ID** and a temporary
   **access token**. Add your own number under **"To"** (verify it) — in test
   mode you can only message added recipients.
4. WhatsApp Manager → **Message Templates → Create**:
   - Category **Authentication**, name **`axdox_auth_code`**, language **English**,
     button **Copy code** → Submit (approves in minutes–hours).
5. **In `.env.local`:**
```
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_BUSINESS_ACCOUNT_ID=...
WHATSAPP_ACCESS_TOKEN=...
WHATSAPP_AUTH_TEMPLATE_NAME=axdox_auth_code
WHATSAPP_AUTH_TEMPLATE_LANG=en          # MUST match your template's language exactly
```
Restart the dev server, then send to your verified number:
`node scripts/test-otp.mjs axk_test_KEY +91XXXXXXXXXX`
Optional: set `WHATSAPP_WEBHOOK_VERIFY_TOKEN` + `WHATSAPP_APP_SECRET` and point
Meta's webhook to `https://<domain>/api/webhooks/whatsapp` for delivery receipts.

### 7.3 SMS — Twilio / MSG91 / Vonage / Telnyx / Exotel / Gupshup
Set the vars for the provider(s) you use (see `.env.example`). India requires
DLT registration (entity + header + template) — MSG91/Gupshup handle this.
Example (Twilio): `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM`.

> With a real provider configured for a channel, that channel sends for real;
> the dev echo only fills channels that have **no** provider.

---

## 8. How your customers integrate

Your customers add ~10 lines to their **server** (never the browser). Full docs
are at `/docs`. The essence:

```js
// 1. when the user submits their phone/email
const r = await fetch("https://YOUR-DOMAIN/api/v1/otp/send", {
  method: "POST",
  headers: { Authorization: "Bearer axk_live_THEIR_KEY", "Content-Type": "application/json" },
  body: JSON.stringify({ to: "+14155552671" }),
});
const { request_id } = await r.json();

// 2. when the user submits the code
const v = await fetch("https://YOUR-DOMAIN/api/v1/otp/verify", {
  method: "POST",
  headers: { Authorization: "Bearer axk_live_THEIR_KEY", "Content-Type": "application/json" },
  body: JSON.stringify({ request_id, code: "482913" }),
});
if ((await v.json()).verified) { /* log the user in */ }
```
Works with any language (REST). SDKs for Node/Python/PHP are in `sdks/`.

---

## 9. Dashboard reference (all under `/dashboard/*`)
| Page | Purpose |
|---|---|
| Dashboard | 30-day KPIs (sent, verified, rate, channel mix) |
| Projects | Create org/projects |
| API Keys | Create (one-time reveal), revoke, test/live |
| OTP Logs | Recent verifications, filter by status |
| Analytics | Charts: sent vs verified, channel mix, countries |
| Usage | Counts + estimated channel cost |
| Billing | Plans (checkout pending — see §13) |
| Webhooks | Register endpoints (delivery of events pending) |
| Organization | Members + roles |
| Settings | Channel order, code length, TTL, attempts, allowed countries |
| Profile | Your name; sign out |

---

## 10. Security model
- **OTP codes never stored** — only `HMAC(code + request_id, OTP_PEPPER)`, compared in constant time.
- **API keys** stored as `SHA-256(API_KEY_PEPPER + key)`; shown once; scoped; revocable.
- **PII** (phone/email) stored hashed + masked, never plaintext, in `otp_requests`.
- **Rate limiting** in Postgres: resend cooldown + per-recipient/hr + per-IP/hr (pumping guard).
- **RLS** on every table; the public API uses the service role behind API-key auth.
- Single-use codes, attempt caps, TTL, signed WhatsApp webhook.

---

## 11. Database schema (13 tables)
`organizations, users, members, projects, api_keys, otp_requests, otp_attempts,
provider_logs, usage_logs, subscriptions, billing, webhooks, audit_logs`.
Full DDL + indexes + RLS + functions in `supabase/migrations/`. Key functions:
`create_organization` (atomic org+owner), `otp_rate_check` (rate limiting),
`list_org_members`, `expire_stale_otps`.

---

## 12. Deployment (Vercel + Supabase)
1. Push the repo to GitHub → import into **Vercel** (Next.js preset).
2. Add **every** var from `.env.example` in Vercel → Project → Environment Variables.
   Set `AXDOX_DEV_ECHO=false` in production. Set `NEXT_PUBLIC_APP_URL` to your domain.
3. Supabase is already your DB — no extra deploy. Ensure migrations are applied.
4. Point provider webhooks (WhatsApp, later Stripe) at `https://<domain>/api/webhooks/*`.
5. Update the `API` constant in `src/app/docs/page.tsx` to your real domain.
See `docs/deployment.md` and `docs/production-checklist.md`.

---

## 13. Going live checklist
- [ ] Switch keys `axk_test_` → `axk_live_`.
- [ ] `AXDOX_DEV_ECHO=false`.
- [ ] **Email:** verify a sending domain in Resend/SES.
- [ ] **WhatsApp:** complete **Meta Business Verification**, add a real business
      number to the WABA, and create a **permanent System User token** (temp tokens
      expire in 24h). Only then can you message any customer number.
- [ ] **SMS:** add a provider key; for India complete DLT registration.
- [ ] **Billing:** wire Stripe/Razorpay (pending — see §16).
- [ ] Restrict allowed countries per project; monitor Analytics.
- [ ] Legal: Privacy Policy, ToS, DPA; confirm GST/VAT handling.

---

## 14. Helper scripts
| Script | Use |
|---|---|
| `node scripts/seed.mjs <email>` | Create org + project + test key for a signed-up user |
| `node scripts/test-otp.mjs <key> [recipient] [baseUrl]` | Send + auto-verify (uses dev_code) |
| `node scripts/patch-env.cjs 'KEY=value' …` | Safely set/replace keys in `.env.local` |

---

## 15. Troubleshooting (real issues + fixes)
- **`ChunkLoadError` / 404 on `main-app.js`, `layout.css`:** stale `.next`.
  Stop the server, `rm -rf .next`, `npm run dev`, hard-refresh (Ctrl+Shift+R).
  **Never run two dev servers in the same folder** — they corrupt `.next`.
- **Only `/dashboard` loads, other pages 404:** route-group issue (fixed) — all
  dashboard pages live under `src/app/(dashboard)/dashboard/*` so URLs are `/dashboard/*`.
- **`members_user_id_fkey` violation on create org:** your user row wasn't in
  `public.users` (signed up before the trigger). Run `FIX_users_backfill.sql`.
- **`429 rate_limited` on send:** the recipient/IP hit the limit or resend
  cooldown (45s). Use a fresh recipient or wait. It's a feature, not a bug.
- **`502 all_channels_failed`:** no provider configured for the attempted
  channel. Set a provider (or `AXDOX_DEV_ECHO=true` for local).
- **WhatsApp not delivered though "accepted":** in test mode Meta only delivers
  to numbers added as recipients. Add the number, or verify your business.
- **WhatsApp template error:** `WHATSAPP_AUTH_TEMPLATE_LANG` must match the
  template's language exactly (e.g. `en` vs `en_US`).
- **Env change not taking effect:** restart `npm run dev` (env is read at boot).

---

## 16. Current status
**✅ Built & tested live**
Auth/orgs/projects/keys · OTP send/verify/status API · OTP engine (hash, TTL,
single-use, attempt caps) · rate limiting · WhatsApp→SMS→Email fallback ·
Email (Resend, real) · WhatsApp (Meta, real) · dashboard + analytics · modern UI ·
`/docs` · SDKs · security (RLS, hashed keys/codes).

**🟡 Built, not fully wired**
Outbound customer webhooks (registration UI exists; event delivery not wired) ·
delivery-driven fallback (currently send-time) · SMS (code ready, needs a key).

**⬜ Not built yet**
Stripe/Razorpay checkout + wallet charging · Meta Business Verification +
permanent token (to reach any number) · email domain verification (to email anyone).

**The next milestone that turns this into a real business:** Business
Verification + billing — so you can send to any customer and charge for it.
```
