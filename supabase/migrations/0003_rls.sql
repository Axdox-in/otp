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
