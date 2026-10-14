import { cn } from "@/lib/utils";

export function SiteFooter({ className }: { className?: string }) {
  return (
    <footer className={cn("text-xs text-muted-foreground", className)}>
      <p>
        Built by <span className="font-medium text-foreground">Charles Alo</span> · Next.js · Supabase · Vercel
      </p>
      <p className="mt-1">Every business, person and call in this demo is fictional.</p>
    </footer>
  );
}
