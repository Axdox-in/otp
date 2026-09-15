-- ============================================================
-- AXDOX Verify — Core schema
-- 0001_schema.sql  (tables, constraints, indexes)
-- ============================================================
-- Conventions:
--  * All PKs are uuid default gen_random_uuid()
--  * Money is stored in integer micros (1 USD = 1_000_000) to avoid float drift
--  * PII (phone/email) is NEVER stored in plaintext in otp_requests:
--       recipient_hash  = sha256(pepper || normalized recipient)  -> lookup/rate-limit
--       recipient_masked= human-readable masked value             -> display only
--  * OTP codes are NEVER stored: only code_hash = hmac_sha256(code||request_id, pepper)

create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- ---------- enums ----------
create type channel_type      as enum ('whatsapp', 'sms', 'email');
create type otp_status        as enum ('pending', 'verified', 'failed', 'expired', 'cancelled');
create type provider_status   as enum ('accepted', 'sent', 'delivered', 'read', 'failed', 'undelivered');
create type member_role       as enum ('owner', 'admin', 'developer', 'viewer');
create type api_key_env       as enum ('test', 'live');
create type plan_tier         as enum ('free', 'payg', 'growth', 'enterprise');
create type subscription_status as enum ('active', 'trialing', 'past_due', 'canceled', 'incomplete');

-- ============================================================
-- organizations
-- ============================================================
create table organizations (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          citext not null unique,
  billing_email text,
  country       text,
  plan          plan_tier not null default 'free',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint org_name_len check (char_length(name) between 1 and 120)
);

