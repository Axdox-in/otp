-- ============================================================
-- FIX: backfill public.users for accounts created before the
-- auth trigger existed, and harden create_organization.
-- Paste this whole block into the Supabase SQL Editor and Run.
-- Safe to run multiple times.
-- ============================================================

-- 1) Backfill every existing auth user into public.users.
insert into public.users (id, email, full_name)
select id, email, raw_user_meta_data->>'full_name'
from auth.users
on conflict (id) do nothing;

-- 2) Make sure the trigger for future signups exists.
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

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();

-- 3) Self-healing create_organization (also upserts the caller's users row).
create or replace function create_organization(p_name text, p_slug text)
returns organizations
security definer set search_path = public
language plpgsql as $$
declare org organizations;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  insert into public.users (id, email, full_name)
    select id, email, raw_user_meta_data->>'full_name'
      from auth.users where id = auth.uid()
    on conflict (id) do nothing;

  insert into organizations (name, slug) values (p_name, p_slug) returning * into org;
  insert into members (org_id, user_id, role) values (org.id, auth.uid(), 'owner');
  return org;
end $$;
