# CLAUDE.md

## Project
Prototype for the iSectAI paid trial: a multi-tenant Supabase database for medical clinics and service businesses, plus an internal admin dashboard for the iSectAI administrator. Full spec is in PLAN.md. Read it before starting any phase.

## Stack
- Next.js (App Router), TypeScript, Tailwind, shadcn/ui
- Supabase (local via `supabase start`), `@supabase/ssr`
- pgTAP tests via `supabase test db`

## Database rules (never break these)
- Schemas: `core`, `medical`, `field_service`, `private`. Never expose `private` to the API.
- Every tenant table has `organization_id uuid not null` referencing `core.organizations(id)`.
- Parent tables have `unique (organization_id, id)`. Child tables use composite foreign keys `(organization_id, <parent>_id)`.
- RLS is enabled on every table. Policies use `private.is_platform_admin()` and `private.user_org_ids()`.
- Every view is created `with (security_invoker = true)`.
- Grant access to `authenticated` only. Nothing to `anon`.
- All schema changes go in new files under `supabase/migrations/`. One logical change per migration. Never edit a migration that has already been applied; add a new one.
- `supabase db reset` must always rebuild the database and seed data from scratch.

## App rules
- The dashboard reads data as the logged-in user through RLS. Never use the service role key in app code. It is only used in `scripts/seed-users.ts`.
- Server Components fetch data. Keep Supabase clients in `src/lib/supabase/`.
- Regenerate types after schema changes: `supabase gen types typescript --local > src/types/database.ts`
- Labels follow `organizations.industry`: medical shows Patients/Appointments, field_service shows Customers/Jobs.
- Handle empty, loading, and error states.

## Git
- Follow the commit plan and rules in PLAN.md section 8.
- Conventional Commits, imperative, lowercase, under 72 characters.
- One logical change per commit, one commit per migration.
- Commit only after the relevant checks pass.
- Never commit `.env.local` or keys. Never push. I push manually.

## Working style
- Work one phase at a time from PLAN.md and stop for review at the end of each phase.
- Before writing code, briefly state what you will change and which files.
- After changes, run the relevant checks (`supabase db reset`, `supabase test db`, `npm run lint`, `npm run build`) and report results.
- Keep code simple and readable. No unused abstractions.
- Use fictional data only. No real names, phone numbers, or production credentials.
