import Link from "next/link";
import { cn } from "@/lib/utils";

export type FilterOption = { label: string; href: string; active: boolean };

// A row of link-based filters. State lives in the URL, so filters are
// shareable and work without client JavaScript.
export function FilterPills({ label, options }: { label: string; options: FilterOption[] }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-xs font-medium text-muted-foreground">{label}</span>
      {options.map((option) => (
        <Link
          key={option.label}
          href={option.href}
          scroll={false}
          aria-current={option.active ? "page" : undefined}
          className={cn(
            "rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground",
            option.active && "border-primary bg-primary/10 text-primary hover:border-primary hover:text-primary",
          )}
        >
          {option.label}
        </Link>
      ))}
    </div>
  );
}
