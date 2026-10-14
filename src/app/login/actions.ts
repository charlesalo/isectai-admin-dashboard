"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error?: string; email?: string };

export async function signIn(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email and password.", email };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return {
      error:
        error.code === "invalid_credentials"
          ? "That email and password don't match an account."
          : "Couldn't sign in right now. Try again in a moment.",
      email,
    };
  }

  redirect("/");
}

const demoAccounts = {
  admin: "admin@isectai.test",
  staff: "staff@brightside.test",
} as const;

// One-click sign-in for reviewers. The password comes from a server-only
// environment variable, so it never reaches the browser. The demo users are
// ordinary accounts: RLS decides what each one sees, exactly as with a password.
export async function signInAsDemo(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const role = formData.get("role");
  const email = role === "admin" || role === "staff" ? demoAccounts[role] : undefined;
  const password = process.env.DEMO_USER_PASSWORD;

  if (!email || !password) {
    return { error: "Demo sign-in isn't available here. Use a password instead." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: "Couldn't start the demo. Try again in a moment." };
  }

  redirect("/");
}
