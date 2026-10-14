-- Demo data for local development. Everything here is fictional.
-- Phone numbers use the 555-01xx range, which is reserved for fiction.
--
-- Dates are relative to the day `supabase db reset` runs, so the dashboard
-- always has past, today and upcoming bookings. Times are local to each
-- business: (current_date + day_offset + start_time) at time zone o.timezone.
--
-- Rows are linked by natural keys (org slug, phone number, provider name,
-- retell_call_id) instead of hardcoded UUIDs. Auth users and memberships are
-- created separately by scripts/seed-users.ts.

-- Organizations

insert into core.organizations (name, slug, industry, timezone, phone_e164, address, city, state, status, plan)
values
  ('Brightside Family Clinic', 'brightside-family-clinic', 'medical', 'America/New_York',
   '+12125550100', '418 Hudson Lane, Suite 2', 'New York', 'NY', 'active', 'growth'),
  ('Lakeview Dental Care', 'lakeview-dental-care', 'medical', 'America/Chicago',
   '+13125550140', '2750 Lakeshore Terrace', 'Chicago', 'IL', 'active', 'starter'),
  ('Summit Air Heating & Cooling', 'summit-air-heating-cooling', 'field_service', 'America/Denver',
   '+17205550170', '1600 Foothill Commerce Pkwy', 'Denver', 'CO', 'onboarding', 'trial');

-- Medical: providers

insert into medical.providers (organization_id, full_name, specialty)
select o.id, v.full_name, v.specialty
from (values
  ('brightside-family-clinic', 'Dr. Elena Marsh', 'Family Medicine'),
  ('brightside-family-clinic', 'Dr. Samuel Okoye', 'Internal Medicine'),
  ('brightside-family-clinic', 'Priya Nandakumar, NP', 'Nurse Practitioner'),
  ('lakeview-dental-care', 'Dr. Hannah Brooks', 'General Dentistry'),
  ('lakeview-dental-care', 'Dr. Luis Romero', 'Orthodontics'),
  ('lakeview-dental-care', 'Carla Jensen, RDH', 'Dental Hygiene')
) as v(org_slug, full_name, specialty)
join core.organizations o on o.slug = v.org_slug;

-- Medical: patients

insert into medical.patients (organization_id, full_name, phone_e164, date_of_birth)
select o.id, v.full_name, v.phone_e164, v.date_of_birth::date
from (values
  ('brightside-family-clinic', 'Jordan Ellis', '+12125550101', '1985-03-14'),
  ('brightside-family-clinic', 'Maria Delgado', '+12125550102', '1972-11-02'),
  ('brightside-family-clinic', 'Kevin Tran', '+12125550103', '1990-06-21'),
  ('brightside-family-clinic', 'Aisha Rahman', '+12125550104', '1968-01-30'),
  ('brightside-family-clinic', 'Thomas Becker', '+12125550105', '1955-09-09'),
  ('brightside-family-clinic', 'Lucy Hart', '+12125550106', '2001-04-17'),
  ('brightside-family-clinic', 'Daniel Kim', '+12125550107', '1979-12-05'),
  ('brightside-family-clinic', 'Grace Whitfield', '+12125550108', '1993-08-28'),
  ('brightside-family-clinic', 'Omar Haddad', '+12125550109', '1960-02-11'),
  ('brightside-family-clinic', 'Nina Petrova', '+12125550110', '1988-10-19'),
  ('lakeview-dental-care', 'Ethan Walsh', '+13125550141', '1987-05-03'),
  ('lakeview-dental-care', 'Sofia Marino', '+13125550142', '1995-07-22'),
  ('lakeview-dental-care', 'Marcus Bell', '+13125550143', '1974-03-08'),
  ('lakeview-dental-care', 'Leah Goldberg', '+13125550144', '2008-11-15'),
  ('lakeview-dental-care', 'Victor Huang', '+13125550145', '1966-06-30'),
  ('lakeview-dental-care', 'Fatima Siddiqui', '+13125550146', '1991-01-12'),
  ('lakeview-dental-care', 'Ryan O''Connell', '+13125550147', '1983-09-25'),
  ('lakeview-dental-care', 'Ivy Chen', '+13125550148', '2012-02-04'),
  ('lakeview-dental-care', 'George Papadakis', '+13125550149', '1958-12-19')
) as v(org_slug, full_name, phone_e164, date_of_birth)
join core.organizations o on o.slug = v.org_slug;

-- Field service: customers

