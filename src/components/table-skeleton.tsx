import { Skeleton } from "@/components/ui/skeleton";

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="grid gap-2 p-4">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-10" />
      ))}
    </div>
  );
}
