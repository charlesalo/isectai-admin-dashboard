"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, LayoutDashboard, Network } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/businesses", label: "Businesses", icon: Building2 },
  { href: "/how-its-built", label: "How it's built", icon: Network },
];

// Reads the URL to highlight the active link, so it renders behind a
// <Suspense> boundary with NavLinks (no highlight) as the fallback.
type NavProps = { className?: string; compact?: boolean };

export function MainNav(props: NavProps) {
  return <NavLinks {...props} pathname={usePathname()} />;
}

// compact: icon only on phones, for the header nav.
export function NavLinks({ className, compact, pathname }: NavProps & { pathname?: string }) {
  return (
    <nav className={cn("flex gap-1", className)}>
      {links.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : Boolean(pathname?.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            aria-label={label}
            className={cn(
              "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              active && "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary",
            )}
          >
            <Icon className="size-4" />
            <span className={cn(compact && "hidden sm:inline")}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
