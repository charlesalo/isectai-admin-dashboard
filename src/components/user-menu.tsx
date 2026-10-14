import { unstable_rethrow } from "next/navigation";
import { LogOut } from "lucide-react";
import { signOut } from "@/app/(dashboard)/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCurrentUser, type CurrentUser } from "@/lib/auth";

// Shows who is signed in and what they can see. The role badge makes the
// isolation demo obvious: clinic staff see "Member" and only their business.
export async function UserMenu() {
  let user: CurrentUser;
  try {
    user = await getCurrentUser();
  } catch (error) {
    // Let Next.js redirects (signed out) through. For anything else, keep the
    // header usable: this lives in the layout, which the page's error.tsx
    // boundary can't catch, so throwing here would blank the whole app.
    unstable_rethrow(error);
    return (
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground">Account unavailable</span>
        <SignOutButton />
      </div>
    );
  }
  const scope = user.isPlatformAdmin
    ? "All businesses"
    : user.organizationNames.join(", ") || "No business access";

  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right sm:block">
        <p className="text-sm font-medium leading-tight">{user.email}</p>
        <p className="text-xs text-muted-foreground">{scope}</p>
      </div>
      <Badge variant={user.isPlatformAdmin ? "default" : "secondary"}>
        {user.isPlatformAdmin ? "Platform admin" : "Member"}
      </Badge>
      <SignOutButton />
    </div>
  );
}

function SignOutButton() {
  return (
    <form action={signOut}>
      <Button type="submit" variant="ghost" size="sm" aria-label="Sign out">
        <LogOut />
        <span className="hidden sm:inline">Sign out</span>
      </Button>
    </form>
  );
}
