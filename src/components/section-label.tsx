import { cn } from "@/lib/utils";

// Small uppercase heading that names a group of cards on a page.
export function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={cn("mb-3 text-xs font-medium tracking-wider text-muted-foreground uppercase", className)}>
      {children}
    </h2>
  );
}
