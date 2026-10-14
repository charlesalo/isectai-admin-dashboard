import { ChevronRight, Activity } from "lucide-react";
import { SourceBadge } from "@/components/badges";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/types/database";

type Organization = Database["core"]["Tables"]["organizations"]["Row"];

const LIMIT = 50;

// n8n runs report status in the payload. Surface failures so they stand out.
function isError(payload: Json) {
  return typeof payload === "object" && payload !== null && !Array.isArray(payload) && payload.status === "error";
}

export async function ActivityTab({ org }: { org: Organization }) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("core")
    .from("integration_events")
    .select("id, source, event_type, payload, received_at")
    .eq("organization_id", org.id)
    .order("received_at", { ascending: false })
    .limit(LIMIT);
  if (error) throw error;

  if (data.length === 0) {
    return (
      <EmptyState
        icon={Activity}
        title="No integration events yet"
        description="Retell webhooks and n8n workflow runs for this business appear here."
      />
    );
  }

  return (
    <ul className="divide-y">
      {data.map((event) => (
        <li key={event.id}>
          {/* Native <details> gives an expandable row without client JavaScript. */}
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 text-sm hover:bg-muted/50 [&::-webkit-details-marker]:hidden">
              <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
              <span className="w-28 shrink-0 text-muted-foreground tabular-nums">
                {formatDateTime(event.received_at, org.timezone)}
              </span>
              <SourceBadge source={event.source} />
              <code className="truncate font-mono text-xs">{event.event_type}</code>
              {isError(event.payload) && (
                <Badge variant="destructive" className="ml-auto">
                  Error
                </Badge>
              )}
            </summary>
            <pre className="mx-4 mb-3 overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs leading-relaxed">
              {JSON.stringify(event.payload, null, 2)}
            </pre>
          </details>
        </li>
      ))}
    </ul>
  );
}
