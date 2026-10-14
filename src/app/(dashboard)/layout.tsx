import { Suspense } from "react";
import Link from "next/link";
import { MainNav, NavLinks } from "@/components/main-nav";
import { UserMenu } from "@/components/user-menu";
import { Skeleton } from "@/components/ui/skeleton";

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <span className="flex size-7 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
        iS
      </span>
      <span className="font-semibold tracking-tight">iSectAI</span>
      <span className="text-xs text-muted-foreground">Admin</span>
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
          <div className="flex items-center gap-4 md:hidden">
            <Brand />
          </div>
          <Suspense fallback={<NavLinks className="hidden sm:flex md:hidden" />}>
            <MainNav className="hidden sm:flex md:hidden" />
          </Suspense>
          <div className="ml-auto">
            {/* Reads the session, so it streams in behind its own boundary. */}
            <Suspense fallback={<Skeleton className="h-8 w-56" />}>
              <UserMenu />
            </Suspense>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
