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
