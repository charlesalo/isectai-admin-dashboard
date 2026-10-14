-- Schemas
-- core:          tenancy and data shared by every industry
-- medical:       clinic records (patients, appointments)
-- field_service: service business records (customers, jobs)
-- private:       helper functions, never exposed through the API

create schema core;
create schema medical;
create schema field_service;
create schema private;

-- core enums

create type core.industry as enum ('medical', 'field_service');

create type core.organization_status as enum ('active', 'onboarding', 'paused');

create type core.member_role as enum ('owner', 'admin', 'staff');

create type core.call_direction as enum ('inbound', 'outbound');

create type core.call_outcome as enum (
  'booked',
  'answered_question',
  'transferred',
  'missed',
  'voicemail'
);

create type core.event_source as enum ('retell', 'n8n', 'manual');

-- How a booking was made. Shared so both industries report AI bookings the same way.
create type core.booking_channel as enum ('ai_call', 'manual', 'online');

-- medical enums

create type medical.appointment_status as enum (
  'scheduled',
  'confirmed',
  'completed',
  'cancelled',
  'no_show'
);

-- field_service enums

create type field_service.job_priority as enum ('low', 'normal', 'urgent');

create type field_service.job_status as enum (
  'new',
  'scheduled',
  'in_progress',
  'completed',
  'cancelled'
);

create type field_service.visit_status as enum (
  'scheduled',
  'in_progress',
  'completed',
  'cancelled'
);
