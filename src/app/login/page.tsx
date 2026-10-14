import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-muted/40 px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
            iS
          </span>
          <span className="text-lg font-semibold tracking-tight">iSectAI</span>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Admin dashboard</CardTitle>
            <CardDescription>Sign in with your iSectAI account.</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Internal tool. Access is limited to iSectAI staff and the businesses they manage.
        </p>
      </div>
    </main>
  );
}
