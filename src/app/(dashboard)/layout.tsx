import { Suspense } from "react";
import Link from "next/link";
import { MainNav, NavLinks } from "@/components/main-nav";
import { SiteFooter } from "@/components/site-footer";
import { UserMenu } from "@/components/user-menu";
import { Skeleton } from "@/components/ui/skeleton";

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <span className="flex size-7 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
        iS
      </span>
      {/* Icon only on phones so the header nav fits. */}
      <span className="hidden font-semibold tracking-tight sm:inline">iSectAI</span>
      <span className="hidden text-xs text-muted-foreground sm:inline">Admin</span>
    </Link>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1">
      <aside className="hidden w-56 shrink-0 flex-col gap-6 border-r bg-sidebar px-3 py-4 md:flex">
        <div className="px-2.5">
          <Brand />
        </div>
        <Suspense fallback={<NavLinks className="flex-col" />}>
          <MainNav className="flex-col" />
        </Suspense>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between gap-4 border-b px-4 md:px-8">
          {/* Below md the sidebar is hidden, so the nav moves into the header. */}
          <div className="flex items-center gap-3 md:hidden">
            <Brand />
            <Suspense fallback={<NavLinks compact />}>
              <MainNav compact />
            </Suspense>
          </div>
          <div className="ml-auto">
            {/* Reads the session, so it streams in behind its own boundary. */}
            <Suspense fallback={<Skeleton className="h-8 w-28 sm:w-56" />}>
              <UserMenu />
            </Suspense>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
        <SiteFooter className="mx-4 border-t py-5 md:mx-8" />
      </div>
    </div>
  );
}
