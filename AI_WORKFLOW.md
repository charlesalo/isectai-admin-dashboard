# AI Workflow

This project was built with Claude Code (Anthropic's CLI coding agent) working in this repository. This document records how it was directed, how its work was checked, and what was caught along the way.

## How the work was directed

- **`CLAUDE.md`** holds the rules Claude Code reads at the start of every session:
  - Database rules: schemas, `organization_id` on every table, composite foreign keys, RLS, `security_invoker` views, no grants to `anon`.
  - App rules: read data as the signed-in user, never use the service role key in app code.
  - Git rules: Conventional Commits, one commit per migration.
  - Working style.
- **`PLAN.md`** holds the full spec: schema design, sample data, pages, and a planned commit list for each phase.
- **One phase per session turn.** Each phase was started with an explicit prompt ("start phase 2"). Claude Code stated what it would change and which files before writing code, ran the checks, committed, and stopped for review. It never moved to the next phase on its own.
- **No pushing.** Claude Code commits locally only. Creating the GitHub repo and pushing are done by hand.

| Phase | What was built | Commits |
|---|---|---|
| 0. Setup | Next.js 16, Tailwind, shadcn/ui, Supabase CLI and client libraries | 4 |
| 1. Schema + RLS | 9 migrations: schemas, tables, helpers, policies, views, grants, generated types | 10 |
| 2. Seed data | `seed.sql` (3 businesses) and `scripts/seed-users.ts` (demo logins) | 2 |
| 3. RLS tests | 3 pgTAP files, 72 checks | 3 |
| 4. Dashboard | Auth proxy, login, layout, overview, businesses list, detail tabs | 7 |
| 5. Polish + docs | Seed fix, empty, loading and error states, README, this file, ARCHITECTURE.md | 5 |

## How the work was verified

Claude Code was asked to prove each step, not just report it.

- **Every migration:** `supabase db reset` rebuilt the database from scratch before the commit. A broken migration couldn't be committed.
- **Security, before the formal tests existed:** a smoke test ran inside a rolled-back transaction:
  - It impersonated a clinic staff user, an admin and `anon`.
  - It confirmed the cross-tenant foreign key rejects a bad link.
  - It confirmed the HTTP API refuses logged-out requests and doesn't expose `private`.
- **Seed data:** row counts per business were checked against the spec. That mattered because the seed joins on natural keys, so a typo would silently drop a row. Every AI-booked appointment was checked to link to its call.
- **End-to-end isolation:** before any UI existed, a script signed in through the real API as each demo user and compared row counts per table.
- **Proving the tests can fail:** after all 72 pgTAP checks passed, three deliberate breaks were applied to the running database:
  - a policy that lets everyone see every row
  - RLS switched off on `calls`
  - `security_invoker` removed from a view

  The tests caught all three (11 checks failed), then the database was rebuilt.
- **The UI in a real browser:** pages were driven with Playwright and checked by screenshot:
  - admin and staff views
  - filters and search
  - every tab
  - a phone-width layout
  - a 404
  - a simulated outage (the Supabase REST container stopped) to check the error state and its "Try again" recovery
- **Before every commit:** `npm run lint` and `npm run build`. Later phases also re-ran `supabase test db`.

## Problems caught and fixed along the way

These are recorded because they show where AI output needed correction.

| Problem | How it was caught | Fix |
|---|---|---|
| The `.env*` rule in `.gitignore` would also ignore `.env.example` | Reading the generated `.gitignore` | Added `!.env.example` |
| `shadcn init` added a Button component that wasn't asked for | Checking the files it created | Removed until needed |
| `supabase migration new` hung for two minutes | Command timeout | It reads SQL from stdin when not in a terminal. Run with `< /dev/null`. |
| pgTAP plan declared 32 tests, ran 33 | Test runner reported "bad plan" | Corrected the count. All 33 checks had passed. |
| A shell test helper returned empty counts | Results didn't make sense | Quoting bug in the helper, not the database. Rewrote the check with supabase-js. |
| Next 16 renamed `middleware.ts` to `proxy.ts` and `error.tsx`'s `reset` to `retry` | Reading the docs bundled in `node_modules/next/dist/docs` before writing code | Used the Next 16 names |
| `cacheComponents` flagged `Date.now()` during prerender | Browser console error after first sign-in | `await connection()` in the Supabase server client: every query is per user and per request |
| `usePathname()` in the nav blocked prerendering of dynamic routes | Next dev overlay | Wrapped the nav in `<Suspense>` with a static fallback |
| Overview table clipped its last column at 1280px | Screenshot review | Stacked the cards below 1536px and merged two columns |
| No navigation at all on phones | Phone-width screenshot | Icon-only nav in the header |
| A data outage blanked the whole app with Next's generic error page | Simulated outage test | The user menu lives in the layout, which the page's `error.tsx` can't catch. Made it degrade gracefully, using `unstable_rethrow` so sign-in redirects still work. |
| "Customer since" showed today for every business | Reviewing the detail page | Backdated `created_at` in the seed |

## Decisions that went beyond the spec (flagged at the time)

- **`service_role` grants.** CLAUDE.md says to grant only to `authenticated`, but the seed script runs as `service_role` and needs table access. It got read and write grants, documented in the migration. The app never uses it.
- **Extra overview columns.** `missed_calls_7d` and `ai_booked_pct` were added to `organization_overview` for the "AI receptionist impact" card PLAN.md suggests.
- **Clinic staff can sign in to the admin app.** This was kept for the isolation demo. ARCHITECTURE.md notes that production should use a separate customer app.
- **The commit plan was followed instead of a single "Phase 0" commit,** because CLAUDE.md requires Conventional Commits.

## Reviewer notes

_To be completed by hand. Record what you read, changed or questioned in Claude Code's output, for example:_

- [ ] Read every migration in `supabase/migrations/`, especially the RLS policies and composite foreign keys
- [ ] Ran the isolation demo myself
- [ ] Changes made by hand:
- [ ] Things I would do differently:
