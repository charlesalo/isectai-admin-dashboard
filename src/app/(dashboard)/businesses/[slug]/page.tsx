import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { IndustryBadge, OrgStatusBadge } from "@/components/badges";
import { FilterPills } from "@/components/filter-pills";
import { StatCard } from "@/components/stat-card";
import { TableSkeleton } from "@/components/table-skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatPercent, formatPhone } from "@/lib/format";
import { industryLabels } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import {
  AppointmentsTab,
  JobsTab,
  appointmentStatuses,
  jobStatuses,
  whenOptions,
  type When,
} from "./bookings-tab";
import { CustomersTab, PatientsTab } from "./contacts-tab";

export const metadata: Metadata = { title: "Business" };

const tabs = ["bookings", "contacts"] as const;
type Tab = (typeof tabs)[number];

const whenLabels: Record<When, string> = { all: "All", today: "Today", upcoming: "Upcoming", past: "Past" };

export default function BusinessPage({ params, searchParams }: PageProps<"/businesses/[slug]">) {
  return (
    <>
      <Link
        href="/businesses"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Businesses
      </Link>
      <Suspense fallback={<DetailSkeleton />}>
        <BusinessDetail params={params} searchParams={searchParams} />
      </Suspense>
    </>
  );
}

function pick<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  return allowed.find((option) => option === value);
}

async function BusinessDetail({ params, searchParams }: PageProps<"/businesses/[slug]">) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const supabase = await createClient();

  // Both reads go through RLS. A business the user can't see comes back as
  // null, so it renders the same "not found" page as a slug that doesn't exist.
  const [orgResult, overviewResult] = await Promise.all([
    supabase.schema("core").from("organizations").select("*").eq("slug", slug).maybeSingle(),
    supabase.schema("core").from("organization_overview").select("*").eq("slug", slug).maybeSingle(),
  ]);
  if (orgResult.error) throw orgResult.error;
  if (overviewResult.error) throw overviewResult.error;
  const org = orgResult.data;
  if (!org) notFound();
  const overview = overviewResult.data;

  const labels = industryLabels(org.industry);
  const isMedical = org.industry === "medical";
  const tab: Tab = pick(query.tab, tabs) ?? "bookings";
  const when: When = pick(query.when, whenOptions) ?? "all";
  const statuses: readonly string[] = isMedical ? appointmentStatuses : jobStatuses;
  const status = pick(query.status, statuses);

  const hrefFor = (next: { tab?: Tab; status?: string; when?: When }) => {
    const search = new URLSearchParams();
    if (next.tab && next.tab !== "bookings") search.set("tab", next.tab);
    if (next.status) search.set("status", next.status);
    if (next.when && next.when !== "all") search.set("when", next.when);
    const qs = search.toString();
    return qs ? `/businesses/${slug}?${qs}` : `/businesses/${slug}`;
  };

  const tabLabels: Record<Tab, string> = { bookings: labels.bookings, contacts: labels.contacts };

  return (
    <div className="grid gap-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{org.name}</h1>
          <IndustryBadge industry={org.industry} />
          <OrgStatusBadge status={org.status} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {[org.city, org.state].filter(Boolean).join(", ")}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="lg:col-span-1">
          <CardContent>
            <dl className="grid gap-3 text-sm">
              <InfoRow label="Phone">{org.phone_e164 ? formatPhone(org.phone_e164) : "—"}</InfoRow>
              <InfoRow label="Address">
                {org.address ? `${org.address}, ${org.city}, ${org.state}` : "—"}
              </InfoRow>
              <InfoRow label="Time zone">{org.timezone}</InfoRow>
              <InfoRow label="Plan">
                <span className="capitalize">{org.plan}</span>
              </InfoRow>
              <InfoRow label="Customer since">{formatDate(org.created_at)}</InfoRow>
            </dl>
          </CardContent>
        </Card>
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-3">
          <StatCard label={labels.contacts} value={overview?.contacts ?? 0} />
          <StatCard
            label={`Upcoming ${labels.bookings.toLowerCase()}`}
            value={overview?.upcoming_bookings_7d ?? 0}
            detail="Next 7 days, excluding cancelled"
          />
          <StatCard
            label="Calls this week"
            value={overview?.calls_7d ?? 0}
            detail={`${overview?.missed_calls_7d ?? 0} missed`}
          />
          <StatCard
            label="Booked by AI receptionist"
            value={formatPercent(overview?.ai_booked_pct ?? null)}
            detail={`${overview?.ai_bookings ?? 0} of ${overview?.total_bookings ?? 0} bookings`}
          />
        </div>
      </div>

      <div>
        <nav className="mb-4 flex gap-1 border-b" aria-label="Business sections">
          {tabs.map((t) => (
            <Link
              key={t}
              href={hrefFor({ tab: t })}
              scroll={false}
              aria-current={tab === t ? "page" : undefined}
              className={cn(
                "-mb-px border-b-2 border-transparent px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                tab === t && "border-primary text-foreground",
              )}
            >
              {tabLabels[t]}
            </Link>
          ))}
        </nav>

        <Card className="gap-0 py-0">
          {tab === "bookings" && (
            <div className="grid gap-2 border-b px-4 py-3">
              <FilterPills
                label="Status"
                options={[undefined, ...statuses].map((s) => ({
                  label: s ? s.charAt(0).toUpperCase() + s.slice(1).replaceAll("_", " ") : "All",
                  href: hrefFor({ status: s, when }),
                  active: status === s,
                }))}
              />
              <FilterPills
                label="Date"
                options={whenOptions.map((w) => ({
                  label: whenLabels[w],
                  href: hrefFor({ status, when: w }),
                  active: when === w,
                }))}
              />
            </div>
          )}
          {/* Keyed so switching tabs or filters shows a skeleton for the table only. */}
          <Suspense key={`${tab}-${status}-${when}`} fallback={<TableSkeleton />}>
            {tab === "bookings" &&
              (isMedical ? (
                <AppointmentsTab
                  org={org}
                  status={pick(status, appointmentStatuses)}
                  when={when}
                />
              ) : (
                <JobsTab org={org} status={pick(status, jobStatuses)} when={when} />
              ))}
            {tab === "contacts" && (isMedical ? <PatientsTab org={org} /> : <CustomersTab org={org} />)}
          </Suspense>
        </Card>
      </div>
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="grid gap-6">
      <Skeleton className="h-12 w-80" />
      <div className="grid gap-4 lg:grid-cols-4">
        <Skeleton className="h-64 rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-3">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
      <Skeleton className="h-80 rounded-xl" />
    </div>
  );
}
