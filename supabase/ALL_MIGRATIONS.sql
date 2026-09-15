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
-- ============================================================
-- AXDOX Verify — Functions & Triggers
-- 0002_functions_triggers.sql
-- ============================================================

-- ---------- updated_at maintenance ----------
create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger trg_org_updated   before update on organizations
  for each row execute function set_updated_at();
create trigger trg_project_updated before update on projects
  for each row execute function set_updated_at();
create trigger trg_sub_updated    before update on subscriptions
  for each row execute function set_updated_at();

-- ============================================================
-- New auth user -> mirror into public.users
-- (attached to auth.users via Supabase; safe/no-op if user exists)
-- ============================================================
create or replace function handle_new_auth_user() returns trigger
security definer set search_path = public
language plpgsql as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (new.id, new.email,
          new.raw_user_meta_data->>'full_name',
          new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  return new;
end $$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();

-- ============================================================
-- membership helper — is the current user a member of an org?
-- Used throughout RLS. SECURITY DEFINER to avoid recursive RLS.
-- ============================================================
create or replace function is_org_member(target_org uuid)
returns boolean
security definer set search_path = public
language sql stable as $$
  select exists (
    select 1 from members
    where members.org_id = target_org
      and members.user_id = auth.uid()
  );
$$;

create or replace function has_org_role(target_org uuid, roles member_role[])
returns boolean
security definer set search_path = public
language sql stable as $$
  select exists (
    select 1 from members
    where members.org_id = target_org
      and members.user_id = auth.uid()
      and members.role = any(roles)
  );
$$;

-- project -> org resolver (for RLS on project-scoped tables)
create or replace function project_org(target_project uuid)
returns uuid
security definer set search_path = public
language sql stable as $$
  select org_id from projects where id = target_project;
$$;

-- ============================================================
-- Rate limiting — atomic, server-side.
-- Returns TRUE if the send is ALLOWED, FALSE if throttled.
-- Enforces three windows in one call:
--   1. resend cooldown per recipient
--   2. per-recipient sends per hour
--   3. per-IP sends per hour (abuse / pumping guard)
-- ============================================================
create or replace function otp_rate_check(
  p_project      uuid,
  p_recipient    text,
  p_ip           inet,
  p_cooldown_sec int,
  p_recipient_max_hr int default 5,
  p_ip_max_hr        int default 30
) returns boolean
security definer set search_path = public
language plpgsql as $$
declare
  last_send    timestamptz;
  recip_count  int;
  ip_count     int;
begin
  select max(created_at) into last_send
    from otp_requests
   where project_id = p_project and recipient_hash = p_recipient;

  if last_send is not null and last_send > now() - make_interval(secs => p_cooldown_sec) then
    return false;  -- still in cooldown
  end if;

  select count(*) into recip_count
    from otp_requests
   where project_id = p_project and recipient_hash = p_recipient
     and created_at > now() - interval '1 hour';
  if recip_count >= p_recipient_max_hr then
    return false;
  end if;

  if p_ip is not null then
    select count(*) into ip_count
      from otp_requests
     where project_id = p_project and client_ip = p_ip
       and created_at > now() - interval '1 hour';
    if ip_count >= p_ip_max_hr then
      return false;
    end if;
  end if;

  return true;
end $$;

-- ============================================================
-- Expire stale pending OTPs. Call from a scheduled job
-- (pg_cron / Supabase scheduled Edge Function).
-- ============================================================
create or replace function expire_stale_otps() returns int
security definer set search_path = public
language plpgsql as $$
declare n int;
begin
  update otp_requests
     set status = 'expired'
   where status = 'pending' and expires_at < now();
  get diagnostics n = row_count;
  return n;
end $$;

-- Schedule (requires pg_cron extension enabled in Supabase):
-- select cron.schedule('expire-otps', '*/5 * * * *', $$select expire_stale_otps()$$);
-- ============================================================
-- AXDOX Verify — Row Level Security
-- 0003_rls.sql
-- ============================================================
-- Model:
--  * Dashboard users act via the anon/authenticated key -> RLS enforced.
--  * The OTP API and background jobs use the SERVICE ROLE key -> bypasses RLS
--    (all access there is guarded in application code by API-key auth).
--  * Users may only see data for orgs they are a member of.
-- ============================================================

alter table organizations enable row level security;
alter table users         enable row level security;
alter table members       enable row level security;
alter table projects      enable row level security;
alter table api_keys      enable row level security;
alter table otp_requests  enable row level security;
alter table otp_attempts  enable row level security;
alter table provider_logs enable row level security;
alter table usage_logs    enable row level security;
alter table subscriptions enable row level security;
alter table billing       enable row level security;
alter table webhooks      enable row level security;
alter table audit_logs    enable row level security;

-- ---------- users ----------
create policy "users read self" on users
  for select using (id = auth.uid());
create policy "users update self" on users
  for update using (id = auth.uid());

-- ---------- organizations ----------
create policy "org members read" on organizations
  for select using (is_org_member(id));
create policy "org owners update" on organizations
  for update using (has_org_role(id, array['owner','admin']::member_role[]));
-- Insert path for creating a new org is handled by a SECURITY DEFINER RPC
-- (create_organization) so the creator is atomically added as owner.

-- ---------- members ----------
create policy "members read own org" on members
  for select using (is_org_member(org_id));
create policy "members managed by admins" on members
  for all using (has_org_role(org_id, array['owner','admin']::member_role[]))
  with check (has_org_role(org_id, array['owner','admin']::member_role[]));

-- ---------- projects ----------
create policy "projects read" on projects
  for select using (is_org_member(org_id));
create policy "projects write" on projects
  for all using (has_org_role(org_id, array['owner','admin','developer']::member_role[]))
  with check (has_org_role(org_id, array['owner','admin','developer']::member_role[]));

-- ---------- api_keys (never expose key_hash to clients via views) ----------
create policy "apikeys read" on api_keys
  for select using (is_org_member(project_org(project_id)));
create policy "apikeys write" on api_keys
  for all using (has_org_role(project_org(project_id), array['owner','admin','developer']::member_role[]))
  with check (has_org_role(project_org(project_id), array['owner','admin','developer']::member_role[]));

-- ---------- otp_requests / attempts / provider_logs (read-only for dashboard) ----------
create policy "otp read" on otp_requests
  for select using (is_org_member(project_org(project_id)));
create policy "attempts read" on otp_attempts
  for select using (
    is_org_member(project_org((select project_id from otp_requests o where o.id = otp_request_id)))
  );
create policy "provider read" on provider_logs
  for select using (is_org_member(project_org(project_id)));

-- ---------- usage / billing / subscriptions ----------
create policy "usage read" on usage_logs
  for select using (is_org_member(org_id));
create policy "billing read" on billing
  for select using (is_org_member(org_id));
create policy "subs read" on subscriptions
  for select using (is_org_member(org_id));

-- ---------- webhooks ----------
create policy "webhooks manage" on webhooks
  for all using (has_org_role(project_org(project_id), array['owner','admin','developer']::member_role[]))
  with check (has_org_role(project_org(project_id), array['owner','admin','developer']::member_role[]));

-- ---------- audit ----------
create policy "audit read" on audit_logs
  for select using (is_org_member(org_id));

-- ============================================================
-- create_organization RPC — atomic org + owner membership
-- ============================================================
create or replace function create_organization(p_name text, p_slug text)
returns organizations
security definer set search_path = public
language plpgsql as $$
declare org organizations;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  -- Self-heal: ensure a public.users row exists for the caller (covers users
  -- who signed up before the auth trigger was installed).
  insert into public.users (id, email, full_name)
    select id, email, raw_user_meta_data->>'full_name'
      from auth.users where id = auth.uid()
    on conflict (id) do nothing;

  insert into organizations (name, slug) values (p_name, p_slug) returning * into org;
  insert into members (org_id, user_id, role) values (org.id, auth.uid(), 'owner');
  return org;
end $$;
-- ============================================================
-- 0004_members_view.sql
-- SECURITY DEFINER RPC to list members of an org WITH their email.
-- (users RLS only exposes the caller's own row, so we need this to
--  render the org members table safely.)
-- ============================================================
create or replace function list_org_members(p_org uuid)
returns table (user_id uuid, email text, full_name text, role member_role, member_id uuid)
security definer set search_path = public
language plpgsql as $$
begin
  if not is_org_member(p_org) then
    raise exception 'not a member of this organization';
  end if;
  return query
    select u.id, u.email::text, u.full_name, m.role, m.id
      from members m
      join users u on u.id = m.user_id
     where m.org_id = p_org
     order by m.created_at;
end $$;
