-- Cross-industry views for the admin dashboard. security_invoker = true makes
-- each view run with the caller's permissions, so the RLS policies on the
-- underlying tables still apply. Without it, a view runs as its owner and would
-- return every tenant's rows to anyone who can select from it.

-- One timeline of bookings across industries: medical appointments and field
-- service job visits. status is text because each industry has its own enum.
create view core.bookings
with (security_invoker = true)
as
select
  a.id,
  a.organization_id,
  'medical'::core.industry as industry,
  coalesce(a.reason_for_visit, 'Appointment') as title,
  p.full_name as contact_name,
  pr.full_name as assigned_to,
  a.scheduled_start,
  a.scheduled_end,
  a.status::text as status,
  a.booked_via
from medical.appointments a
join medical.patients p on p.organization_id = a.organization_id and p.id = a.patient_id
join medical.providers pr on pr.organization_id = a.organization_id and pr.id = a.provider_id

union all

select
  v.id,
  v.organization_id,
  'field_service'::core.industry as industry,
  j.service_type as title,
  c.full_name as contact_name,
  v.technician_name as assigned_to,
  v.scheduled_start,
  v.scheduled_end,
  v.status::text as status,
  j.booked_via
from field_service.job_visits v
join field_service.jobs j on j.organization_id = v.organization_id and j.id = v.job_id
join field_service.customers c on c.organization_id = j.organization_id and c.id = j.customer_id;

-- One row per organization with the numbers the Businesses page needs.
create view core.organization_overview
with (security_invoker = true)
as
select
  o.id as organization_id,
  o.name,
  o.slug,
  o.industry,
  o.status,
  o.city,
  o.state,
  (select count(*) from medical.patients p where p.organization_id = o.id)
    + (select count(*) from field_service.customers c where c.organization_id = o.id) as contacts,
  b.upcoming_bookings_7d,
  calls.calls_7d,
  calls.missed_calls_7d,
  b.total_bookings,
  b.ai_bookings,
  -- Null when there are no bookings yet, so the UI can show "no data" instead of 0%.
  round(100.0 * b.ai_bookings / nullif(b.total_bookings, 0), 1) as ai_booked_pct
from core.organizations o
cross join lateral (
  select
    count(*) filter (
      where bk.scheduled_start >= now()
        and bk.scheduled_start < now() + interval '7 days'
        and bk.status <> 'cancelled'
    ) as upcoming_bookings_7d,
    count(*) as total_bookings,
    count(*) filter (where bk.booked_via = 'ai_call') as ai_bookings
  from core.bookings bk
  where bk.organization_id = o.id
) b
cross join lateral (
  select
    count(*) as calls_7d,
    count(*) filter (where cl.outcome = 'missed') as missed_calls_7d
  from core.calls cl
  where cl.organization_id = o.id
    and cl.started_at >= now() - interval '7 days'
) calls;
