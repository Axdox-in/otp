# Deployment Guide — Vercel + Supabase

## 1. Supabase
1. Create a project at supabase.com.
2. Apply migrations (in order):
   ```bash
   supabase link --project-ref <ref>
   supabase db push        # applies supabase/migrations/*.sql
   ```
   Or paste `0001_schema.sql` → `0002_functions_triggers.sql` → `0003_rls.sql` into the SQL editor.
3. Enable the `pg_cron` extension and schedule OTP expiry:
   ```sql
   select cron.schedule('expire-otps', '*/5 * * * *', $$select expire_stale_otps()$$);
   ```
4. Auth → set the Site URL and redirect URLs to your Vercel domain. Enable email confirmations.

## 2. Provider setup
- **WhatsApp:** create a Meta app + WABA, register the business number to Cloud API,
  create an approved `AUTHENTICATION` template named `axdox_auth_code` with a copy-code button,
  set the webhook to `https://<domain>/api/webhooks/whatsapp` with your verify token.
- **SMS:** configure at least one of Twilio / Telnyx / MSG91 (DLT for India) / Vonage / Exotel / Gupshup.
- **Email:** configure Amazon SES (verify domain, SPF/DKIM/DMARC) and/or Resend.

## 3. Vercel
1. Import the repo. Framework preset: **Next.js**.
2. Add every variable from `.env.example` in Project → Settings → Environment Variables.
3. Generate secrets: `openssl rand -hex 32` for `OTP_PEPPER` and `API_KEY_PEPPER`
   (⚠️ changing these later invalidates all existing OTP hashes and API keys).
4. Deploy. Set `NEXT_PUBLIC_APP_URL` to the production URL and redeploy.

## 4. Webhooks
- Stripe: `https://<domain>/api/webhooks/stripe` (add `STRIPE_WEBHOOK_SECRET`).
- WhatsApp: `https://<domain>/api/webhooks/whatsapp`.
