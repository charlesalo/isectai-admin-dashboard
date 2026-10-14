# iSectAI Paid Trial: Build Plan

Multi-tenant database + internal admin dashboard prototype for medical clinics and service businesses.

---

## 1. Key decisions (and the one-line "why" for each)

| Decision | Choice | Why |
|---|---|---|
| Database | Supabase (Postgres) | iSectAI already uses it and has n8n workflows connected. Postgres + RLS gives tenant isolation at the database level, and Auth is built in. Switching would add migration cost with no clear gain at this stage. |
| Schema layout | Hybrid: `core` + `medical` + `field_service` (+ `private` for helpers) | Matches the direction Cedrick described. Shared tenancy and cross-industry data live in `core`. Each industry's records can evolve on their own. Patient data is isolated in one schema, which makes stricter rules easier later. |
| Tenant isolation | `organization_id` on every tenant table + RLS on every table | Isolation is enforced by the database, not just by app code. |
| Cross-tenant safety | Composite foreign keys `(organization_id, id)` | Makes it impossible for an appointment in Clinic A to point at a patient in Clinic B. |
| Admin vs customer access | `core.platform_admins` table + `private.is_platform_admin()` | Internal staff are a separate role from clinic staff. Policies check one or the other. |
| Dashboard reads | Logged-in admin user through RLS (not the service role key) | Proves the security model actually works. The service role key is only used by the seed script. |
| Cross-industry views | Views in `core` with `security_invoker = true` | Lets the admin see appointments and jobs together while still respecting RLS. |
| Frontend | Next.js (App Router) + Tailwind + shadcn/ui + `@supabase/ssr` | Fast to build, server-side data fetching, easy to deploy on Vercel. |
| Language | TypeScript with generated Supabase types | Better maintainability (one of their criteria). Use plain JS if you'd rather defend code you're more fluent in. |

---

## 2. Database design

### core
- **organizations**: id, name, slug (unique), industry (`medical` | `field_service`), timezone, phone_e164, address, city, state, status (`active` | `onboarding` | `paused`), plan, created_at
- **organization_members**: organization_id, user_id (auth.users), role (`owner` | `admin` | `staff`), unique (organization_id, user_id)
- **platform_admins**: user_id (auth.users), created_at. Internal iSectAI staff only.
- **calls**: id, organization_id, direction, from_number, to_number, started_at, duration_seconds, outcome (`booked` | `answered_question` | `transferred` | `missed` | `voicemail`), summary, retell_call_id. Shared because both industries use the AI receptionist.
- **integration_events**: id, organization_id, source (`retell` | `n8n` | `manual`), event_type, payload jsonb, received_at. Raw event log for debugging and future metrics.

### medical
- **providers**: id, organization_id, full_name, specialty
- **patients**: id, organization_id, full_name, phone_e164, date_of_birth, unique (organization_id, phone_e164)
- **appointments**: id, organization_id, patient_id, provider_id, scheduled_start, scheduled_end, status (`scheduled` | `confirmed` | `completed` | `cancelled` | `no_show`), reason_for_visit, booked_via (`ai_call` | `manual` | `online`), call_id (nullable, references core.calls)

### field_service
- **customers**: id, organization_id, full_name, phone_e164, service_address, unique (organization_id, phone_e164)
- **jobs**: id, organization_id, customer_id, service_type, description, priority (`low` | `normal` | `urgent`), status (`new` | `scheduled` | `in_progress` | `completed` | `cancelled`), quoted_amount, booked_via, call_id (nullable)
- **job_visits**: id, organization_id, job_id, technician_name, scheduled_start, scheduled_end, status

### Rules that apply to every tenant table
- `organization_id uuid not null references core.organizations(id)`
- `unique (organization_id, id)` on parent tables, and composite FKs on children, e.g.
  `foreign key (organization_id, patient_id) references medical.patients (organization_id, id)`
- RLS enabled, with two policies:
  - platform admins can read everything
  - organization members can read their own organization's rows
- Indexes on `organization_id` and on the main date column (`scheduled_start`, `started_at`)
- `created_at` / `updated_at` timestamps

### private (not exposed to the API)
```sql
create function private.is_platform_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from core.platform_admins where user_id = auth.uid());
$$;

create function private.user_org_ids() returns setof uuid
language sql stable security definer set search_path = '' as $$
  select organization_id from core.organization_members where user_id = auth.uid();
$$;
```
Example policy:
```sql
create policy "tenant read" on medical.appointments for select to authenticated
using (private.is_platform_admin() or organization_id in (select private.user_org_ids()));
```
Security definer helpers avoid RLS recursion on `organization_members`.

