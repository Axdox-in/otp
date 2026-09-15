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
