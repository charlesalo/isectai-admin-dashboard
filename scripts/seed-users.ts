// Creates the demo auth users and links them to the seeded data.
// Run after `supabase db reset` (which wipes auth users): npm run seed:users
//
// This is the only place the service role key is used. It bypasses RLS, so it
// must never be imported by app code.

import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/types/database";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.DEMO_USER_PASSWORD;

if (!url || !serviceRoleKey || !password) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY or DEMO_USER_PASSWORD in .env.local",
  );
  process.exit(1);
}

const supabase = createClient<Database>(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Creates the user, or reuses it (and resets its password) if it already exists.
async function upsertUser(email: string): Promise<string> {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (!error) return data.user.id;
  if (error.code !== "email_exists") throw error;

  const { data: list, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) throw listError;
  const existing = list.users.find((user) => user.email === email);
  if (!existing) throw new Error(`User ${email} exists but was not found`);

  const { error: updateError } = await supabase.auth.admin.updateUserById(existing.id, { password });
  if (updateError) throw updateError;
  return existing.id;
}

async function main() {
  // Platform admin: internal iSectAI staff, sees every business.
  const adminId = await upsertUser("admin@isectai.test");
  const { error: adminError } = await supabase
    .schema("core")
    .from("platform_admins")
    .upsert({ user_id: adminId });
  if (adminError) throw adminError;
  console.log("admin@isectai.test: platform admin");

  // Clinic staff: member of Brightside only. Used to prove tenant isolation.
  const staffId = await upsertUser("staff@brightside.test");
  const { data: brightside, error: orgError } = await supabase
    .schema("core")
    .from("organizations")
    .select("id")
    .eq("slug", "brightside-family-clinic")
    .single();
  if (orgError) throw new Error("Brightside not found. Run `supabase db reset` first.");

  const { error: memberError } = await supabase
    .schema("core")
    .from("organization_members")
    .upsert({ organization_id: brightside.id, user_id: staffId, role: "staff" });
  if (memberError) throw memberError;
  console.log("staff@brightside.test: staff at Brightside Family Clinic");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
