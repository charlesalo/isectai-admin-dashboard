import { CalendarX } from "lucide-react";
import { BookedViaBadge, PriorityBadge, StatusBadge } from "@/components/badges";
import { EmptyState } from "@/components/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime, formatMoney, formatPhone, localDateKey } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type Organization = Database["core"]["Tables"]["organizations"]["Row"];
type AppointmentStatus = Database["medical"]["Enums"]["appointment_status"];
type JobStatus = Database["field_service"]["Enums"]["job_status"];

export const whenOptions = ["all", "today", "upcoming", "past"] as const;
export type When = (typeof whenOptions)[number];

export const appointmentStatuses: AppointmentStatus[] = [
  "scheduled",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
];
export const jobStatuses: JobStatus[] = ["new", "scheduled", "in_progress", "completed", "cancelled"];

const DAY_AND_A_HALF = 36 * 60 * 60 * 1000;

function NoResults({ label, filtered }: { label: string; filtered: boolean }) {
  return (
    <EmptyState
      icon={CalendarX}
      title={filtered ? `No ${label} match these filters` : `No ${label} yet`}
      description={filtered ? "Try a different status or date range." : undefined}
    />
  );
}

export async function AppointmentsTab({
  org,
  status,
  when,
}: {
  org: Organization;
  status?: AppointmentStatus;
  when: When;
}) {
  const supabase = await createClient();
  const now = new Date();

  let query = supabase
    .schema("medical")
    .from("appointments")
    .select(
      "id, scheduled_start, status, reason_for_visit, booked_via, patients(full_name, phone_e164), providers(full_name)",
    )
    .eq("organization_id", org.id);
  if (status) query = query.eq("status", status);
  if (when === "upcoming") query = query.gte("scheduled_start", now.toISOString());
  if (when === "past") query = query.lt("scheduled_start", now.toISOString());
  // "Today" is the clinic's local day: fetch a window around now, filter below.
  if (when === "today") {
    query = query
      .gte("scheduled_start", new Date(now.getTime() - DAY_AND_A_HALF).toISOString())
      .lt("scheduled_start", new Date(now.getTime() + DAY_AND_A_HALF).toISOString());
  }
  const ascending = when === "today" || when === "upcoming";
  const { data, error } = await query.order("scheduled_start", { ascending });
  if (error) throw error;

  const rows =
    when === "today"
      ? data.filter((a) => localDateKey(a.scheduled_start, org.timezone) === localDateKey(now, org.timezone))
      : data;

  if (rows.length === 0) {
    return <NoResults label="appointments" filtered={Boolean(status) || when !== "all"} />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="pl-4">When</TableHead>
          <TableHead>Patient</TableHead>
          <TableHead>Provider</TableHead>
          <TableHead>Reason</TableHead>
          <TableHead>Booked via</TableHead>
          <TableHead className="pr-4">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((a) => (
          <TableRow key={a.id}>
            <TableCell className="pl-4 whitespace-nowrap tabular-nums">
              {formatDateTime(a.scheduled_start, org.timezone)}
            </TableCell>
            <TableCell>
              <p className="font-medium">{a.patients?.full_name}</p>
              {a.patients && (
                <p className="text-xs text-muted-foreground">{formatPhone(a.patients.phone_e164)}</p>
              )}
            </TableCell>
            <TableCell>{a.providers?.full_name}</TableCell>
            <TableCell className="text-muted-foreground">{a.reason_for_visit ?? "—"}</TableCell>
            <TableCell>
              <BookedViaBadge bookedVia={a.booked_via} />
            </TableCell>
            <TableCell className="pr-4">
              <StatusBadge status={a.status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export async function JobsTab({ org, status, when }: { org: Organization; status?: JobStatus; when: When }) {
  const supabase = await createClient();
  const now = new Date();

  let query = supabase
    .schema("field_service")
    .from("jobs")
    .select(
      "id, service_type, description, priority, status, quoted_amount, booked_via, customers(full_name, phone_e164), job_visits(id, technician_name, scheduled_start, status)",
    )
    .eq("organization_id", org.id);
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw error;

  // A job's date comes from its visits, and a job can have several. The date
  // filter runs here rather than in SQL to keep the query simple; fine at
  // prototype scale, and something to move into a view later.
  const today = localDateKey(now, org.timezone);
  const matches = (start: string) =>
    when === "all" ||
    (when === "today" && localDateKey(start, org.timezone) === today) ||
    (when === "upcoming" && new Date(start) >= now) ||
    (when === "past" && new Date(start) < now);

  const rows = data
    .filter((job) => when === "all" || job.job_visits.some((v) => matches(v.scheduled_start)))
    .map((job) => {
      const visits = [...job.job_visits].sort((a, b) => a.scheduled_start.localeCompare(b.scheduled_start));
      // Show the next visit if there is one, otherwise the most recent.
      const visit = visits.find((v) => new Date(v.scheduled_start) >= now) ?? visits.at(-1);
      return { ...job, visit, visitCount: visits.length };
    })
    .sort((a, b) => {
      const order = (b.visit?.scheduled_start ?? "").localeCompare(a.visit?.scheduled_start ?? "");
      return when === "today" || when === "upcoming" ? -order : order;
    });

  if (rows.length === 0) {
    return <NoResults label="jobs" filtered={Boolean(status) || when !== "all"} />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="pl-4">Job</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Visit</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead className="text-right">Quote</TableHead>
          <TableHead>Booked via</TableHead>
          <TableHead className="pr-4">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((job) => (
          <TableRow key={job.id}>
            <TableCell className="max-w-xs pl-4">
              <p className="font-medium">{job.service_type}</p>
              {job.description && (
                <p className="truncate text-xs text-muted-foreground" title={job.description}>
                  {job.description}
                </p>
              )}
            </TableCell>
            <TableCell>
              <p>{job.customers?.full_name}</p>
              {job.customers && (
                <p className="text-xs text-muted-foreground">{formatPhone(job.customers.phone_e164)}</p>
              )}
            </TableCell>
            <TableCell className="whitespace-nowrap">
              {job.visit ? (
                <>
                  <p className="tabular-nums">{formatDateTime(job.visit.scheduled_start, org.timezone)}</p>
                  <p className="text-xs text-muted-foreground">
                    {job.visit.technician_name}
                    {job.visitCount > 1 && ` · ${job.visitCount} visits`}
                  </p>
                </>
              ) : (
                <span className="text-muted-foreground">Not scheduled</span>
              )}
            </TableCell>
            <TableCell>
              <PriorityBadge priority={job.priority} />
            </TableCell>
            <TableCell className="text-right tabular-nums">{formatMoney(job.quoted_amount)}</TableCell>
            <TableCell>
              <BookedViaBadge bookedVia={job.booked_via} />
            </TableCell>
            <TableCell className="pr-4">
              <StatusBadge status={job.status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
