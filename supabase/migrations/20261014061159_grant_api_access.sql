-- API access for the exposed schemas. These schemas start with no grants
-- (Supabase only sets default grants on public), so access is opt-in.
--
-- authenticated: read only. RLS decides which rows each user sees.
-- anon:          nothing. Logged-out requests get a permission error.
-- service_role:  read and write, for scripts/seed-users.ts. It bypasses RLS
--                and is never used by the dashboard.

grant usage on schema core, medical, field_service to authenticated, service_role;

grant select on all tables in schema core, medical, field_service to authenticated;

grant select, insert, update, delete
  on all tables in schema core, medical, field_service to service_role;

-- Defensive: make sure anon has nothing, even if a default grant changes later.
revoke all on all tables in schema core, medical, field_service from anon;
revoke all on schema core, medical, field_service, private from anon;
