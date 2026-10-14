-- Service business records (HVAC, plumbing, etc.). Same composite key pattern
-- as the medical schema: a job or visit can only reference rows in its own
-- organization.

create table field_service.customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references core.organizations (id),
  full_name text not null,
  phone_e164 text not null check (phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  service_address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  -- The AI receptionist matches callers to customers by phone number.
  unique (organization_id, phone_e164)
);

create trigger set_updated_at before update on field_service.customers
  for each row execute function private.set_updated_at();

create table field_service.jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references core.organizations (id),
  customer_id uuid not null,
  service_type text not null,
  description text,
  priority field_service.job_priority not null default 'normal',
  status field_service.job_status not null default 'new',
  quoted_amount numeric(10, 2) check (quoted_amount >= 0),
  booked_via core.booking_channel not null default 'manual',
  call_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  foreign key (organization_id, customer_id) references field_service.customers (organization_id, id),
  -- call_id is optional. When it is null the foreign key is not checked.
  foreign key (organization_id, call_id) references core.calls (organization_id, id)
);

create index jobs_organization_id_created_at_idx on field_service.jobs (organization_id, created_at);
create index jobs_customer_idx on field_service.jobs (organization_id, customer_id);
create index jobs_call_idx on field_service.jobs (organization_id, call_id);

create trigger set_updated_at before update on field_service.jobs
  for each row execute function private.set_updated_at();

-- A job can need more than one visit (diagnose, then come back with parts).
create table field_service.job_visits (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references core.organizations (id),
  job_id uuid not null,
  technician_name text not null,
  scheduled_start timestamptz not null,
  scheduled_end timestamptz not null,
  status field_service.visit_status not null default 'scheduled',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  check (scheduled_end > scheduled_start),
  foreign key (organization_id, job_id) references field_service.jobs (organization_id, id)
);

create index job_visits_organization_id_scheduled_start_idx
  on field_service.job_visits (organization_id, scheduled_start);
create index job_visits_scheduled_start_idx on field_service.job_visits (scheduled_start);
create index job_visits_job_idx on field_service.job_visits (organization_id, job_id);

create trigger set_updated_at before update on field_service.job_visits
  for each row execute function private.set_updated_at();
