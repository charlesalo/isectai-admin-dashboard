import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DemoLogin } from "./demo-login";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

// Demo buttons only appear where a demo password is configured on the server.
const demoEnabled = Boolean(process.env.DEMO_USER_PASSWORD);

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-[radial-gradient(60rem_28rem_at_50%_-8rem,color-mix(in_oklch,var(--primary)_14%,transparent),transparent)] px-4 py-16">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
            iS
          </span>
          <span className="text-lg font-semibold tracking-tight">iSectAI</span>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Admin dashboard</CardTitle>
            <CardDescription>
              {demoEnabled
                ? "Explore the demo with one click, or sign in with a password."
                : "Sign in with your iSectAI account."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {demoEnabled ? (
              <div className="grid grid-cols-1 gap-4">
                <DemoLogin />
                <details className="group rounded-lg border">
                  <summary className="flex cursor-pointer list-none items-center gap-1.5 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground [&::-webkit-details-marker]:hidden">
                    <ChevronRight className="size-4 transition-transform group-open:rotate-90" />
                    Use a password
                  </summary>
                  <div className="px-4 pt-1 pb-4">
                    <LoginForm />
                  </div>
                </details>
              </div>
            ) : (
              <LoginForm />
            )}
          </CardContent>
        </Card>
        <SiteFooter className="mt-6 text-center" />
      </div>
    </main>
  );
}
