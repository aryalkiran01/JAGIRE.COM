import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { CircleCheck as CheckCircle2, TriangleAlert as AlertTriangle, Circle as XCircle, TrendingUp, Target, Lightbulb, Clock, Mail, Calendar, FileText, Users, Brain, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type FieldRenderer = (value: unknown) => React.ReactNode;

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const color = pct >= 75 ? "bg-success" : pct >= 50 ? "bg-warning" : "bg-error";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{pct}/100</span>
      </div>
      <Progress value={pct} className={`h-2 ${color}`} />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<
    string,
    { variant: "default" | "secondary" | "destructive" | "outline"; icon: LucideIcon }
  > = {
    qualified: { variant: "default", icon: CheckCircle2 },
    borderline: { variant: "secondary", icon: AlertTriangle },
    unqualified: { variant: "destructive", icon: XCircle },
    HIRE: { variant: "default", icon: CheckCircle2 },
    "NO-HIRE": { variant: "destructive", icon: XCircle },
    HOLD: { variant: "secondary", icon: AlertTriangle },
    High: { variant: "default", icon: TrendingUp },
    Medium: { variant: "secondary", icon: Target },
    Low: { variant: "outline", icon: Clock },
    high: { variant: "default", icon: TrendingUp },
    medium: { variant: "secondary", icon: Target },
    low: { variant: "outline", icon: Clock },
  };
  const cfg = map[status] ?? { variant: "outline" as const, icon: Sparkles };
  const Icon = cfg.icon;
  return (
    <Badge variant={cfg.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {status}
    </Badge>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  return <StatusBadge status={priority} />;
}

function StringList({ items, icon: Icon }: { items: string[]; icon?: LucideIcon }) {
  if (!items.length) return null;
  return (
    <ul className="space-y-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm">
          {Icon ? (
            <Icon className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
          ) : (
            <span className="text-muted-foreground mt-0.5">•</span>
          )}
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 text-sm">{children}</CardContent>
    </Card>
  );
}

const renderers: Record<string, FieldRenderer> = {
  // Simple string
  summary: (v) => (typeof v === "string" ? <p className="text-muted-foreground">{v}</p> : null),
  answer: (v) => (typeof v === "string" ? <p>{v}</p> : null),
  full_description: (v) =>
    typeof v === "string" ? <p className="whitespace-pre-wrap">{v}</p> : null,
  optimized_description: (v) =>
    typeof v === "string" ? <p className="whitespace-pre-wrap">{v}</p> : null,
  body: (v) => (typeof v === "string" ? <p className="whitespace-pre-wrap">{v}</p> : null),
  invite_text: (v) => (typeof v === "string" ? <p className="whitespace-pre-wrap">{v}</p> : null),
  subject: (v) => (typeof v === "string" ? <p className="font-medium">{v}</p> : null),
  ideal_candidate_profile: (v) => (typeof v === "string" ? <p>{v}</p> : null),
  bench_strength: (v) => (typeof v === "string" ? <p>{v}</p> : null),
  time_to_hire_trend: (v) =>
    typeof v === "string" ? <p className="text-muted-foreground">{v}</p> : null,
  reasoning: (v) => (typeof v === "string" ? <p>{v}</p> : null),
  rationale: (v) => (typeof v === "string" ? <p>{v}</p> : null),
  suggested_role: (v) =>
    typeof v === "string" && v ? (
      <p className="text-muted-foreground">Suggested role: {v}</p>
    ) : null,

  // Score fields
  confidence: (v) => (typeof v === "number" ? <ScoreBar label="Confidence" value={v} /> : null),
  clarity_score: (v) => (typeof v === "number" ? <ScoreBar label="Clarity" value={v} /> : null),
  inclusivity_score: (v) =>
    typeof v === "number" ? <ScoreBar label="Inclusivity" value={v} /> : null,
  seo_score: (v) => (typeof v === "number" ? <ScoreBar label="SEO" value={v} /> : null),

  // String arrays
  matching_strengths: (v) =>
    isStringArray(v) ? <StringList items={v} icon={CheckCircle2} /> : null,
  gaps: (v) => (isStringArray(v) ? <StringList items={v} icon={AlertTriangle} /> : null),
  reasons: (v) => (isStringArray(v) ? <StringList items={v} /> : null),
  recommendations: (v) => (isStringArray(v) ? <StringList items={v} icon={Lightbulb} /> : null),
  top_skills: (v) => (isStringArray(v) ? <StringList items={v} icon={Target} /> : null),
  experience_highlights: (v) =>
    isStringArray(v) ? <StringList items={v} icon={TrendingUp} /> : null,
  red_flags: (v) => (isStringArray(v) ? <StringList items={v} icon={AlertTriangle} /> : null),
  recommended_next_steps: (v) =>
    isStringArray(v) ? <StringList items={v} icon={CheckCircle2} /> : null,
  search_keywords: (v) => (isStringArray(v) ? <StringList items={v} icon={Target} /> : null),
  boolean_strings: (v) => (isStringArray(v) ? <StringList items={v} icon={FileText} /> : null),
  sourcing_channels: (v) => (isStringArray(v) ? <StringList items={v} icon={Users} /> : null),
  matching_fields: (v) => (isStringArray(v) ? <StringList items={v} /> : null),
  contributing_factors: (v) => (isStringArray(v) ? <StringList items={v} /> : null),
  risk_factors: (v) => (isStringArray(v) ? <StringList items={v} icon={AlertTriangle} /> : null),
  responsibilities: (v) => (isStringArray(v) ? <StringList items={v} icon={CheckCircle2} /> : null),
  requirements: (v) => (isStringArray(v) ? <StringList items={v} icon={Target} /> : null),
  preferred_qualifications: (v) =>
    isStringArray(v) ? <StringList items={v} icon={Sparkles} /> : null,
  benefits: (v) => (isStringArray(v) ? <StringList items={v} icon={CheckCircle2} /> : null),
  changes_made: (v) => (isStringArray(v) ? <StringList items={v} icon={Lightbulb} /> : null),
  insights: (v) => (isStringArray(v) ? <StringList items={v} icon={Lightbulb} /> : null),
  metrics_summary: (v) => (isStringArray(v) ? <StringList items={v} icon={TrendingUp} /> : null),
  actions: (v) => (isStringArray(v) ? <StringList items={v} icon={Lightbulb} /> : null),
  hiring_priorities: (v) => (isStringArray(v) ? <StringList items={v} icon={Target} /> : null),
  risks: (v) => (isStringArray(v) ? <StringList items={v} icon={AlertTriangle} /> : null),
  workflow: (v) => (isStringArray(v) ? <StringList items={v} icon={Calendar} /> : null),
  learning_path: (v) => (isStringArray(v) ? <StringList items={v} icon={Target} /> : null),

  // Badges
  recommendation: (v) => (typeof v === "string" ? <StatusBadge status={v} /> : null),
  prediction: (v) => (typeof v === "string" ? <StatusBadge status={v} /> : null),
  status: (v) => (typeof v === "string" ? <StatusBadge status={v} /> : null),
  priority: (v) => (typeof v === "string" ? <PriorityBadge priority={v} /> : null),
  tone: (v) => (typeof v === "string" && v ? <Badge variant="outline">{v}</Badge> : null),
  coverage: (v) => (typeof v === "string" ? <StatusBadge status={v} /> : null),

  // Numbers
  unique_count: (v) =>
    typeof v === "number" ? <p className="text-muted-foreground">{v} unique candidates</p> : null,
};

export function AiResultRenderer({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data).filter(([, v]) => v !== null && v !== undefined);

  return (
    <div className="space-y-3">
      {entries.map(([key, value]) => {
        // Arrays of objects get their own card
        if (Array.isArray(value) && value.length > 0 && typeof value[0] === "object") {
          return (
            <ObjectArrayCard key={key} fieldKey={key} items={value as Record<string, unknown>[]} />
          );
        }
        // Known field renderer
        const renderer = renderers[key];
        if (renderer) {
          const rendered = renderer(value);
          if (!rendered) return null;
          return (
            <div key={key} className="space-y-1">
              {rendered}
            </div>
          );
        }
        // Fallback: stringify
        if (typeof value === "string") {
          return (
            <p key={key} className="text-sm text-muted-foreground whitespace-pre-wrap">
              {value}
            </p>
          );
        }
        return null;
      })}
    </div>
  );
}

const ARRAY_CARD_CONFIG: Record<string, { title: string; icon: LucideIcon }> = {
  matches: { title: "Candidate Matches", icon: Users },
  results: { title: "Screening Results", icon: FileText },
  ranking: { title: "Ranking", icon: TrendingUp },
  shortlisted: { title: "Shortlisted", icon: CheckCircle2 },
  not_shortlisted: { title: "Not Shortlisted", icon: XCircle },
  questions: { title: "Interview Questions", icon: Brain },
  bottlenecks: { title: "Bottlenecks", icon: AlertTriangle },
  opportunities: { title: "Automation Opportunities", icon: Lightbulb },
  stages: { title: "Workflow Stages", icon: Calendar },
  forecasts: { title: "Forecasts", icon: TrendingUp },
  headcount_plan: { title: "Headcount Plan", icon: Users },
  recommendations: { title: "Recommendations", icon: Lightbulb },
  actions: { title: "Recommended Actions", icon: Lightbulb },
  first_week_plan: { title: "First Week Plan", icon: Calendar },
  proposed_slots: { title: "Proposed Slots", icon: Clock },
  sources: { title: "Sources", icon: FileText },
  skill_coverage: { title: "Skill Coverage", icon: Target },
  duplicates: { title: "Duplicates", icon: AlertTriangle },
  gaps: { title: "Skill Gaps", icon: Target },
};

function ObjectArrayCard({
  fieldKey,
  items,
}: {
  fieldKey: string;
  items: Record<string, unknown>[];
}) {
  const cfg = ARRAY_CARD_CONFIG[fieldKey] ?? { title: fieldKey, icon: Sparkles };

  return (
    <SectionCard title={cfg.title} icon={cfg.icon}>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="rounded-lg border border-border/50 p-3 space-y-1.5 bg-muted/30">
            {Object.entries(item).map(([k, v]) => {
              if (v === null || v === undefined) return null;
              const renderer = renderers[k];
              if (renderer) {
                const rendered = renderer(v);
                if (!rendered) return null;
                return <div key={k}>{rendered}</div>;
              }
              if (isStringArray(v)) {
                return <StringList key={k} items={v} />;
              }
              if (typeof v === "string" || typeof v === "number") {
                return (
                  <div key={k} className="text-xs">
                    <span className="text-muted-foreground capitalize">
                      {k.replace(/_/g, " ")}:{" "}
                    </span>
                    <span className="font-medium">{String(v)}</span>
                  </div>
                );
              }
              return null;
            })}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
