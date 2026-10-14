import { Users } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatPhone } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type Organization = Database["core"]["Tables"]["organizations"]["Row"];

export async function PatientsTab({ org }: { org: Organization }) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("medical")
    .from("patients")
    .select("id, full_name, phone_e164, date_of_birth, appointments(count)")
    .eq("organization_id", org.id)
    .order("full_name");
  if (error) throw error;

  if (data.length === 0) {
    return <EmptyState icon={Users} title="No patients yet" />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="pl-4">Name</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Date of birth</TableHead>
          <TableHead className="pr-4 text-right">Appointments</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((patient) => (
          <TableRow key={patient.id}>
            <TableCell className="pl-4 font-medium">{patient.full_name}</TableCell>
            <TableCell className="tabular-nums">{formatPhone(patient.phone_e164)}</TableCell>
            <TableCell className="tabular-nums">
              {patient.date_of_birth ? formatDate(patient.date_of_birth) : "—"}
            </TableCell>
            <TableCell className="pr-4 text-right tabular-nums">{patient.appointments[0]?.count ?? 0}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export async function CustomersTab({ org }: { org: Organization }) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("field_service")
    .from("customers")
    .select("id, full_name, phone_e164, service_address, jobs(count)")
    .eq("organization_id", org.id)
    .order("full_name");
  if (error) throw error;

  if (data.length === 0) {
    return <EmptyState icon={Users} title="No customers yet" />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="pl-4">Name</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Service address</TableHead>
          <TableHead className="pr-4 text-right">Jobs</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((customer) => (
          <TableRow key={customer.id}>
            <TableCell className="pl-4 font-medium">{customer.full_name}</TableCell>
            <TableCell className="tabular-nums">{formatPhone(customer.phone_e164)}</TableCell>
            <TableCell className="text-muted-foreground">{customer.service_address ?? "—"}</TableCell>
            <TableCell className="pr-4 text-right tabular-nums">{customer.jobs[0]?.count ?? 0}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