### Admin views in core (all `with (security_invoker = true)`)
- **core.bookings**: union of medical appointments and field service job visits with shared columns (organization_id, industry, title, contact_name, scheduled_start, status, booked_via). Gives one cross-industry timeline.
- **core.organization_overview**: one row per organization with counts: contacts, upcoming bookings (next 7 days), calls (last 7 days), share of bookings made by the AI receptionist.

### Supabase config
- Expose `core`, `medical`, `field_service` in `supabase/config.toml` (`[api] schemas`) and in the hosted project's API settings. Never expose `private`.
- Grant usage on the schemas and select on tables/views to `authenticated` only. Nothing for `anon`.

---

## 3. Sample data

Use relative dates (`now() + interval '2 days'`) so the demo always looks current.

| Business | Industry | Location |
|---|---|---|
| Brightside Family Clinic | medical | New York, NY |
| Lakeview Dental Care | medical | Chicago, IL |
| Summit Air Heating & Cooling | field_service (HVAC) | Denver, CO |

Per business: 2 to 3 providers or technicians, 8 to 12 patients or customers, 15 to 20 appointments or jobs (mix of past, today, upcoming, cancelled, no-show), 15 to 25 calls (mostly AI-booked, some missed), a handful of integration events.

Users (created by a seed script with the service role key):
- `admin@isectai.test`: platform admin
- `staff@brightside.test`: member of Brightside only (used to prove isolation)

---

## 4. Admin dashboard

### Pages
1. **Login**: email/password through Supabase Auth. Non-admins are redirected or see only their own org.
2. **Overview** (`/`): platform totals (businesses, calls this week, upcoming bookings, AI-booked %), plus a "today across all businesses" list from `core.bookings`.
3. **Businesses** (`/businesses`): table of all businesses with industry badge, status, city, calls (7d), upcoming bookings, AI-booked %. Filter by industry and search by name.
4. **Business detail** (`/businesses/[slug]`): info card (contact, timezone, plan, status) and tabs:
   - Appointments (medical) or Jobs (field service), filterable by status and date
   - Patients or Customers
   - Calls (outcome, duration, summary)
   - Activity (integration events, raw JSON in an expandable row)

### Creative touches (pick 1 or 2, only if time allows)
- **Isolation demo**: log in as `staff@brightside.test` and show the dashboard returns only Brightside data. This is the strongest proof of the security model.
- **AI receptionist impact** card: % of bookings made by AI calls and missed calls per business. Ties the dashboard to what iSectAI sells.
- Industry-aware labels: "Patients / Appointments" vs "Customers / Jobs" driven by `organizations.industry`.

### UI notes
Clean, not plain. Pick one accent color, use clear status badges, empty states, and loading states. Make it look intentional rather than a default template.

---

## 5. Repo structure

```
isectai-admin-dashboard/
  CLAUDE.md
  README.md              setup + demo logins
  ARCHITECTURE.md        answers to section C of the brief
  AI_WORKFLOW.md         how Claude Code was used and reviewed
  supabase/
    config.toml
    migrations/          one file per logical change
    seed.sql
    tests/               pgTAP RLS tests
  scripts/
    seed-users.ts
  src/
    app/                 Next.js routes
    components/
    lib/supabase/        server + browser clients
    types/database.ts    generated types
```

---

## 6. Build phases (with Claude Code)

Commit after each logical step, following section 8. Review every migration and diff before accepting it.

**Phase 0: Setup (30 min)**
- `npx create-next-app`, Tailwind, shadcn/ui, `@supabase/ssr`, `supabase init`, `supabase start`
- Add CLAUDE.md, push the empty repo to GitHub

**Phase 1: Schema + RLS (2 to 3 hrs)**
- Migrations: schemas and enums, core tables, medical tables, field_service tables, private helpers, RLS policies, grants, views
- Read every migration yourself. This is the part you'll be asked about most.

**Phase 2: Seed data (1 hr)**
- `seed.sql` for businesses and records, `scripts/seed-users.ts` for auth users and memberships
- `supabase db reset` must rebuild everything from scratch

**Phase 3: RLS tests (1 hr)**
- pgTAP tests run with `supabase test db`:
  - admin sees all 3 businesses
  - Brightside staff sees only Brightside rows in every table and view
  - anon sees nothing
  - inserting an appointment that links to another org's patient fails (composite FK)

**Phase 4: Dashboard (3 to 4 hrs)**
- Auth and middleware, layout and nav, Overview, Businesses list, Business detail tabs

**Phase 5: Polish + docs (1.5 hrs)**
- Empty and error states, README, ARCHITECTURE.md, AI_WORKFLOW.md
- Optional but recommended: deploy to Vercel + a free hosted Supabase project so they can click a live link

