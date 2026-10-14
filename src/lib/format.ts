// Formatting helpers. Times are always shown in the business's own time zone,
// because "9:00 AM" only means something relative to where the clinic is.

export function formatTime(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(iso));
}

export function formatDateTime(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

// For date-only values like date_of_birth ("1985-03-14"), which have no time zone.
export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(
    new Date(`${value.slice(0, 10)}T00:00:00Z`),
  );
}

// "2026-10-14" for the given instant in the given time zone. Used to check
// whether a booking falls on a business's local "today".
export function localDateKey(date: Date | string, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date(date));
}

export function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return minutes ? `${minutes}m ${rest.toString().padStart(2, "0")}s` : `${rest}s`;
}

export function formatPercent(value: number | null) {
  return value === null ? "—" : `${Math.round(value)}%`;
}

export function formatPhone(e164: string) {
  const match = e164.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  return match ? `(${match[1]}) ${match[2]}-${match[3]}` : e164;
}

export function formatMoney(amount: number | null) {
  return amount === null
    ? "—"
    : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}
