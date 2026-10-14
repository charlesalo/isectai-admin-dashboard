import { PhoneOff } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

// How AI receptionist calls ended, in the order a caller would hope for.
// Colors match the outcome badges used in the calls table.
const outcomes = [
  { value: "booked", label: "Booked", bar: "bg-emerald-500" },
  { value: "answered_question", label: "Answered a question", bar: "bg-sky-500" },
  { value: "transferred", label: "Transferred", bar: "bg-indigo-500" },
  { value: "voicemail", label: "Voicemail", bar: "bg-amber-500" },
  { value: "missed", label: "Missed", bar: "bg-red-500" },
] as const;

export function CallOutcomes({ calls }: { calls: { outcome: string }[] }) {
  if (calls.length === 0) {
    return <EmptyState icon={PhoneOff} title="No calls in this period" />;
  }

  const total = calls.length;
  const count = (value: string) => calls.filter((call) => call.outcome === value).length;

  return (
    <ul className="grid grid-cols-1 gap-3.5">
      {outcomes.map((outcome) => {
        const n = count(outcome.value);
        const pct = Math.round((100 * n) / total);
        return (
          <li key={outcome.value} className="grid grid-cols-1 gap-1.5">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span>{outcome.label}</span>
              <span className="tabular-nums">
                <span className="font-medium">{n}</span>
                <span className="ml-2 inline-block w-10 text-right text-xs text-muted-foreground">{pct}%</span>
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className={`h-full rounded-full ${outcome.bar}`} style={{ width: `${pct}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
