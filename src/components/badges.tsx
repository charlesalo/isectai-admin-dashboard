import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Status colors used everywhere, so a color means the same thing on every page.
const tones = {
  green: "border-emerald-200 bg-emerald-50 text-emerald-700",
  blue: "border-sky-200 bg-sky-50 text-sky-700",
  indigo: "border-indigo-200 bg-indigo-50 text-indigo-700",
  amber: "border-amber-200 bg-amber-50 text-amber-800",
  red: "border-red-200 bg-red-50 text-red-700",
  gray: "border-zinc-200 bg-zinc-50 text-zinc-600",
  teal: "border-teal-200 bg-teal-50 text-teal-700",
  orange: "border-orange-200 bg-orange-50 text-orange-700",
} as const;

type Tone = keyof typeof tones;

function ToneBadge({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <Badge variant="outline" className={cn("font-medium", tones[tone])}>
      {children}
    </Badge>
  );
}

function humanize(value: string) {
  const text = value.replaceAll("_", " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Appointment, job and visit statuses share one map.
const statusTones: Record<string, Tone> = {
  new: "blue",
  scheduled: "blue",
  confirmed: "indigo",
  in_progress: "amber",
  completed: "green",
  cancelled: "gray",
  no_show: "red",
};

export function StatusBadge({ status }: { status: string }) {
  return <ToneBadge tone={statusTones[status] ?? "gray"}>{humanize(status)}</ToneBadge>;
}

const outcomeTones: Record<string, Tone> = {
  booked: "green",
  answered_question: "blue",
  transferred: "indigo",
  voicemail: "amber",
  missed: "red",
};

export function OutcomeBadge({ outcome }: { outcome: string }) {
  return <ToneBadge tone={outcomeTones[outcome] ?? "gray"}>{humanize(outcome)}</ToneBadge>;
}

const bookedViaLabels: Record<string, string> = {
  ai_call: "AI call",
  manual: "Manual",
  online: "Online",
};

export function BookedViaBadge({ bookedVia }: { bookedVia: string }) {
  return (
    <ToneBadge tone={bookedVia === "ai_call" ? "indigo" : "gray"}>
      {bookedViaLabels[bookedVia] ?? humanize(bookedVia)}
    </ToneBadge>
  );
}

export function IndustryBadge({ industry }: { industry: string }) {
  return industry === "medical" ? (
    <ToneBadge tone="teal">Medical</ToneBadge>
  ) : (
    <ToneBadge tone="orange">Field service</ToneBadge>
  );
}

const orgStatusTones: Record<string, Tone> = {
  active: "green",
  onboarding: "blue",
  paused: "amber",
};

export function OrgStatusBadge({ status }: { status: string }) {
  return <ToneBadge tone={orgStatusTones[status] ?? "gray"}>{humanize(status)}</ToneBadge>;
}

const sourceTones: Record<string, Tone> = { retell: "indigo", n8n: "orange", manual: "gray" };
const sourceLabels: Record<string, string> = { retell: "Retell", n8n: "n8n", manual: "Manual" };

export function SourceBadge({ source }: { source: string }) {
  return <ToneBadge tone={sourceTones[source] ?? "gray"}>{sourceLabels[source] ?? source}</ToneBadge>;
}

const priorityTones: Record<string, Tone> = { urgent: "red", normal: "gray", low: "gray" };

export function PriorityBadge({ priority }: { priority: string }) {
  return <ToneBadge tone={priorityTones[priority] ?? "gray"}>{humanize(priority)}</ToneBadge>;
}