**Phase 6: Screen recording (30 min)**
- Optional in the brief, but do it. 3 to 5 minutes: schema walkthrough, dashboard, isolation demo, one limitation and what you'd do next.

**Total: about 10 to 13 hours.** Confirm the trial's paid hours and deadline with Joel and scale the creative touches to fit.

---

## 7. ARCHITECTURE.md outline (section C of the brief)

1. **Why this architecture and technology**: Supabase reasons above. Hybrid schema because industries share tenancy and calls but differ in records and workflows.
2. **Supporting multiple businesses and industries**: `organizations.industry`, shared `core`, one schema per industry, union views for cross-industry admin screens. Adding an industry means a new schema plus updating the views.
3. **Keeping each business separate and secure**: `organization_id` everywhere, RLS on every table, composite FKs, security invoker views, `private` schema never exposed, tests that prove it.
4. **Admin vs customer access**: platform_admins vs organization_members, separate policies. In production: a custom JWT claim via an auth hook, MFA for admins, a separate customer portal app that never ships admin code.
5. **Advantages and limitations**
   - Advantages: clean boundaries, industries evolve independently, patient data isolated, isolation enforced by the database.
   - Limitations: cross-industry queries need union views, adding an industry touches the views, similar concepts (appointments vs job visits) exist twice, more schemas to expose and grant.
6. **Production improvements**: HIPAA (paid Supabase plan + BAA), audit logs for admin access to patient data, Retell webhook ingestion through Edge Functions with signature checks and idempotency keys, migrations in CI with Supabase branching, backups/PITR, partitioning or retention for `integration_events`, write paths and role-based permissions for customer users.

---

## 8. Git commits

The reviewers will likely read the commit history to see how you work. Small, clear commits support two of their criteria: problem-solving and maintainability.

### Rules
- Conventional Commits: `type(scope): message`
- Types: `feat`, `fix`, `test`, `docs`, `chore`, `refactor`
- Imperative, lowercase, under 72 characters ("add", not "added")
- One logical change per commit. One commit per migration.
- Commit only after the relevant checks pass (`supabase db reset`, `supabase test db`, `npm run lint`, `npm run build`)
- Never commit `.env.local` or any keys
- No "WIP", "fix stuff" or "update" messages
- Fixes found later get their own commit, e.g. `fix(db): add missing index on appointments.scheduled_start`

### Planned commits

**Phase 0: Setup**
```
chore: scaffold next.js app with typescript and tailwind
chore: add shadcn/ui and supabase client libraries
chore: initialize supabase local project
docs: add claude.md, plan.md and doc placeholders
```

**Phase 1: Schema + RLS**
```
feat(db): create core, medical, field_service and private schemas
feat(db): add core tables for organizations, members and admins
feat(db): add core calls and integration events tables
feat(db): add medical tables with composite tenant keys
feat(db): add field service tables with composite tenant keys
feat(db): add rls helper functions in private schema
feat(db): enable rls and add tenant and admin policies
feat(db): add security invoker views for bookings and overview
chore(db): expose schemas and grant access to authenticated role
chore: generate supabase typescript types
```

**Phase 2: Seed data**
```
feat(seed): add fictional businesses, contacts, bookings and calls
feat(seed): add script to create demo users and memberships
```

**Phase 3: RLS tests**
```
test(db): add tenant isolation tests for clinic staff
test(db): add admin access and anon denial tests
test(db): add cross-tenant foreign key tests
```

**Phase 4: Dashboard**
```
feat(auth): add supabase ssr clients and auth middleware
feat(auth): add admin login page
feat(ui): add app layout and navigation
feat(ui): add platform overview page
feat(ui): add businesses list with search and industry filter
feat(ui): add business detail page with industry-aware tabs
feat(ui): add calls and activity tabs
```

**Phase 5: Polish + docs**
```
feat(ui): add empty, loading and error states
docs: add setup instructions and demo logins to readme
docs: add architecture explanation
docs: add ai workflow notes
chore: add vercel deployment config
```

**Submission**
- Tag the final commit: `git tag -a v1.0 -m "paid trial submission"` and push with `git push --tags`

---

## 9. Interview prep: be ready to explain
- Why hybrid schemas instead of fully shared tables (and the tradeoff)
- How a Retell call would end up in `core.calls` and link to an appointment
- Why the dashboard uses the admin user's session instead of the service role key
- Why views need `security_invoker`
- What breaks if you add a third industry, and how you'd handle it
- How you used Claude Code and what you reviewed or fixed by hand
