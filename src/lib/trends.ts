const DAY = 24 * 60 * 60 * 1000;

// Events per rolling 24-hour day for the last `days` days, oldest first.
// The newest bucket ends at `now`, matching the database views' `now() - interval '7 days'`.
export function dailyCounts(timestamps: string[], now: Date, days = 14) {
  const counts = Array<number>(days).fill(0);
  for (const timestamp of timestamps) {
    const age = Math.floor((now.getTime() - new Date(timestamp).getTime()) / DAY);
    if (age >= 0 && age < days) counts[days - 1 - age] += 1;
  }
  return counts;
}

// This week (last 7 days) against the 7 days before, plus 14 daily counts
// for a sparkline. `change` is a percentage, or null when last week was 0.
export function weekOverWeek(timestamps: string[], now: Date) {
  const daily = dailyCounts(timestamps, now, 14);
  const sum = (values: number[]) => values.reduce((total, n) => total + n, 0);
  const previous = sum(daily.slice(0, 7));
  const current = sum(daily.slice(7));
  const change = previous ? Math.round((100 * (current - previous)) / previous) : null;
  return { current, previous, change, daily };
}
