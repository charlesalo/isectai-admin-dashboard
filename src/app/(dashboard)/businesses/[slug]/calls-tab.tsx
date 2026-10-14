import { PhoneOff } from "lucide-react";
import { OutcomeBadge } from "@/components/badges";
import { EmptyState } from "@/components/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime, formatDuration, formatPhone } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type Organization = Database["core"]["Tables"]["organizations"]["Row"];

const LIMIT = 100;

export async function CallsTab({ org }: { org: Organization }) {
  const supabase = await createClient();
  const contacts =
    org.industry === "medical"
      ? supabase.schema("medical").from("patients").select("full_name, phone_e164").eq("organization_id", org.id)
      : supabase
          .schema("field_service")
          .from("customers")
          .select("full_name, phone_e164")
          .eq("organization_id", org.id);

  const [calls, people] = await Promise.all([
    supabase
      .schema("core")
      .from("calls")
      .select("id, started_at, from_number, duration_seconds, outcome, summary")
      .eq("organization_id", org.id)
      .order("started_at", { ascending: false })
      .limit(LIMIT),
    contacts,
  ]);
  if (calls.error) throw calls.error;
  if (people.error) throw people.error;

  // Match callers to known patients or customers by phone number, the same
  // way the AI receptionist recognizes them.
  const nameByPhone = new Map(people.data.map((p) => [p.phone_e164, p.full_name]));

  if (calls.data.length === 0) {
    return <EmptyState icon={PhoneOff} title="No calls yet" description="Calls handled by the AI receptionist appear here." />;
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">When</TableHead>
            <TableHead>Caller</TableHead>
            <TableHead className="text-right">Duration</TableHead>
            <TableHead>Outcome</TableHead>
            <TableHead className="pr-4">Summary</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {calls.data.map((call) => (
            <TableRow key={call.id}>
              <TableCell className="pl-4 whitespace-nowrap tabular-nums">
                {formatDateTime(call.started_at, org.timezone)}
              </TableCell>
              <TableCell>
                <p className="font-medium">{nameByPhone.get(call.from_number) ?? "New caller"}</p>
                <p className="text-xs text-muted-foreground tabular-nums">{formatPhone(call.from_number)}</p>
              </TableCell>
              <TableCell className="text-right tabular-nums">{formatDuration(call.duration_seconds)}</TableCell>
              <TableCell>
                <OutcomeBadge outcome={call.outcome} />
              </TableCell>
              <TableCell className="max-w-md pr-4 whitespace-normal text-muted-foreground">
                {call.summary ?? "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {calls.data.length === LIMIT && (
        <p className="border-t px-4 py-3 text-xs text-muted-foreground">Showing the latest {LIMIT} calls.</p>
      )}
    </>
  );
}
