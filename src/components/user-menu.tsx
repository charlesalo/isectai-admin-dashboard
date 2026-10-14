import { LogOut } from "lucide-react";
import { signOut } from "@/app/(dashboard)/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";

// Shows who is signed in and what they can see. The role badge makes the
// isolation demo obvious: clinic staff see "Member" and only their business.
export async function UserMenu() {
  const user = await getCurrentUser();
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
      <form action={signOut}>
        <Button type="submit" variant="ghost" size="sm" aria-label="Sign out">
          <LogOut />
          <span className="hidden sm:inline">Sign out</span>
        </Button>
      </form>
    </div>
  );
}
