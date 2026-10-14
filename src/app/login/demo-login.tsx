"use client";

import { useActionState } from "react";
import { ArrowRight } from "lucide-react";
import { signInAsDemo, type LoginState } from "./actions";

const options = [
  {
    role: "admin",
    title: "Explore as iSectAI admin",
    description: "Every business on the platform. The view iSectAI staff get.",
  },
  {
    role: "staff",
    title: "Explore as Brightside staff",
    description: "One clinic's staff account. Sees only Brightside's data.",
  },
] as const;

export function DemoLogin() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(signInAsDemo, {});

  return (
    <form action={formAction} className="grid gap-3">
      {options.map((option) => (
        <button
          key={option.role}
          type="submit"
          name="role"
          value={option.role}
          disabled={pending}
          className="group flex items-center justify-between gap-3 rounded-lg border bg-muted/30 px-4 py-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-60"
        >
          <span>
            <span className="block text-sm font-medium">{option.title}</span>
            <span className="block text-xs text-muted-foreground">{option.description}</span>
          </span>
          <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
        </button>
      ))}
      {pending && <p className="text-xs text-muted-foreground">Signing in…</p>}
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
    </form>
  );
}
