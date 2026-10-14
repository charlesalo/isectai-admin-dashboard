import Link from "next/link";
import { PhoneIncoming, PhoneOff } from "lucide-react";
import { OutcomeBadge } from "@/components/badges";
import { EmptyState } from "@/components/empty-state";
import { formatPhone, formatRelative } from "@/lib/format";

export type LatestCall = {
  id: string;
  callerName: string | null;
  fromNumber: string;
  outcome: string;
  startedAt: string;
  business: { name: string; slug: string } | undefined;
};

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function LatestCalls({ calls, now }: { calls: LatestCall[]; now: Date }) {
  if (calls.length === 0) {
    return <EmptyState icon={PhoneOff} title="No calls yet" />;
  }

  return (
    <ul className="divide-y">
      {calls.map((call) => (
        <li key={call.id} className="flex items-center gap-3 px-4 py-2.5">
          <span
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground"
            aria-hidden
          >
            {call.callerName ? initials(call.callerName) : <PhoneIncoming className="size-3.5" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{call.callerName ?? "New caller"}</p>
            <p className="truncate text-xs text-muted-foreground">
              {call.business ? (
                <Link href={`/businesses/${call.business.slug}`} className="hover:underline">
                  {call.business.name}
                </Link>
              ) : (
                formatPhone(call.fromNumber)
              )}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <OutcomeBadge outcome={call.outcome} />
            <span className="text-xs text-muted-foreground tabular-nums">
              {formatRelative(call.startedAt, now)}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
