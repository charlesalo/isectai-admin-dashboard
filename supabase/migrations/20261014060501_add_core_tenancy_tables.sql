-- Keeps updated_at current on every table that has it.
create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function private.set_updated_at() from public;

-- One row per customer business (tenant).
create table core.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  industry core.industry not null,
  timezone text not null default 'America/New_York',
  phone_e164 text check (phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  address text,
  city text,
  state text,
  status core.organization_status not null default 'onboarding',
  plan text not null default 'trial',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on core.organizations
  for each row execute function private.set_updated_at();

-- Customer users (clinic or business staff) and the organizations they belong to.
create table core.organization_members (
  organization_id uuid not null references core.organizations (id),
  user_id uuid not null references auth.users (id) on delete cascade,
  role core.member_role not null default 'staff',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

-- private.user_org_ids() looks members up by user_id.
create index organization_members_user_id_idx on core.organization_members (user_id);

create trigger set_updated_at before update on core.organization_members
  for each row execute function private.set_updated_at();

-- Internal iSectAI staff. Separate from organization_members on purpose:
-- a platform admin is not a member of any tenant.
create table core.platform_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
