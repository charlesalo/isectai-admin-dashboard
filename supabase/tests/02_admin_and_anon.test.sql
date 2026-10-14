-- Platform admin access, anon denial, and guards that catch a future
-- migration forgetting RLS, security_invoker, or leaking access to anon.
begin;
create extension if not exists pgtap with schema extensions;
select plan(33);

-- Test admin (rolled back at the end).
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000a001', 'admin@access.test');
insert into core.platform_admins (user_id) values
  ('00000000-0000-0000-0000-00000000a001');

-- Totals across every business, computed as postgres (bypasses RLS).
create temp table totals as
select
  (select count(*) from core.organizations) as orgs,
  (select count(*) from core.organization_members) as members,
  (select count(*) from core.calls) as calls,
  (select count(*) from core.integration_events) as events,
  (select count(*) from medical.providers) as providers,
  (select count(*) from medical.patients) as patients,
  (select count(*) from medical.appointments) as appointments,
  (select count(*) from field_service.customers) as customers,
  (select count(*) from field_service.jobs) as jobs,
  (select count(*) from field_service.job_visits) as job_visits,
  (select count(*) from core.bookings) as bookings;

grant select on totals to authenticated;

select is((select orgs from totals), 3::bigint, 'seed data has three businesses');

-- Guards on the schema itself.

select is_empty(
  $$select c.oid::regclass::text
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname in ('core', 'medical', 'field_service') and c.relkind = 'r'
      and not c.relrowsecurity$$,
  'every table has RLS enabled'
);

select is_empty(
  $$select c.oid::regclass::text
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname in ('core', 'medical', 'field_service') and c.relkind = 'v'
      and not coalesce('security_invoker=true' = any (c.reloptions), false)$$,
  'every view uses security_invoker'
);

select is_empty(
  $$select c.oid::regclass::text
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname in ('core', 'medical', 'field_service', 'private') and c.relkind in ('r', 'v')
      and has_table_privilege('anon', c.oid, 'select, insert, update, delete')$$,
  'anon has no privileges on any table or view'
);

select is_empty(
  $$select nspname from pg_namespace
    where nspname in ('core', 'medical', 'field_service', 'private')
      and has_schema_privilege('anon', oid, 'usage')$$,
  'anon cannot use any app schema'
);

select ok(
  not has_function_privilege('anon', 'private.is_platform_admin()', 'execute')
    and not has_function_privilege('anon', 'private.user_org_ids()', 'execute'),
  'anon cannot execute the RLS helper functions'
);

-- Sign in as the platform admin.
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000a001", "role": "authenticated"}';

select is((select count(*) from core.organizations), (select orgs from totals), 'admin sees every organization');
select is((select count(*) from core.organization_members), (select members from totals), 'admin sees every membership');
select is((select count(*) from core.calls), (select calls from totals), 'admin sees every call');
select is((select count(*) from core.integration_events), (select events from totals), 'admin sees every integration event');
select is((select count(*) from medical.providers), (select providers from totals), 'admin sees every provider');
select is((select count(*) from medical.patients), (select patients from totals), 'admin sees every patient');
select is((select count(*) from medical.appointments), (select appointments from totals), 'admin sees every appointment');
select is((select count(*) from field_service.customers), (select customers from totals), 'admin sees every customer');
select is((select count(*) from field_service.jobs), (select jobs from totals), 'admin sees every job');
select is((select count(*) from field_service.job_visits), (select job_visits from totals), 'admin sees every job visit');
select is((select count(*) from core.bookings), (select bookings from totals), 'bookings view shows every booking to admin');
select is((select count(*) from core.organization_overview), (select orgs from totals), 'overview view shows every organization to admin');
select ok(
  exists (select 1 from core.platform_admins where user_id = '00000000-0000-0000-0000-00000000a001'),
  'admin can see the platform_admins table'
);

-- The dashboard is read-only, for admins too.
select throws_ok(
  $$insert into core.organizations (name, slug, industry) values ('Test Org', 'test-org', 'medical')$$,
  '42501', null, 'admin cannot insert organizations'
);

-- Signed out.
reset role;
set local role anon;

select throws_ok($$select 1 from core.organizations$$, '42501', null, 'anon cannot read organizations');
select throws_ok($$select 1 from core.organization_members$$, '42501', null, 'anon cannot read memberships');
select throws_ok($$select 1 from core.platform_admins$$, '42501', null, 'anon cannot read platform admins');
select throws_ok($$select 1 from core.calls$$, '42501', null, 'anon cannot read calls');
select throws_ok($$select 1 from core.integration_events$$, '42501', null, 'anon cannot read integration events');
select throws_ok($$select 1 from core.bookings$$, '42501', null, 'anon cannot read the bookings view');
select throws_ok($$select 1 from core.organization_overview$$, '42501', null, 'anon cannot read the overview view');
select throws_ok($$select 1 from medical.providers$$, '42501', null, 'anon cannot read providers');
select throws_ok($$select 1 from medical.patients$$, '42501', null, 'anon cannot read patients');
select throws_ok($$select 1 from medical.appointments$$, '42501', null, 'anon cannot read appointments');
select throws_ok($$select 1 from field_service.customers$$, '42501', null, 'anon cannot read customers');
select throws_ok($$select 1 from field_service.jobs$$, '42501', null, 'anon cannot read jobs');
select throws_ok($$select 1 from field_service.job_visits$$, '42501', null, 'anon cannot read job visits');

select * from finish();
rollback;
