import { Suspense } from "react";
import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { BookedViaBadge, IndustryBadge, StatusBadge } from "@/components/badges";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPercent, formatTime, localDateKey } from "@/lib/format";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default function OverviewPage() {
  return (
    <>
      <PageHeader title="Overview" description="Activity across the businesses you can access." />
      <Suspense fallback={<OverviewSkeleton />}>
        <Overview />
      </Suspense>
    </>
  );
}

async function Overview() {
  const supabase = await createClient();
  const user = await getCurrentUser();
  const now = new Date();
  const day = 24 * 60 * 60 * 1000;

  // Each business has its own "today", so fetch a window around now and
  // filter by local date below.
  const [overview, organizations, bookings] = await Promise.all([
    supabase.schema("core").from("organization_overview").select("*").order("name"),
    supabase.schema("core").from("organizations").select("id, name, slug, industry, timezone"),
    supabase
      .schema("core")
      .from("bookings")
      .select("*")
      .gte("scheduled_start", new Date(now.getTime() - day).toISOString())
      .lt("scheduled_start", new Date(now.getTime() + day).toISOString())
      .order("scheduled_start"),
  ]);
  if (overview.error) throw overview.error;
  if (organizations.error) throw organizations.error;
  if (bookings.error) throw bookings.error;

  const rows = overview.data;
  const orgById = new Map(organizations.data.map((org) => [org.id, org]));
  const sum = (pick: (row: (typeof rows)[number]) => number | null) =>
    rows.reduce((total, row) => total + (pick(row) ?? 0), 0);

  const calls = sum((r) => r.calls_7d);
  const missed = sum((r) => r.missed_calls_7d);
  const totalBookings = sum((r) => r.total_bookings);
  const aiBookings = sum((r) => r.ai_bookings);
  const aiShare = totalBookings ? (100 * aiBookings) / totalBookings : null;
  const active = rows.filter((r) => r.status === "active").length;

  const today = bookings.data.flatMap((booking) => {
    const org = orgById.get(booking.organization_id!);
    if (!org || localDateKey(booking.scheduled_start!, org.timezone) !== localDateKey(now, org.timezone)) {
      return [];
    }
    return [{ ...booking, org }];
  });

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Businesses"
          value={rows.length}
          detail={`${active} active, ${rows.length - active} onboarding or paused`}
        />
        <StatCard label="Calls this week" value={calls} detail={`${missed} missed in the last 7 days`} />
        <StatCard
          label="Upcoming bookings"
          value={sum((r) => r.upcoming_bookings_7d)}
          detail="Next 7 days, excluding cancelled"
        />
        <StatCard
          label="Booked by AI receptionist"
          value={formatPercent(aiShare)}
          detail={`${aiBookings} of ${totalBookings} bookings`}
        />
      </div>

      <div className="grid gap-6 2xl:grid-cols-3">
        <Card className="2xl:col-span-2">
          <CardHeader>
            <CardTitle>{user.isPlatformAdmin ? "Today across all businesses" : "Today"}</CardTitle>
            <CardDescription>
              {user.isPlatformAdmin
                ? "Appointments and job visits, in each business's local time."
                : "Your bookings for today, in local time."}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            {today.length === 0 ? (
              <EmptyState
                icon={CalendarClock}
                title="Nothing booked today"
                description="Bookings for today will show up here as they come in."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Time</TableHead>
                    <TableHead>Business</TableHead>
                    <TableHead>Booking</TableHead>
                    <TableHead className="pr-4">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {today.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="pl-4 whitespace-nowrap tabular-nums">
                        {formatTime(booking.scheduled_start!, booking.org.timezone)}
                      </TableCell>
                      <TableCell>
                        <Link href={`/businesses/${booking.org.slug}`} className="font-medium hover:underline">
                          {booking.org.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <p>{booking.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {booking.contact_name} · {booking.assigned_to}
                        </p>
                      </TableCell>
                      <TableCell className="pr-4">
                        <div className="flex flex-wrap gap-1.5">
                          <StatusBadge status={booking.status!} />
                          <BookedViaBadge bookedVia={booking.booked_via!} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI receptionist impact</CardTitle>
            <CardDescription>Share of bookings made by AI calls, and missed calls this week.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-3 md:gap-8 2xl:grid-cols-1 2xl:gap-5">
            {rows.length === 0 && <EmptyState title="No businesses yet" />}
            {rows.map((row) => (
              <div key={row.organization_id} className="grid gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Link href={`/businesses/${row.slug}`} className="truncate text-sm font-medium hover:underline">
                    {row.name}
                  </Link>
                  <IndustryBadge industry={row.industry!} />
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${row.ai_booked_pct ?? 0}%` }} />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatPercent(row.ai_booked_pct)} booked by AI</span>
                  <span className={row.missed_calls_7d ? "text-red-600" : undefined}>
                    {row.missed_calls_7d ?? 0} missed calls
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 2xl:grid-cols-3">
        <Skeleton className="h-96 rounded-xl 2xl:col-span-2" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    </div>
  );
}
