import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type CurrentUser = {
  id: string;
  email: string;
  isPlatformAdmin: boolean;
  organizationNames: string[];
};

// The signed-in user and what they can see. Wrapped in cache() so the layout
// and the page share one lookup per request. Both queries go through RLS:
// a user can read their own platform_admins row and their own memberships.
export const getCurrentUser = cache(async (): Promise<CurrentUser> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) redirect("/login");

  const [admin, memberships] = await Promise.all([
    supabase.schema("core").from("platform_admins").select("user_id").eq("user_id", claims.sub).maybeSingle(),
    supabase.schema("core").from("organization_members").select("organizations(name)").eq("user_id", claims.sub),
  ]);
  if (admin.error) throw admin.error;
  if (memberships.error) throw memberships.error;

  return {
    id: claims.sub,
    email: claims.email ?? "",
    isPlatformAdmin: Boolean(admin.data),
    organizationNames: memberships.data.flatMap((m) => (m.organizations ? [m.organizations.name] : [])),
  };
});
