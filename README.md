# iSectAI Admin Dashboard

A prototype multi-tenant database for medical clinics and service businesses that use the iSectAI AI receptionist, plus an internal admin dashboard for iSectAI staff.

- **Database:** Supabase (Postgres) with one schema per industry, row-level security on every table, and composite foreign keys that stop records from linking across businesses.
- **Dashboard:** Next.js 16, Tailwind and shadcn/ui. It reads data **as the signed-in user**, so the database's security rules decide what each person sees.

All data is fictional. Phone numbers use the 555-01xx range reserved for fiction.

**Live demo:** https://isectai-admin-dashboard.vercel.app. Demo login passwords are shared separately. The hosted version runs on Vercel with a Supabase project built from the same migrations and seed data.

For the reasoning behind the design, see [ARCHITECTURE.md](ARCHITECTURE.md). For how the project was built with Claude Code, see [AI_WORKFLOW.md](AI_WORKFLOW.md).

## Prerequisites

- Node.js 20.9 or later (built with 22 LTS) and npm
- Docker Desktop, running (the local Supabase stack runs in containers)
- Git

The Supabase CLI is a dev dependency, so `npx supabase` works without a global install.

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Start the local Supabase stack (first run downloads Docker images)
npx supabase start

# 3. Create your env file from the template
cp .env.example .env.local
```

Fill in `.env.local` using the values from `npx supabase status -o env`:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `API_URL` (`http://127.0.0.1:54321`) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `PUBLISHABLE_KEY` |
| `SUPABASE_SERVICE_ROLE_KEY` | `SERVICE_ROLE_KEY`. Used only by the seed script, never by the app. |
| `DEMO_USER_PASSWORD` | Any password you choose for the demo logins |

```bash
# 4. Build the database from migrations, load seed data, create demo users
npm run db:reset

# 5. Start the app
npm run dev
```

Open http://localhost:3000.

## Demo logins

Both users get the password you set in `DEMO_USER_PASSWORD`.

| Email | Role | Sees |
|---|---|---|
| `admin@isectai.test` | Platform admin (iSectAI staff) | All three businesses |
| `staff@brightside.test` | Staff member of Brightside Family Clinic | Brightside only |

### Isolation demo

1. Sign in as `admin@isectai.test`. The Overview shows 3 businesses, and **Businesses** lists Brightside, Lakeview and Summit Air.
2. Sign out and sign in as `staff@brightside.test`. The header shows **Member · Brightside Family Clinic**, and every number drops to Brightside's own.
3. Open http://localhost:3000/businesses/lakeview-dental-care directly. You get **Business not found**: the database returns no row, so the page can't tell that Lakeview exists.

The app has no "if admin" filtering. Both users run the same queries, and Postgres row-level security returns different rows.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | ESLint |
| `npm run db:reset` | Rebuild the database from migrations, load `supabase/seed.sql`, then create the demo users |
| `npm run seed:users` | Create or update only the demo users and memberships. Safe to run again. |
| `npx supabase test db` | Run the pgTAP security tests (72 checks) |
| `npx supabase gen types typescript --local > src/types/database.ts` | Regenerate TypeScript types after a schema change, then format with `npx oxfmt src/types/database.ts` |

Use `npm run db:reset` instead of plain `supabase db reset`. The plain reset also deletes auth users, so you'd have data but no logins.

## Tests

```bash
npx supabase test db
```

| File | Checks |
|---|---|
| `01_staff_isolation.test.sql` | Clinic staff see exactly their own business's rows in every table and view, can't write, and a user with no membership sees nothing |
| `02_admin_and_anon.test.sql` | The platform admin sees everything (read-only), and logged-out requests are denied everywhere. Also guards that fail if a future migration forgets RLS, `security_invoker`, or gives `anon` access. |
| `03_cross_tenant_keys.test.sql` | An appointment, job or visit can't reference another business's patient, provider, customer, call or job |

## Project structure

```
supabase/
  migrations/        one file per logical change (schemas → tables → RLS → views → grants)
  seed.sql           fictional businesses, contacts, bookings, calls, events
  tests/             pgTAP security tests
scripts/
  seed-users.ts      creates demo auth users (the only place the service role key is used)
src/
  proxy.ts           refreshes the session, redirects signed-out users (Next 16's "middleware")
  app/login/         sign-in page and server action
  app/(dashboard)/   overview, businesses list, business detail with tabs
  components/        shared UI (badges, stat cards, nav, empty states)
  lib/supabase/      server client and proxy session helper
  lib/auth.ts        current user and role lookup
  types/database.ts  generated Supabase types
```

## Troubleshooting

- **`supabase start` fails with "docker: command not found".** Install and open Docker Desktop, wait for "Engine running", then try again.
- **Signed in but every number is 0 after a reset.** `db:reset` recreates the demo users with new IDs, so your browser holds a session for a user that no longer exists. Sign out and sign in again.
- **"Couldn't load this page".** The app can't reach Supabase. Check `npx supabase status`, then click **Try again**.
- **`npx supabase migration new` seems to hang.** It reads SQL from stdin when not run in a terminal. Run it as `npx supabase migration new <name> < /dev/null`.

## Known limitations

This is a read-only prototype. The main gaps, and what production would add, are covered in [ARCHITECTURE.md](ARCHITECTURE.md#5-advantages-and-limitations).
