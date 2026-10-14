-- Tenant isolation for customer users.
-- A Brightside staff member must see exactly Brightside's rows in every table
-- and view, nothing from other businesses, and must not be able to write.
-- A signed-in user with no membership must see nothing.
begin;
create extension if not exists pgtap with schema extensions;
select plan(31);

-- Test users (rolled back at the end).
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000b001', 'staff@isolation.test'),
  ('00000000-0000-0000-0000-00000000b002', 'no-membership@isolation.test');

insert into core.organization_members (organization_id, user_id, role)
select id, '00000000-0000-0000-0000-00000000b001', 'staff'
from core.organizations where slug = 'brightside-family-clinic';

-- What Brightside staff should see, computed as postgres (bypasses RLS).
create temp table expected as
select
  o.id as org_id,
  (select count(*) from core.organization_members where organization_id = o.id) as members,
  (select count(*) from core.calls where organization_id = o.id) as calls,
  (select count(*) from core.integration_events where organization_id = o.id) as events,
  (select count(*) from medical.providers where organization_id = o.id) as providers,
  (select count(*) from medical.patients where organization_id = o.id) as patients,
  (select count(*) from medical.appointments where organization_id = o.id) as appointments,
  (select count(*) from core.bookings where organization_id = o.id) as bookings
from core.organizations o
where o.slug = 'brightside-family-clinic';

grant select on expected to authenticated;

select isnt((select org_id from expected), null, 'seed data includes Brightside');

-- Sign in as Brightside staff.
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000b001", "role": "authenticated"}';

select is((select count(*) from core.organizations), 1::bigint, 'staff sees one organization');
select is((select id from core.organizations), (select org_id from expected), 'that organization is Brightside');

select is((select count(*) from core.organization_members), (select members from expected), 'staff sees all Brightside memberships');
select is((select count(*) from core.organization_members where organization_id <> (select org_id from expected)), 0::bigint, 'staff sees no other memberships');

select is((select count(*) from core.calls), (select calls from expected), 'staff sees all Brightside calls');
select is((select count(*) from core.calls where organization_id <> (select org_id from expected)), 0::bigint, 'staff sees no other calls');

select is((select count(*) from core.integration_events), (select events from expected), 'staff sees all Brightside integration events');
select is((select count(*) from core.integration_events where organization_id <> (select org_id from expected)), 0::bigint, 'staff sees no other integration events');

select is((select count(*) from medical.providers), (select providers from expected), 'staff sees all Brightside providers');
select is((select count(*) from medical.providers where organization_id <> (select org_id from expected)), 0::bigint, 'staff sees no other providers');

select is((select count(*) from medical.patients), (select patients from expected), 'staff sees all Brightside patients');
select is((select count(*) from medical.patients where organization_id <> (select org_id from expected)), 0::bigint, 'staff sees no other patients');

select is((select count(*) from medical.appointments), (select appointments from expected), 'staff sees all Brightside appointments');
select is((select count(*) from medical.appointments where organization_id <> (select org_id from expected)), 0::bigint, 'staff sees no other appointments');

select is((select count(*) from core.bookings), (select bookings from expected), 'bookings view shows all Brightside bookings');
select is((select count(*) from core.bookings where organization_id <> (select org_id from expected)), 0::bigint, 'bookings view shows no other bookings');

-- Brightside is medical, so every field service row belongs to someone else.
select is((select count(*) from field_service.customers), 0::bigint, 'staff sees no field service customers');
select is((select count(*) from field_service.jobs), 0::bigint, 'staff sees no field service jobs');
select is((select count(*) from field_service.job_visits), 0::bigint, 'staff sees no field service job visits');
select is((select count(*) from core.platform_admins), 0::bigint, 'staff sees no platform admins');

select is((select count(*) from core.organization_overview), 1::bigint, 'overview view shows one organization');
select is((select slug from core.organization_overview), 'brightside-family-clinic', 'overview view shows Brightside');

-- Read-only: no write grants for authenticated.
select throws_ok(
  $$insert into medical.patients (organization_id, full_name, phone_e164)
    values ((select org_id from expected), 'Test Patient', '+12125550199')$$,
  '42501', null, 'staff cannot insert patients'
);
select throws_ok(
  $$update core.organizations set name = 'Renamed'$$,
  '42501', null, 'staff cannot update organizations'
);
select throws_ok(
  $$delete from medical.appointments$$,
  '42501', null, 'staff cannot delete appointments'
);

-- Signed in, but not a member of any organization.
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000b002", "role": "authenticated"}';

select is((select count(*) from core.organizations), 0::bigint, 'user without membership sees no organizations');
select is((select count(*) from core.calls), 0::bigint, 'user without membership sees no calls');
select is((select count(*) from medical.patients), 0::bigint, 'user without membership sees no patients');
select is((select count(*) from core.bookings), 0::bigint, 'user without membership sees no bookings');
select is((select count(*) from core.organization_overview), 0::bigint, 'user without membership sees no overview rows');

select * from finish();
rollback;
