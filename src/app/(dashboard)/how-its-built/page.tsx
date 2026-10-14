import type { Metadata } from "next";
import { ArrowDown } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "How it's built" };

const REPO_URL = "https://github.com/charlesalo/isectai-admin-dashboard";

// The path a request takes. The last two steps are where isolation is enforced.
const requestPath = [
  { title: "Browser", path: "src/app", body: "Holds a session cookie only. No key that can bypass security." },
  { title: "Proxy", path: "src/proxy.ts", body: "Refreshes the session and sends signed-out visitors to sign in." },
  { title: "Server Components", path: "src/app/(dashboard)", body: "Fetch data on the server with the user's own session." },
  { title: "Supabase API", path: "src/lib/supabase", body: "Publishable key plus the user's JWT. Same queries for every user." },
  { title: "Row-level security", path: "migrations", body: "is_platform_admin() or a member of the row's organization.", enforced: true },
  { title: "Postgres", path: "core · medical · field_service", body: "Composite keys stop records linking across businesses.", enforced: true },
];

const isolationLayers = [
  {
    title: "Every row belongs to a business",
    body: "Every tenant table has organization_id, not null, referencing core.organizations.",
  },
  {
    title: "Row-level security on every table",
    body: "One read policy per table: platform admins see everything, members see their own organizations. The helper functions are security definer with an empty search path, and run once per query.",
  },
  {
    title: "Records can't link across businesses",
    body: "Child tables use composite foreign keys such as (organization_id, patient_id). An appointment in one clinic can't point at another clinic's patient, even for code that bypasses RLS.",
  },
  {
    title: "Views respect the caller",
    body: "The cross-industry views are security_invoker, so they run with the signed-in user's permissions and the tables' policies still apply.",
  },
  {
    title: "Least privilege on the API",
    body: "Signed-in users can only read. Signed-out requests get nothing. The private schema with the helper functions isn't exposed at all.",
  },
];

const roles = [
  { label: "Stored in", admin: "core.platform_admins", member: "core.organization_members" },
  { label: "Checked by", admin: "is_platform_admin()", member: "user_org_ids()" },
  { label: "Sees", admin: "Every business", member: "Their own business" },
  { label: "Writes", admin: "None (read-only)", member: "None (read-only)" },
];

const tests = [
  { count: 31, file: "01_staff_isolation", body: "Clinic staff see exactly their own rows in every table and view, and can't write." },
  { count: 33, file: "02_admin_and_anon", body: "Admins see everything, signed-out requests are denied, and guards catch a missing RLS or view setting." },
  { count: 8, file: "03_cross_tenant_keys", body: "Inserts that link to another business's records fail." },
];

const schemas = [
  { name: "core", tables: "organizations, organization_members, platform_admins, calls, integration_events" },
  { name: "medical", tables: "providers, patients, appointments" },
  { name: "field_service", tables: "customers, jobs, job_visits" },
  { name: "private", tables: "RLS helper functions. Never exposed through the API." },
];

const stack = [
  "Next.js 16 App Router",
  "TypeScript",
  "Tailwind + shadcn/ui",
  "Supabase Postgres + Auth",
  "Row-level security",
  "pgTAP tests",
  "Vercel",
];

export default function HowItsBuiltPage() {
  return (
    <>
      <PageHeader title="How it's built" description="How the data is organized and how each business stays separate." />

      <div className="grid grid-cols-1 gap-6">
        <div className="max-w-3xl space-y-3">
          <p className="text-base leading-relaxed">
            One database serves medical clinics and service businesses. Shared data lives in a{" "}
            <code className="font-mono text-sm">core</code> schema, and each industry keeps its records in its own
            schema. Every page reads data as the signed-in user, so the database itself decides what each person can
            see.
          </p>
          <p className="text-sm text-muted-foreground">
            The app has no &ldquo;if admin&rdquo; filtering. An iSectAI admin and a clinic&apos;s staff run the same
            queries and get different rows. Sign in as Brightside staff to see it: every number drops to one clinic,
            and other businesses&apos; pages return &ldquo;not found&rdquo;.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Request path</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="grid grid-cols-1 gap-1">
                {requestPath.map((step, i) => (
                  <li key={step.title} className="grid grid-cols-1 gap-1">
                    <div
                      className={cn(
                        "rounded-lg border bg-muted/30 px-4 py-3",
                        step.enforced && "border-primary/30 bg-primary/5",
                      )}
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="text-sm font-medium">{step.title}</span>
                        <code className="font-mono text-xs text-muted-foreground">{step.path}</code>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{step.body}</p>
                    </div>
                    {i < requestPath.length - 1 && (
                      <ArrowDown className="mx-auto size-4 text-muted-foreground" aria-hidden />
                    )}
                  </li>
                ))}
              </ol>
              <p className="mt-4 text-xs text-muted-foreground">
                Highlighted steps are where isolation is enforced. The service role key, which bypasses RLS, is used
                only by the local seed script, never by the app.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How businesses stay separate</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y">
                {isolationLayers.map((layer) => (
                  <li key={layer.title} className="py-3 first:pt-0 last:pb-0">
                    <p className="text-sm font-medium">{layer.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{layer.body}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Two kinds of users</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="pb-2 font-medium" />
                    <th className="pb-2 font-medium">iSectAI admin</th>
                    <th className="pb-2 font-medium">Clinic staff</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {roles.map((row) => (
                    <tr key={row.label}>
                      <td className="py-2 pr-3 text-muted-foreground">{row.label}</td>
                      <td className="py-2 pr-3 font-mono text-xs">{row.admin}</td>
                      <td className="py-2 font-mono text-xs">{row.member}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-4 text-xs text-muted-foreground">
                In production: an admin claim in the JWT, MFA for admins, and a separate customer app.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Proven by tests</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid grid-cols-1 gap-3">
                {tests.map((test) => (
                  <li key={test.file} className="flex gap-3">
                    <span className="w-8 shrink-0 text-right text-lg font-semibold tabular-nums">{test.count}</span>
                    <div>
                      <code className="font-mono text-xs">{test.file}.test.sql</code>
                      <p className="text-sm text-muted-foreground">{test.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-muted-foreground">
                72 pgTAP checks run with <code className="font-mono">supabase test db</code>. To prove they can
                fail, a leaky policy, RLS switched off and an unsafe view were applied on purpose; the tests caught
                all three.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Schemas</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-3">
                {schemas.map((schema) => (
                  <div key={schema.name} className="grid grid-cols-1 gap-1 sm:grid-cols-[8rem_1fr] sm:gap-3">
                    <dt>
                      <code className="font-mono text-sm font-medium">{schema.name}</code>
                    </dt>
                    <dd className="text-sm text-muted-foreground">{schema.tables}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 text-xs text-muted-foreground">
                Adding an industry means a new schema with the same policies, plus one branch in each
                cross-industry view.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Stack</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {stack.map((item) => (
                  <span key={item} className="rounded-full border px-2.5 py-1 text-xs">
                    {item}
                  </span>
                ))}
              </div>
              <a
                href={`${REPO_URL}/blob/main/ARCHITECTURE.md`}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
              >
                Read the full architecture notes
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