insert into field_service.customers (organization_id, full_name, phone_e164, service_address)
select o.id, v.full_name, v.phone_e164, v.service_address
from (values
  ('summit-air-heating-cooling', 'Brian Foster', '+17205550171', '1420 Aspen Ridge Dr, Denver, CO'),
  ('summit-air-heating-cooling', 'Denise Clark', '+17205550172', '88 Larkspur Ct, Denver, CO'),
  ('summit-air-heating-cooling', 'Hector Ramos', '+17205550173', '3105 Willow Bend Ave, Denver, CO'),
  ('summit-air-heating-cooling', 'Julia Novak', '+17205550174', '47 Pine Hollow Rd, Lakewood, CO'),
  ('summit-air-heating-cooling', 'Andre Mitchell', '+17205550175', '910 Canyon View Ln, Aurora, CO'),
  ('summit-air-heating-cooling', 'Wendy Park', '+17205550176', '2230 Silverleaf St, Denver, CO'),
  ('summit-air-heating-cooling', 'Samir Patel', '+17205550177', '15 Copper Creek Way, Englewood, CO'),
  ('summit-air-heating-cooling', 'Olivia Grant', '+17205550178', '602 Bluebell Dr, Denver, CO'),
  ('summit-air-heating-cooling', 'Frank Delaney', '+17205550179', '77 Meadowlark Cir, Arvada, CO'),
  ('summit-air-heating-cooling', 'Rosa Jimenez', '+17205550180', '1189 Juniper Trail, Denver, CO')
) as v(org_slug, full_name, phone_e164, service_address)
join core.organizations o on o.slug = v.org_slug;

-- Calls answered by the AI receptionist. Callers 0190-0199 are new callers
-- who are not patients or customers yet.

insert into core.calls (organization_id, direction, from_number, to_number, started_at, duration_seconds, outcome, summary, retell_call_id)
select
  o.id,
  'inbound',
  v.from_number,
  o.phone_e164,
  (current_date + v.day_offset + v.start_time) at time zone o.timezone,
  v.duration_seconds,
  v.outcome::core.call_outcome,
  v.summary,
  v.retell_call_id
