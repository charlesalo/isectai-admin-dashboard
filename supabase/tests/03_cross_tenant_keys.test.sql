-- Composite foreign keys: a child row can only reference parent rows in the
-- same organization. These run as postgres, which bypasses RLS, so they prove
-- the database itself blocks cross-tenant links, not just the API.
begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

-- A second field service business, so jobs have another tenant to leak into.
insert into core.organizations (name, slug, industry) values
  ('Test Plumbing Co', 'test-plumbing-co', 'field_service');

insert into field_service.customers (organization_id, full_name, phone_e164)
select id, 'Test Customer', '+15555550101' from core.organizations where slug = 'test-plumbing-co';

insert into field_service.jobs (organization_id, customer_id, service_type)
select c.organization_id, c.id, 'Test job'
from field_service.customers c where c.phone_e164 = '+15555550101';

-- Medical

select lives_ok(
  $$insert into medical.appointments (organization_id, patient_id, provider_id, scheduled_start, scheduled_end)
    values (
      (select id from core.organizations where slug = 'brightside-family-clinic'),
      (select id from medical.patients where phone_e164 = '+12125550101'),
      (select id from medical.providers where full_name = 'Dr. Elena Marsh'),
      now(), now() + interval '30 minutes'
    )$$,
  'appointment with a patient and provider from the same clinic is allowed'
);

select throws_ok(
  $$insert into medical.appointments (organization_id, patient_id, provider_id, scheduled_start, scheduled_end)
    values (
      (select id from core.organizations where slug = 'lakeview-dental-care'),
      (select id from medical.patients where phone_e164 = '+12125550101'),
      (select id from medical.providers where full_name = 'Dr. Hannah Brooks'),
      now(), now() + interval '30 minutes'
    )$$,
  '23503', null, 'Lakeview appointment cannot use a Brightside patient'
);

select throws_ok(
  $$insert into medical.appointments (organization_id, patient_id, provider_id, scheduled_start, scheduled_end)
    values (
      (select id from core.organizations where slug = 'brightside-family-clinic'),
      (select id from medical.patients where phone_e164 = '+12125550101'),
      (select id from medical.providers where full_name = 'Dr. Hannah Brooks'),
      now(), now() + interval '30 minutes'
    )$$,
  '23503', null, 'Brightside appointment cannot use a Lakeview provider'
);

select throws_ok(
  $$insert into medical.appointments (organization_id, patient_id, provider_id, scheduled_start, scheduled_end, call_id)
    values (
      (select id from core.organizations where slug = 'brightside-family-clinic'),
      (select id from medical.patients where phone_e164 = '+12125550101'),
      (select id from medical.providers where full_name = 'Dr. Elena Marsh'),
      now(), now() + interval '30 minutes',
      (select id from core.calls where retell_call_id = 'call_lvd_01')
    )$$,
  '23503', null, 'Brightside appointment cannot link to a Lakeview call'
);

-- Field service

select lives_ok(
  $$insert into field_service.jobs (organization_id, customer_id, service_type)
    values (
      (select id from core.organizations where slug = 'summit-air-heating-cooling'),
      (select id from field_service.customers where phone_e164 = '+17205550171'),
      'Test job'
    )$$,
  'job with a customer from the same business is allowed'
);

select throws_ok(
  $$insert into field_service.jobs (organization_id, customer_id, service_type)
    values (
      (select id from core.organizations where slug = 'summit-air-heating-cooling'),
      (select id from field_service.customers where phone_e164 = '+15555550101'),
      'Test job'
    )$$,
  '23503', null, 'Summit job cannot use another business''s customer'
);

select throws_ok(
  $$insert into field_service.jobs (organization_id, customer_id, service_type, call_id)
    values (
      (select id from core.organizations where slug = 'summit-air-heating-cooling'),
      (select id from field_service.customers where phone_e164 = '+17205550171'),
      'Test job',
      (select id from core.calls where retell_call_id = 'call_bsc_01')
    )$$,
  '23503', null, 'Summit job cannot link to a Brightside call'
);

select throws_ok(
  $$insert into field_service.job_visits (organization_id, job_id, technician_name, scheduled_start, scheduled_end)
    values (
      (select id from core.organizations where slug = 'summit-air-heating-cooling'),
      (select j.id from field_service.jobs j
         join core.organizations o on o.id = j.organization_id
         where o.slug = 'test-plumbing-co'),
      'Test Technician',
      now(), now() + interval '1 hour'
    )$$,
  '23503', null, 'Summit visit cannot belong to another business''s job'
);

select * from finish();
rollback;
