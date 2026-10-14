"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-24 text-center">
      <TriangleAlert className="size-8 text-destructive" />
      <h2 className="text-lg font-semibold">Couldn&apos;t load this page</h2>
      <p className="text-sm text-muted-foreground">
        Something went wrong while fetching data. Check that Supabase is running, then try again.
      </p>
      <Button variant="outline" onClick={() => retry()}>
        Try again
      </Button>
    </div>
  );
}