from (values
  -- Brightside Family Clinic
  ('brightside-family-clinic', 'call_bsc_01', '+12125550101', -18, time '09:12', 184, 'booked', 'Booked an annual physical with Dr. Marsh.'),
  ('brightside-family-clinic', 'call_bsc_02', '+12125550102', -15, time '10:40', 212, 'booked', 'Booked a blood pressure check.'),
  ('brightside-family-clinic', 'call_bsc_03', '+12125550195', -14, time '13:05', 95, 'answered_question', 'Asked which insurance plans are accepted.'),
  ('brightside-family-clinic', 'call_bsc_04', '+12125550103', -12, time '08:55', 3, 'missed', 'Caller hung up during the greeting.'),
  ('brightside-family-clinic', 'call_bsc_05', '+12125550104', -10, time '11:20', 240, 'booked', 'Booked a visit for a persistent cough.'),
  ('brightside-family-clinic', 'call_bsc_06', '+12125550105', -9, time '15:45', 130, 'transferred', 'Asked for a prescription refill. Transferred to the nurse line.'),
  ('brightside-family-clinic', 'call_bsc_07', '+12125550106', -8, time '09:30', 176, 'booked', 'Booked a new patient visit.'),
  ('brightside-family-clinic', 'call_bsc_08', '+12125550107', -6, time '10:05', 198, 'booked', 'Booked a follow-up to review lab results.'),
  ('brightside-family-clinic', 'call_bsc_09', '+12125550196', -6, time '12:15', 60, 'voicemail', 'Left a voicemail asking about weekend hours.'),
  ('brightside-family-clinic', 'call_bsc_10', '+12125550108', -5, time '09:00', 222, 'booked', 'Booked a visit for a sprained ankle.'),
  ('brightside-family-clinic', 'call_bsc_11', '+12125550109', -5, time '16:40', 2, 'missed', 'Call dropped after two seconds.'),
  ('brightside-family-clinic', 'call_bsc_12', '+12125550101', -4, time '11:10', 85, 'answered_question', 'Asked how to prepare for an annual physical.'),
  ('brightside-family-clinic', 'call_bsc_13', '+12125550110', -4, time '14:25', 205, 'booked', 'Booked a flu shot and checkup.'),
  ('brightside-family-clinic', 'call_bsc_14', '+12125550102', -3, time '10:50', 150, 'booked', 'Booked a blood pressure follow-up.'),
  ('brightside-family-clinic', 'call_bsc_15', '+12125550197', -3, time '17:55', 0, 'missed', 'After-hours call. Caller hung up before the greeting.'),
  ('brightside-family-clinic', 'call_bsc_16', '+12125550103', -2, time '09:35', 190, 'booked', 'Booked a visit for recurring migraines.'),
  ('brightside-family-clinic', 'call_bsc_17', '+12125550104', -2, time '13:00', 110, 'transferred', 'Billing question. Transferred to the front desk.'),
  ('brightside-family-clinic', 'call_bsc_18', '+12125550105', -1, time '08:45', 200, 'booked', 'Booked a diabetes check-in.'),
  ('brightside-family-clinic', 'call_bsc_19', '+12125550198', -1, time '12:30', 75, 'answered_question', 'Asked for directions and parking information.'),
  ('brightside-family-clinic', 'call_bsc_20', '+12125550106', -1, time '15:10', 168, 'booked', 'Booked a follow-up on new patient intake results.'),
  -- Lakeview Dental Care
  ('lakeview-dental-care', 'call_lvd_01', '+13125550141', -16, time '09:20', 160, 'booked', 'Booked a cleaning with the hygienist.'),
  ('lakeview-dental-care', 'call_lvd_02', '+13125550142', -13, time '11:45', 190, 'booked', 'Booked a clear aligner consultation.'),
  ('lakeview-dental-care', 'call_lvd_03', '+13125550190', -12, time '14:10', 70, 'answered_question', 'Asked whether the office accepts new patients.'),
  ('lakeview-dental-care', 'call_lvd_04', '+13125550143', -10, time '08:30', 3, 'missed', 'Caller hung up during the greeting.'),
  ('lakeview-dental-care', 'call_lvd_05', '+13125550144', -8, time '16:20', 210, 'booked', 'Parent booked a cleaning for their teenager.'),
  ('lakeview-dental-care', 'call_lvd_06', '+13125550145', -7, time '10:15', 140, 'transferred', 'Reported a broken crown. Transferred to the on-call dentist.'),
  ('lakeview-dental-care', 'call_lvd_07', '+13125550146', -6, time '09:05', 175, 'booked', 'Booked a filling.'),
  ('lakeview-dental-care', 'call_lvd_08', '+13125550191', -5, time '13:40', 40, 'voicemail', 'Left a voicemail asking about whitening prices.'),
  ('lakeview-dental-care', 'call_lvd_09', '+13125550147', -4, time '10:30', 185, 'booked', 'Booked an emergency visit for tooth pain.'),
  ('lakeview-dental-care', 'call_lvd_10', '+13125550148', -4, time '15:15', 200, 'booked', 'Parent booked an orthodontic check for their child.'),
  ('lakeview-dental-care', 'call_lvd_11', '+13125550149', -3, time '11:00', 95, 'answered_question', 'Asked how long a denture adjustment takes.'),
  ('lakeview-dental-care', 'call_lvd_12', '+13125550192', -3, time '19:10', 0, 'missed', 'After-hours call. Caller hung up before the greeting.'),
  ('lakeview-dental-care', 'call_lvd_13', '+13125550142', -2, time '09:50', 150, 'booked', 'Rebooked the clear aligner consultation for a later date.'),
  ('lakeview-dental-care', 'call_lvd_14', '+13125550143', -2, time '12:20', 180, 'booked', 'Booked a crown fitting.'),
  ('lakeview-dental-care', 'call_lvd_15', '+13125550193', -1, time '10:40', 5, 'missed', 'Call dropped during the greeting.'),
  ('lakeview-dental-care', 'call_lvd_16', '+13125550149', -1, time '14:00', 165, 'booked', 'Booked a denture adjustment.'),
  ('lakeview-dental-care', 'call_lvd_17', '+13125550141', -1, time '16:30', 80, 'answered_question', 'Asked about sensitivity after a cleaning.'),
  -- Summit Air Heating & Cooling
  ('summit-air-heating-cooling', 'call_sah_01', '+17205550171', -20, time '07:50', 210, 'booked', 'No heat. Booked a furnace repair.'),
  ('summit-air-heating-cooling', 'call_sah_02', '+17205550172', -17, time '10:15', 180, 'booked', 'Booked an AC tune-up.'),
  ('summit-air-heating-cooling', 'call_sah_03', '+17205550194', -16, time '12:00', 90, 'answered_question', 'Asked for a ballpark price on a new furnace.'),
  ('summit-air-heating-cooling', 'call_sah_04', '+17205550173', -14, time '08:10', 230, 'booked', 'Water heater leaking. Booked an urgent visit.'),
  ('summit-air-heating-cooling', 'call_sah_05', '+17205550174', -12, time '17:45', 0, 'missed', 'Caller hung up during the greeting.'),
  ('summit-air-heating-cooling', 'call_sah_06', '+17205550175', -11, time '09:40', 195, 'booked', 'Booked a smart thermostat installation.'),
  ('summit-air-heating-cooling', 'call_sah_07', '+17205550176', -9, time '11:30', 120, 'transferred', 'Asked about a warranty claim. Transferred to the office manager.'),
  ('summit-air-heating-cooling', 'call_sah_08', '+17205550177', -8, time '14:05', 205, 'booked', 'Booked a duct cleaning estimate.'),
  ('summit-air-heating-cooling', 'call_sah_09', '+17205550195', -7, time '20:30', 35, 'voicemail', 'After-hours voicemail about a noisy furnace.'),
  ('summit-air-heating-cooling', 'call_sah_10', '+17205550178', -6, time '08:20', 240, 'booked', 'Furnace short-cycling. Booked a diagnostic visit.'),
  ('summit-air-heating-cooling', 'call_sah_11', '+17205550179', -6, time '13:15', 190, 'booked', 'Booked a heat pump quote.'),
  ('summit-air-heating-cooling', 'call_sah_12', '+17205550196', -5, time '10:00', 4, 'missed', 'Call dropped during the greeting.'),
  ('summit-air-heating-cooling', 'call_sah_13', '+17205550180', -5, time '15:50', 175, 'booked', 'Booked a whole-home humidifier installation.'),
  ('summit-air-heating-cooling', 'call_sah_14', '+17205550171', -4, time '09:25', 100, 'answered_question', 'Asked when the replacement furnace part will arrive.'),
  ('summit-air-heating-cooling', 'call_sah_15', '+17205550174', -4, time '11:40', 215, 'booked', 'Booked a furnace safety check and carbon monoxide detector install.'),
  ('summit-air-heating-cooling', 'call_sah_16', '+17205550197', -3, time '07:30', 0, 'missed', 'Caller hung up before the greeting.'),
  ('summit-air-heating-cooling', 'call_sah_17', '+17205550172', -3, time '12:45', 160, 'booked', 'Booked a furnace tune-up before winter.'),
  ('summit-air-heating-cooling', 'call_sah_18', '+17205550198', -2, time '09:10', 85, 'answered_question', 'Asked whether the company services boilers.'),
  ('summit-air-heating-cooling', 'call_sah_19', '+17205550176', -2, time '14:30', 185, 'booked', 'Booked a warranty repair visit.'),
  ('summit-air-heating-cooling', 'call_sah_20', '+17205550199', -1, time '18:20', 30, 'voicemail', 'Voicemail asking for a callback about a quote.'),
  ('summit-air-heating-cooling', 'call_sah_21', '+17205550177', -1, time '10:05', 170, 'booked', 'Booked the full duct cleaning.'),
  ('summit-air-heating-cooling', 'call_sah_22', '+17205550175', -1, time '16:10', 6, 'missed', 'Call dropped during the greeting.')
) as v(org_slug, retell_call_id, from_number, day_offset, start_time, duration_seconds, outcome, summary)
join core.organizations o on o.slug = v.org_slug;

