-- RLS on every table. The dashboard is read-only for now, so there are only
-- select policies: with no insert, update or delete policy, those operations
-- are denied for every API user. Seeding uses the service role, which bypasses RLS.
--
-- Rule for tenant tables: platform admins read everything, organization
-- members read rows in their own organizations. The helper calls are wrapped
-- in (select ...) so Postgres evaluates them once per query, not once per row.

alter table core.organizations enable row level security;
alter table core.organization_members enable row level security;
alter table core.platform_admins enable row level security;
alter table core.calls enable row level security;
alter table core.integration_events enable row level security;
alter table medical.providers enable row level security;
alter table medical.patients enable row level security;
alter table medical.appointments enable row level security;
alter table field_service.customers enable row level security;
alter table field_service.jobs enable row level security;
alter table field_service.job_visits enable row level security;

-- core

create policy "admins and members read organizations" on core.organizations
  for select to authenticated
  using ((select private.is_platform_admin()) or id in (select private.user_org_ids()));

create policy "admins and members read memberships" on core.organization_members
  for select to authenticated
  using ((select private.is_platform_admin()) or organization_id in (select private.user_org_ids()));

-- A user can see their own admin row, so the app can check "am I an admin?".
create policy "admins read admins, users read own row" on core.platform_admins
  for select to authenticated
  using ((select private.is_platform_admin()) or user_id = (select auth.uid()));

create policy "admins and members read calls" on core.calls
  for select to authenticated
  using ((select private.is_platform_admin()) or organization_id in (select private.user_org_ids()));

create policy "admins and members read integration events" on core.integration_events
  for select to authenticated
  using ((select private.is_platform_admin()) or organization_id in (select private.user_org_ids()));

-- medical

create policy "admins and members read providers" on medical.providers
  for select to authenticated
  using ((select private.is_platform_admin()) or organization_id in (select private.user_org_ids()));

create policy "admins and members read patients" on medical.patients
  for select to authenticated
  using ((select private.is_platform_admin()) or organization_id in (select private.user_org_ids()));

create policy "admins and members read appointments" on medical.appointments
  for select to authenticated
  using ((select private.is_platform_admin()) or organization_id in (select private.user_org_ids()));

-- field_service

create policy "admins and members read customers" on field_service.customers
  for select to authenticated
  using ((select private.is_platform_admin()) or organization_id in (select private.user_org_ids()));

create policy "admins and members read jobs" on field_service.jobs
  for select to authenticated
  using ((select private.is_platform_admin()) or organization_id in (select private.user_org_ids()));

create policy "admins and members read job visits" on field_service.job_visits
  for select to authenticated
  using ((select private.is_platform_admin()) or organization_id in (select private.user_org_ids()));
