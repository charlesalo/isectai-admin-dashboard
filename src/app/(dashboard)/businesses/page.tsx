import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Search, SearchX } from "lucide-react";
import { IndustryBadge, OrgStatusBadge } from "@/components/badges";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPercent } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Businesses" };

const industries = [
  { value: undefined, label: "All" },
  { value: "medical", label: "Medical" },
  { value: "field_service", label: "Field service" },
] as const;

type Industry = "medical" | "field_service";

export default function BusinessesPage({ searchParams }: PageProps<"/businesses">) {
  return (
    <>
      <PageHeader title="Businesses" description="Every business using the AI receptionist." />
      <Suspense fallback={<ListSkeleton />}>
        <BusinessList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function BusinessList({ searchParams }: Pick<PageProps<"/businesses">, "searchParams">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const industry: Industry | undefined =
    params.industry === "medical" || params.industry === "field_service" ? params.industry : undefined;

  const supabase = await createClient();
  let query = supabase.schema("core").from("organization_overview").select("*").order("name");
  if (industry) query = query.eq("industry", industry);
  // Escape LIKE wildcards so a search for "50%" matches literally.
  if (q) query = query.ilike("name", `%${q.replace(/[\\%_]/g, "\\$&")}%`);

  const { data: rows, error } = await query;
  if (error) throw error;

  const hrefFor = (next: { industry?: Industry; q?: string }) => {
    const search = new URLSearchParams();
    if (next.industry) search.set("industry", next.industry);
    if (next.q) search.set("q", next.q);
    const qs = search.toString();
    return qs ? `/businesses?${qs}` : "/businesses";
  };

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-lg border bg-muted/40 p-0.5">
          {industries.map((option) => (
            <Link
              key={option.label}
              href={hrefFor({ industry: option.value, q })}
              aria-current={industry === option.value ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground",
                industry === option.value && "bg-background font-medium text-foreground shadow-sm",
              )}
            >
              {option.label}
            </Link>
          ))}
        </div>
        <form action="/businesses" className="flex items-center gap-2">
          {industry && <input type="hidden" name="industry" value={industry} />}
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              defaultValue={q}
              placeholder="Search by name"
              aria-label="Search businesses by name"
              className="w-56 pl-8"
            />
          </div>
          <Button type="submit" variant="outline">
            Search
          </Button>
        </form>
      </div>

      <Card className="py-0">
        {rows.length === 0 ? (
          q || industry ? (
            <div className="pb-6">
              <EmptyState
                icon={SearchX}
                title="No businesses match these filters"
                description={q ? `Nothing matches "${q}".` : "Try another industry."}
              />
              <div className="text-center">
                <Link href="/businesses" className="text-sm font-medium text-primary hover:underline">
                  Clear filters
                </Link>
              </div>
            </div>
          ) : (
            <EmptyState title="No businesses yet" description="Businesses appear here once they're onboarded." />
          )
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Business</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Contacts</TableHead>
                <TableHead className="text-right">Calls (7d)</TableHead>
                <TableHead className="text-right">Upcoming (7d)</TableHead>
                <TableHead className="pr-4 text-right">AI-booked</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.organization_id}>
                  <TableCell className="pl-4">
                    <Link href={`/businesses/${row.slug}`} className="font-medium hover:underline">
                      {row.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {row.city}, {row.state}
                    </p>
                  </TableCell>
                  <TableCell>
                    <IndustryBadge industry={row.industry!} />
                  </TableCell>
                  <TableCell>
                    <OrgStatusBadge status={row.status!} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{row.contacts}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.calls_7d}
                    {Boolean(row.missed_calls_7d) && (
                      <p className="text-xs text-red-600">{row.missed_calls_7d} missed</p>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{row.upcoming_bookings_7d}</TableCell>
                  <TableCell className="pr-4 text-right font-medium tabular-nums">
                    {formatPercent(row.ai_booked_pct)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="grid gap-4">
      <div className="flex justify-between gap-3">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-9 w-72" />
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}
