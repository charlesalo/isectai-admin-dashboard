-- Helpers used by RLS policies. They are security definer so they can read
-- platform_admins and organization_members without triggering those tables'
-- own policies (which would recurse). search_path is empty so every name must
-- be schema-qualified and cannot be hijacked.

create function private.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from core.platform_admins where user_id = (select auth.uid())
  );
$$;

create function private.user_org_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select organization_id from core.organization_members where user_id = (select auth.uid());
$$;

-- Postgres lets every role execute new functions by default. Only signed-in
-- users need these (policies run as the querying role). The private schema is
-- not exposed through the API, so they still cannot be called over HTTP.
revoke execute on function private.is_platform_admin() from public;
revoke execute on function private.user_org_ids() from public;

grant usage on schema private to authenticated;
grant execute on function private.is_platform_admin() to authenticated;
grant execute on function private.user_org_ids() to authenticated;
