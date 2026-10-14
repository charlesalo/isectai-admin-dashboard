-- Calls handled by the AI receptionist. Shared by both industries.
create table core.calls (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references core.organizations (id),
  direction core.call_direction not null default 'inbound',
  from_number text not null check (from_number ~ '^\+[1-9][0-9]{7,14}$'),
  to_number text not null check (to_number ~ '^\+[1-9][0-9]{7,14}$'),
  started_at timestamptz not null,
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  outcome core.call_outcome not null,
  summary text,
  -- Retell's own call id. Unique so a replayed webhook can't create a duplicate call.
  retell_call_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Lets appointments and jobs reference a call within the same organization.
  unique (organization_id, id)
);

create index calls_organization_id_started_at_idx on core.calls (organization_id, started_at);
create index calls_started_at_idx on core.calls (started_at);

create trigger set_updated_at before update on core.calls
  for each row execute function private.set_updated_at();

-- Raw inbound events (Retell webhooks, n8n runs, manual changes) for debugging
-- and future metrics. Append-only, so there is no updated_at.
create table core.integration_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references core.organizations (id),
  source core.event_source not null,
  event_type text not null,
  payload jsonb not null default '{}',
  received_at timestamptz not null default now()
);

create index integration_events_organization_id_received_at_idx
  on core.integration_events (organization_id, received_at);
create index integration_events_received_at_idx on core.integration_events (received_at);