-- Medical: appointments. AI-booked appointments link to the call that booked them.

insert into medical.appointments (organization_id, patient_id, provider_id, scheduled_start, scheduled_end, status, reason_for_visit, booked_via, call_id)
select
  o.id,
  p.id,
  pr.id,
  (current_date + v.day_offset + v.start_time) at time zone o.timezone,
  (current_date + v.day_offset + v.start_time) at time zone o.timezone + make_interval(mins => v.minutes),
  v.status::medical.appointment_status,
  v.reason_for_visit,
  v.booked_via::core.booking_channel,
  c.id
from (values
  -- Brightside Family Clinic
  ('brightside-family-clinic', '+12125550101', 'Dr. Elena Marsh', -11, time '09:00', 30, 'completed', 'Annual physical', 'ai_call', 'call_bsc_01'),
  ('brightside-family-clinic', '+12125550102', 'Dr. Samuel Okoye', -12, time '10:00', 30, 'completed', 'Blood pressure check', 'ai_call', 'call_bsc_02'),
  ('brightside-family-clinic', '+12125550104', 'Priya Nandakumar, NP', -9, time '14:00', 20, 'completed', 'Persistent cough', 'ai_call', 'call_bsc_05'),
  ('brightside-family-clinic', '+12125550103', 'Dr. Samuel Okoye', -7, time '11:00', 30, 'no_show', 'Knee pain', 'manual', null),
  ('brightside-family-clinic', '+12125550106', 'Dr. Elena Marsh', -6, time '09:30', 45, 'completed', 'New patient visit', 'ai_call', 'call_bsc_07'),
  ('brightside-family-clinic', '+12125550108', 'Priya Nandakumar, NP', -3, time '10:00', 20, 'completed', 'Sprained ankle', 'ai_call', 'call_bsc_10'),
  ('brightside-family-clinic', '+12125550107', 'Dr. Samuel Okoye', -2, time '13:30', 30, 'completed', 'Lab results follow-up', 'ai_call', 'call_bsc_08'),
  ('brightside-family-clinic', '+12125550109', 'Dr. Elena Marsh', -1, time '15:00', 30, 'cancelled', 'Skin rash', 'online', null),
  ('brightside-family-clinic', '+12125550110', 'Priya Nandakumar, NP', 0, time '09:00', 20, 'confirmed', 'Flu shot and checkup', 'ai_call', 'call_bsc_13'),
  ('brightside-family-clinic', '+12125550102', 'Dr. Samuel Okoye', 0, time '11:30', 30, 'confirmed', 'Blood pressure follow-up', 'ai_call', 'call_bsc_14'),
  ('brightside-family-clinic', '+12125550105', 'Dr. Elena Marsh', 0, time '14:00', 30, 'scheduled', 'Diabetes check-in', 'ai_call', 'call_bsc_18'),
  ('brightside-family-clinic', '+12125550103', 'Dr. Elena Marsh', 1, time '10:00', 30, 'scheduled', 'Recurring migraines', 'ai_call', 'call_bsc_16'),
  ('brightside-family-clinic', '+12125550106', 'Dr. Samuel Okoye', 2, time '09:00', 30, 'confirmed', 'Intake results follow-up', 'ai_call', 'call_bsc_20'),
  ('brightside-family-clinic', '+12125550108', 'Priya Nandakumar, NP', 3, time '16:00', 20, 'scheduled', 'Ankle recheck', 'manual', null),
  ('brightside-family-clinic', '+12125550109', 'Dr. Elena Marsh', 4, time '11:00', 30, 'scheduled', 'Skin rash', 'online', null),
  ('brightside-family-clinic', '+12125550104', 'Dr. Elena Marsh', 5, time '15:30', 30, 'cancelled', 'Cough follow-up', 'manual', null),
  ('brightside-family-clinic', '+12125550101', 'Dr. Samuel Okoye', 6, time '13:00', 30, 'scheduled', 'Cholesterol review', 'manual', null),
  ('brightside-family-clinic', '+12125550107', 'Priya Nandakumar, NP', 9, time '10:30', 20, 'scheduled', 'Vaccination', 'online', null),
  -- Lakeview Dental Care
  ('lakeview-dental-care', '+13125550141', 'Carla Jensen, RDH', -12, time '09:00', 60, 'completed', 'Cleaning', 'ai_call', 'call_lvd_01'),
  ('lakeview-dental-care', '+13125550142', 'Dr. Luis Romero', -9, time '11:00', 45, 'cancelled', 'Clear aligner consultation', 'ai_call', 'call_lvd_02'),
  ('lakeview-dental-care', '+13125550143', 'Dr. Hannah Brooks', -8, time '13:00', 30, 'no_show', 'Checkup', 'online', null),
  ('lakeview-dental-care', '+13125550145', 'Dr. Hannah Brooks', -7, time '08:30', 30, 'completed', 'Broken crown assessment', 'manual', null),
  ('lakeview-dental-care', '+13125550144', 'Carla Jensen, RDH', -5, time '15:00', 60, 'completed', 'Cleaning', 'ai_call', 'call_lvd_05'),
  ('lakeview-dental-care', '+13125550146', 'Dr. Hannah Brooks', -4, time '10:00', 60, 'completed', 'Filling', 'ai_call', 'call_lvd_07'),
  ('lakeview-dental-care', '+13125550147', 'Dr. Hannah Brooks', -3, time '08:00', 30, 'completed', 'Emergency visit for tooth pain', 'ai_call', 'call_lvd_09'),
  ('lakeview-dental-care', '+13125550149', 'Dr. Hannah Brooks', 0, time '10:00', 30, 'scheduled', 'Denture adjustment', 'ai_call', 'call_lvd_16'),
  ('lakeview-dental-care', '+13125550148', 'Dr. Luis Romero', 0, time '15:30', 30, 'confirmed', 'Orthodontic check', 'ai_call', 'call_lvd_10'),
  ('lakeview-dental-care', '+13125550141', 'Carla Jensen, RDH', 1, time '13:00', 30, 'cancelled', 'Whitening', 'online', null),
  ('lakeview-dental-care', '+13125550143', 'Dr. Hannah Brooks', 2, time '09:00', 60, 'confirmed', 'Crown fitting', 'ai_call', 'call_lvd_14'),
  ('lakeview-dental-care', '+13125550142', 'Dr. Luis Romero', 3, time '11:00', 45, 'scheduled', 'Clear aligner consultation', 'ai_call', 'call_lvd_13'),
  ('lakeview-dental-care', '+13125550145', 'Dr. Hannah Brooks', 5, time '14:00', 60, 'scheduled', 'Crown placement', 'manual', null),
  ('lakeview-dental-care', '+13125550144', 'Carla Jensen, RDH', 8, time '16:00', 60, 'scheduled', 'Sealants', 'online', null),
  ('lakeview-dental-care', '+13125550147', 'Dr. Hannah Brooks', 10, time '10:00', 60, 'scheduled', 'Root canal follow-up', 'manual', null),
  ('lakeview-dental-care', '+13125550146', 'Carla Jensen, RDH', 13, time '09:00', 60, 'scheduled', 'Cleaning', 'manual', null)
) as v(org_slug, patient_phone, provider_name, day_offset, start_time, minutes, status, reason_for_visit, booked_via, retell_call_id)
join core.organizations o on o.slug = v.org_slug
join medical.patients p on p.organization_id = o.id and p.phone_e164 = v.patient_phone
join medical.providers pr on pr.organization_id = o.id and pr.full_name = v.provider_name
left join core.calls c on c.retell_call_id = v.retell_call_id;

