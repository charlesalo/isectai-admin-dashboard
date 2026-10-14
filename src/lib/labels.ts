// Labels follow organizations.industry: clinics have patients and
// appointments, service businesses have customers and jobs.
export function industryLabels(industry: string) {
  return industry === "medical"
    ? { contacts: "Patients", contact: "Patient", bookings: "Appointments", staff: "Provider" }
    : { contacts: "Customers", contact: "Customer", bookings: "Jobs", staff: "Technician" };
}
