import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { Sparkline } from "@/components/sparkline";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Trend = {
  // Percentage change against last week, or null when last week had nothing to compare.
  change: number | null;
  daily: number[];
};

export function StatCard({
  label,
  value,
  detail,
  trend,
}: {
  label: string;
  value: React.ReactNode;
  detail?: React.ReactNode;
  trend?: Trend;
}) {
  return (
    <Card>
      <CardContent>
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="mt-1 flex items-end justify-between gap-3">
          <p className="text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
          {trend && <Sparkline values={trend.daily} className="mb-1 shrink-0" />}
        </div>
        {trend && (
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <TrendChip change={trend.change} />
            vs last week
          </p>
        )}
        {detail && <p className="mt-1 text-xs text-muted-foreground">{detail}</p>}
      </CardContent>
    </Card>
  );
}

function TrendChip({ change }: { change: number | null }) {
  if (change === null) {
    return <span className="rounded-md bg-muted px-1.5 py-0.5 font-medium text-muted-foreground">New</span>;
  }
  const Icon = change > 0 ? ArrowUp : change < 0 ? ArrowDown : Minus;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium tabular-nums",
        change > 0 && "bg-emerald-50 text-emerald-700",
        change < 0 && "bg-red-50 text-red-700",
        change === 0 && "bg-muted text-muted-foreground",
      )}
    >
      <Icon className="size-3" aria-hidden />
      {change > 0 ? "+" : ""}
      {change}%
    </span>
  );
}