-- Field service: jobs. created_at is backdated to when the job came in.

insert into field_service.jobs (organization_id, customer_id, service_type, description, priority, status, quoted_amount, booked_via, call_id, created_at)
select
  o.id,
  cu.id,
  v.service_type,
  v.description,
  v.priority::field_service.job_priority,
  v.status::field_service.job_status,
  v.quoted_amount::numeric,
  v.booked_via::core.booking_channel,
  c.id,
  coalesce(c.started_at, now() + make_interval(days => v.created_offset))
from (values
  ('summit-air-heating-cooling', '+17205550171', 'Furnace repair', 'No heat. Igniter failed; replacement part on order.', 'urgent', 'in_progress', '385.00', 'ai_call', 'call_sah_01', -20),
  ('summit-air-heating-cooling', '+17205550176', 'AC repair', 'AC blowing warm air. Recharged refrigerant.', 'normal', 'completed', '275.00', 'manual', null, -17),
  ('summit-air-heating-cooling', '+17205550172', 'AC tune-up', 'End-of-season AC maintenance.', 'low', 'completed', '129.00', 'ai_call', 'call_sah_02', -17),
  ('summit-air-heating-cooling', '+17205550173', 'Water heater repair', 'Leak at the base of the tank.', 'urgent', 'completed', '640.00', 'ai_call', 'call_sah_04', -14),
  ('summit-air-heating-cooling', '+17205550175', 'Thermostat installation', 'Replace old thermostat with a smart thermostat.', 'normal', 'completed', '245.00', 'ai_call', 'call_sah_06', -11),
  ('summit-air-heating-cooling', '+17205550177', 'Duct cleaning estimate', 'Walkthrough to estimate duct cleaning for a two-story home.', 'low', 'completed', null, 'ai_call', 'call_sah_08', -8),
  ('summit-air-heating-cooling', '+17205550178', 'Furnace diagnostic', 'Furnace short-cycling. Flame sensor cleaned; return visit to check the blower.', 'normal', 'in_progress', '149.00', 'ai_call', 'call_sah_10', -6),
  ('summit-air-heating-cooling', '+17205550179', 'Heat pump quote', 'Quote to replace the furnace and AC with a heat pump.', 'low', 'scheduled', null, 'ai_call', 'call_sah_11', -6),
  ('summit-air-heating-cooling', '+17205550180', 'Humidifier installation', 'Install a whole-home humidifier on the existing furnace.', 'normal', 'in_progress', '410.00', 'ai_call', 'call_sah_13', -5),
  ('summit-air-heating-cooling', '+17205550174', 'Furnace safety check', 'Install carbon monoxide detectors and inspect the furnace.', 'urgent', 'scheduled', '189.00', 'ai_call', 'call_sah_15', -4),
  ('summit-air-heating-cooling', '+17205550172', 'Furnace tune-up', 'Pre-winter furnace maintenance.', 'low', 'scheduled', '139.00', 'ai_call', 'call_sah_17', -3),
  ('summit-air-heating-cooling', '+17205550171', 'Air filter replacement', 'Customer replaced the filter themselves.', 'low', 'cancelled', '60.00', 'manual', null, -3),
  ('summit-air-heating-cooling', '+17205550176', 'Warranty repair', 'AC capacitor failed again under warranty.', 'normal', 'scheduled', '0.00', 'ai_call', 'call_sah_19', -2),
  ('summit-air-heating-cooling', '+17205550177', 'Duct cleaning', 'Full duct cleaning from the approved estimate.', 'normal', 'scheduled', '520.00', 'ai_call', 'call_sah_21', -1),
  ('summit-air-heating-cooling', '+17205550173', 'Water heater flush', 'Annual water heater flush.', 'low', 'scheduled', '99.00', 'manual', null, -1),
  ('summit-air-heating-cooling', '+17205550180', 'Mini-split quote', 'Quote for a ductless mini-split in the garage workshop.', 'low', 'new', null, 'online', null, 0)
) as v(org_slug, customer_phone, service_type, description, priority, status, quoted_amount, booked_via, retell_call_id, created_offset)
join core.organizations o on o.slug = v.org_slug
join field_service.customers cu on cu.organization_id = o.id and cu.phone_e164 = v.customer_phone
left join core.calls c on c.retell_call_id = v.retell_call_id;