-- ============================================================
-- users  (mirror of auth.users we control; keyed by auth uid)
-- ============================================================
create table users (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       citext not null,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- members  (user <-> org, with role)
-- ============================================================
create table members (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations (id) on delete cascade,
  user_id     uuid not null references users (id) on delete cascade,
  role        member_role not null default 'developer',
  created_at  timestamptz not null default now(),
  unique (org_id, user_id)
);

-- ============================================================
-- projects
-- ============================================================
create table projects (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organizations (id) on delete cascade,
  name          text not null,
  -- ordered list of channels to attempt, e.g. {whatsapp,sms,email}
  channel_order channel_type[] not null default '{whatsapp,sms,email}',
  otp_length    int not null default 6 check (otp_length between 4 and 10),
  otp_ttl_secs  int not null default 300 check (otp_ttl_secs between 30 and 1800),
  max_attempts  int not null default 5 check (max_attempts between 1 and 10),
  -- per-recipient send throttle
  resend_cooldown_secs int not null default 45,
  -- ISO country codes allowed; empty array = allow all
  allowed_countries text[] not null default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- api_keys   (store only the hash; prefix shown in dashboard)
-- ============================================================
create table api_keys (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references projects (id) on delete cascade,
  name         text not null default 'default',
  env          api_key_env not null default 'test',
  key_prefix   text not null,          -- e.g. axk_live_a1b2  (shown to user)
  key_hash     text not null unique,   -- sha256(pepper || full key)
  last_four    text not null,
  scopes       text[] not null default '{otp:send,otp:verify,otp:read}',
  last_used_at timestamptz,
  revoked_at   timestamptz,
  created_by   uuid references users (id) on delete set null,
  created_at   timestamptz not null default now()
);

-- ============================================================
-- otp_requests  (one row per verification session)
-- ============================================================
create table otp_requests (
  id               uuid primary key default gen_random_uuid(),
  project_id       uuid not null references projects (id) on delete cascade,
  status           otp_status not null default 'pending',
  channel_used     channel_type,          -- channel that actually delivered
  recipient_hash   text not null,         -- sha256(pepper||recipient)
  recipient_masked text not null,         -- +1******4567 / j***@ex.com
  country          text,
  code_hash        text not null,         -- hmac(code||id, pepper)
  code_length      int not null,
  attempts         int not null default 0,
  max_attempts     int not null,
  expires_at       timestamptz not null,
  verified_at      timestamptz,
  client_ip        inet,
  metadata         jsonb not null default '{}',
  created_at       timestamptz not null default now()
);

-- ============================================================
-- otp_attempts  (one row per verify() call — audit + brute-force analysis)
-- ============================================================
create table otp_attempts (
  id             uuid primary key default gen_random_uuid(),
  otp_request_id uuid not null references otp_requests (id) on delete cascade,
  success        boolean not null,
  client_ip      inet,
  created_at     timestamptz not null default now()
);

-- ============================================================
-- provider_logs  (one row per channel send attempt in the cascade)
-- ============================================================
create table provider_logs (
  id                  uuid primary key default gen_random_uuid(),
  otp_request_id      uuid not null references otp_requests (id) on delete cascade,
  project_id          uuid not null references projects (id) on delete cascade,
  channel             channel_type not null,
  provider            text not null,        -- 'whatsapp_cloud','twilio','resend',...
  provider_message_id text,
  status              provider_status not null default 'accepted',
  cost_micros         bigint not null default 0,
  error_code          text,
  error_message       text,
  latency_ms          int,
  created_at          timestamptz not null default now()
);

-- ============================================================
-- usage_logs  (rolled-up billable events; feeds analytics + billing)
-- ============================================================
create table usage_logs (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references organizations (id) on delete cascade,
  project_id   uuid not null references projects (id) on delete cascade,
  otp_request_id uuid references otp_requests (id) on delete set null,
  channel      channel_type not null,
  event        text not null,               -- 'sent','delivered','verified'
  cost_micros  bigint not null default 0,
  country      text,
  created_at   timestamptz not null default now()
);

-- ============================================================
-- subscriptions  (Stripe/Razorpay)
-- ============================================================
create table subscriptions (
  id                 uuid primary key default gen_random_uuid(),
  org_id             uuid not null references organizations (id) on delete cascade,
  provider           text not null,          -- 'stripe' | 'razorpay'
  external_id        text unique,            -- sub_... / subscription id
  plan               plan_tier not null,
  status             subscription_status not null default 'active',
  current_period_end timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- ============================================================
-- billing  (prepaid wallet ledger — append only)
-- ============================================================
create table billing (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organizations (id) on delete cascade,
  delta_micros  bigint not null,             -- + top-up, - usage
  balance_after bigint not null,
  currency      text not null default 'USD',
  reason        text not null,               -- 'topup','otp_charge','refund'
  reference     text,                        -- payment id / otp_request_id
  created_at    timestamptz not null default now()
);

-- ============================================================
-- webhooks  (customer-registered delivery callbacks)
-- ============================================================
create table webhooks (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references projects (id) on delete cascade,
  url         text not null,
  secret      text not null,                 -- for HMAC signing
  events      text[] not null default '{verification.completed,verification.failed}',
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- audit_logs
-- ============================================================
create table audit_logs (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid references organizations (id) on delete cascade,
  actor_id    uuid references users (id) on delete set null,
  action      text not null,                 -- 'apikey.create','project.update',...
  target      text,
  metadata    jsonb not null default '{}',
  ip          inet,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- Indexes
-- ============================================================
create index idx_members_org        on members (org_id);
create index idx_members_user       on members (user_id);
create index idx_projects_org       on projects (org_id);
create index idx_apikeys_project    on api_keys (project_id) where revoked_at is null;
create index idx_apikeys_hash       on api_keys (key_hash);

create index idx_otp_project_created on otp_requests (project_id, created_at desc);
create index idx_otp_recipient       on otp_requests (project_id, recipient_hash, created_at desc);
create index idx_otp_pending         on otp_requests (expires_at) where status = 'pending';
create index idx_otp_client_ip       on otp_requests (client_ip, created_at desc);

create index idx_attempts_request    on otp_attempts (otp_request_id);
create index idx_provider_request     on provider_logs (otp_request_id);
create index idx_provider_project     on provider_logs (project_id, created_at desc);

create index idx_usage_org_created   on usage_logs (org_id, created_at desc);
create index idx_usage_project_created on usage_logs (project_id, created_at desc);
create index idx_billing_org         on billing (org_id, created_at desc);
create index idx_audit_org           on audit_logs (org_id, created_at desc);
create index idx_webhooks_project    on webhooks (project_id) where active;
