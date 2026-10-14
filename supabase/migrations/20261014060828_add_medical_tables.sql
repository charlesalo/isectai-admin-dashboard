-- Clinic records. Parent tables have unique (organization_id, id) so child rows
-- can use composite foreign keys: an appointment in Clinic A cannot point at a
-- patient, provider or call that belongs to Clinic B.

create table medical.providers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references core.organizations (id),
  full_name text not null,
  specialty text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id)
);

create trigger set_updated_at before update on medical.providers
  for each row execute function private.set_updated_at();

create table medical.patients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references core.organizations (id),
  full_name text not null,
  phone_e164 text not null check (phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  date_of_birth date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  -- The AI receptionist matches callers to patients by phone number.
  unique (organization_id, phone_e164)
);

create trigger set_updated_at before update on medical.patients
  for each row execute function private.set_updated_at();

create table medical.appointments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references core.organizations (id),
  patient_id uuid not null,
  provider_id uuid not null,
  scheduled_start timestamptz not null,
  scheduled_end timestamptz not null,
  status medical.appointment_status not null default 'scheduled',
  reason_for_visit text,
  booked_via core.booking_channel not null default 'manual',
  call_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  check (scheduled_end > scheduled_start),
  foreign key (organization_id, patient_id) references medical.patients (organization_id, id),
  foreign key (organization_id, provider_id) references medical.providers (organization_id, id),
  -- call_id is optional. When it is null the foreign key is not checked.
  foreign key (organization_id, call_id) references core.calls (organization_id, id)
);

create index appointments_organization_id_scheduled_start_idx
  on medical.appointments (organization_id, scheduled_start);
create index appointments_scheduled_start_idx on medical.appointments (scheduled_start);
create index appointments_patient_idx on medical.appointments (organization_id, patient_id);
create index appointments_provider_idx on medical.appointments (organization_id, provider_id);
create index appointments_call_idx on medical.appointments (organization_id, call_id);

create trigger set_updated_at before update on medical.appointments
  for each row execute function private.set_updated_at();