-- Field service: job visits. Jobs are identified by customer phone + service type.

insert into field_service.job_visits (organization_id, job_id, technician_name, scheduled_start, scheduled_end, status)
select
  o.id,
  j.id,
  v.technician_name,
  (current_date + v.day_offset + v.start_time) at time zone o.timezone,
  (current_date + v.day_offset + v.start_time) at time zone o.timezone + make_interval(mins => v.minutes),
  v.status::field_service.visit_status
from (values
  ('summit-air-heating-cooling', '+17205550171', 'Furnace repair', 'Jake Moreno', -19, time '08:00', 90, 'completed'),
  ('summit-air-heating-cooling', '+17205550171', 'Furnace repair', 'Jake Moreno', 1, time '09:00', 120, 'scheduled'),
  ('summit-air-heating-cooling', '+17205550176', 'AC repair', 'Jake Moreno', -16, time '14:00', 120, 'completed'),
  ('summit-air-heating-cooling', '+17205550172', 'AC tune-up', 'Tanya Fields', -15, time '10:00', 90, 'completed'),
  ('summit-air-heating-cooling', '+17205550173', 'Water heater repair', 'Chris Albright', -14, time '13:00', 180, 'completed'),
  ('summit-air-heating-cooling', '+17205550175', 'Thermostat installation', 'Tanya Fields', -9, time '09:00', 60, 'completed'),
  ('summit-air-heating-cooling', '+17205550177', 'Duct cleaning estimate', 'Chris Albright', -6, time '11:00', 60, 'completed'),
  ('summit-air-heating-cooling', '+17205550178', 'Furnace diagnostic', 'Jake Moreno', -5, time '10:00', 90, 'completed'),
  ('summit-air-heating-cooling', '+17205550178', 'Furnace diagnostic', 'Jake Moreno', 0, time '13:00', 120, 'scheduled'),
  ('summit-air-heating-cooling', '+17205550171', 'Air filter replacement', 'Jake Moreno', -2, time '15:00', 30, 'cancelled'),
  ('summit-air-heating-cooling', '+17205550180', 'Humidifier installation', 'Tanya Fields', 0, time '09:00', 180, 'in_progress'),
  ('summit-air-heating-cooling', '+17205550174', 'Furnace safety check', 'Chris Albright', 0, time '15:00', 90, 'scheduled'),
  ('summit-air-heating-cooling', '+17205550176', 'Warranty repair', 'Jake Moreno', 2, time '13:00', 120, 'scheduled'),
  ('summit-air-heating-cooling', '+17205550179', 'Heat pump quote', 'Tanya Fields', 3, time '10:00', 60, 'scheduled'),
  ('summit-air-heating-cooling', '+17205550177', 'Duct cleaning', 'Chris Albright', 4, time '08:00', 240, 'scheduled'),
  ('summit-air-heating-cooling', '+17205550172', 'Furnace tune-up', 'Tanya Fields', 6, time '09:00', 90, 'scheduled'),
  ('summit-air-heating-cooling', '+17205550173', 'Water heater flush', 'Chris Albright', 8, time '10:00', 60, 'scheduled')
) as v(org_slug, customer_phone, service_type, technician_name, day_offset, start_time, minutes, status)
join core.organizations o on o.slug = v.org_slug
join field_service.customers cu on cu.organization_id = o.id and cu.phone_e164 = v.customer_phone
join field_service.jobs j on j.organization_id = o.id and j.customer_id = cu.id and j.service_type = v.service_type;

-- Integration events: a few raw events per business, as Retell and n8n would send them.

insert into core.integration_events (organization_id, source, event_type, payload, received_at)
select o.id, v.source::core.event_source, v.event_type, v.payload::jsonb, now() - make_interval(hours => v.hours_ago)
from (values
  -- Brightside Family Clinic
  ('brightside-family-clinic', 'retell', 'call_ended', '{"call_id": "call_bsc_20", "duration_seconds": 168, "disconnect_reason": "agent_hangup"}', 20),
  ('brightside-family-clinic', 'n8n', 'appointment_booked', '{"workflow": "book-appointment", "status": "success", "retell_call_id": "call_bsc_20", "provider": "Dr. Samuel Okoye"}', 20),
  ('brightside-family-clinic', 'retell', 'call_ended', '{"call_id": "call_bsc_19", "duration_seconds": 75, "disconnect_reason": "user_hangup"}', 23),
  ('brightside-family-clinic', 'n8n', 'reminders_sent', '{"workflow": "appointment-reminders", "status": "success", "sms_sent": 3}', 6),
  ('brightside-family-clinic', 'manual', 'settings_updated', '{"field": "business_hours", "changed_by": "admin@isectai.test"}', 50),
  -- Lakeview Dental Care
  ('lakeview-dental-care', 'retell', 'call_ended', '{"call_id": "call_lvd_16", "duration_seconds": 165, "disconnect_reason": "agent_hangup"}', 26),
  ('lakeview-dental-care', 'n8n', 'appointment_booked', '{"workflow": "book-appointment", "status": "success", "retell_call_id": "call_lvd_16", "provider": "Dr. Hannah Brooks"}', 26),
  ('lakeview-dental-care', 'retell', 'call_ended', '{"call_id": "call_lvd_15", "duration_seconds": 5, "disconnect_reason": "user_hangup"}', 30),
  ('lakeview-dental-care', 'n8n', 'reminders_sent', '{"workflow": "appointment-reminders", "status": "success", "sms_sent": 2}', 8),
  -- Summit Air Heating & Cooling
  ('summit-air-heating-cooling', 'retell', 'call_ended', '{"call_id": "call_sah_21", "duration_seconds": 170, "disconnect_reason": "agent_hangup"}', 30),
  ('summit-air-heating-cooling', 'n8n', 'job_created', '{"workflow": "book-job", "status": "success", "retell_call_id": "call_sah_21", "service_type": "Duct cleaning"}', 30),
  ('summit-air-heating-cooling', 'n8n', 'job_created', '{"workflow": "book-job", "status": "error", "retell_call_id": "call_sah_19", "error": "Technician calendar unavailable, retried"}', 47),
  ('summit-air-heating-cooling', 'n8n', 'job_created', '{"workflow": "book-job", "status": "success", "retell_call_id": "call_sah_19", "service_type": "Warranty repair"}', 46),
  ('summit-air-heating-cooling', 'manual', 'onboarding_step_completed', '{"step": "connect_phone_number", "changed_by": "admin@isectai.test"}', 120)
) as v(org_slug, source, event_type, payload, hours_ago)
join core.organizations o on o.slug = v.org_slug;
