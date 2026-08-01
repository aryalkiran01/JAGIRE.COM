import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  CircleCheck as CheckCircle2,
  TriangleAlert as AlertTriangle,
  Circle as XCircle,
  TrendingUp,
  Target,
  Lightbulb,
  Clock,
  Mail,
  Calendar,
  FileText,
  Users,
  Brain,
  Sparkles,
  Briefcase,
  Code as Code2,
  GraduationCap,
  Award,
} from "lucide-react";
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

  // Job seeker AI fields
  cover_letter: (v) =>
    typeof v === "string" ? (
      <p className="whitespace-pre-wrap text-sm leading-relaxed">{v}</p>
    ) : null,
  brand_statement: (v) =>
    typeof v === "string" ? <p className="text-sm leading-relaxed">{v}</p> : null,
  elevator_pitch: (v) =>
    typeof v === "string" ? <p className="text-sm italic text-muted-foreground">"{v}"</p> : null,
  short_bio: (v) => (typeof v === "string" ? <p className="text-sm">{v}</p> : null),
  medium_bio: (v) => (typeof v === "string" ? <p className="text-sm">{v}</p> : null),
  long_bio: (v) =>
    typeof v === "string" ? <p className="text-sm whitespace-pre-wrap">{v}</p> : null,
  negotiation_script: (v) =>
    typeof v === "string" ? <p className="text-sm whitespace-pre-wrap">{v}</p> : null,
  overall_recommendation: (v) => (typeof v === "string" ? <p className="text-sm">{v}</p> : null),
  transition_feasibility: (v) => (typeof v === "string" ? <p className="text-sm">{v}</p> : null),
  current_assessment: (v) => (typeof v === "string" ? <p className="text-sm">{v}</p> : null),
  portfolio_assessment: (v) => (typeof v === "string" ? <p className="text-sm">{v}</p> : null),
  job_market_outlook: (v) =>
    typeof v === "string" ? <p className="text-sm text-muted-foreground">{v}</p> : null,
  salary_adjustment: (v) => (typeof v === "string" ? <p className="text-sm">{v}</p> : null),

  // Job seeker score fields
  ats_optimization_score: (v) =>
    typeof v === "number" ? <ScoreBar label="ATS Optimization" value={v} /> : null,
  profile_completeness_score: (v) =>
    typeof v === "number" ? <ScoreBar label="Profile Completeness" value={v} /> : null,
  overall_score: (v) =>
    typeof v === "number" ? <ScoreBar label="Overall Score" value={v} /> : null,
  your_market_value: (v) =>
    typeof v === "number" ? (
      <p className="text-sm font-medium">Estimated market value: {v.toLocaleString()}</p>
    ) : null,

  // Job seeker string arrays
  key_strengths_highlighted: (v) =>
    isStringArray(v) ? <StringList items={v} icon={CheckCircle2} /> : null,
  key_differentiators: (v) => (isStringArray(v) ? <StringList items={v} icon={Sparkles} /> : null),
  online_presence_tips: (v) =>
    isStringArray(v) ? <StringList items={v} icon={Lightbulb} /> : null,
  content_strategy: (v) => (isStringArray(v) ? <StringList items={v} icon={Lightbulb} /> : null),
  keywords: (v) => (isStringArray(v) ? <StringList items={v} icon={Target} /> : null),
  target_roles: (v) => (isStringArray(v) ? <StringList items={v} icon={Briefcase} /> : null),
  boolean_search_strings: (v) =>
    isStringArray(v) ? <StringList items={v} icon={FileText} /> : null,
  networking_tips: (v) => (isStringArray(v) ? <StringList items={v} icon={Users} /> : null),
  weekly_action_plan: (v) => (isStringArray(v) ? <StringList items={v} icon={Calendar} /> : null),
  negotiation_leverage: (v) =>
    isStringArray(v) ? <StringList items={v} icon={TrendingUp} /> : null,
  pros: (v) => (isStringArray(v) ? <StringList items={v} icon={CheckCircle2} /> : null),
  cons: (v) => (isStringArray(v) ? <StringList items={v} icon={AlertTriangle} /> : null),
  negotiation_points: (v) => (isStringArray(v) ? <StringList items={v} icon={Lightbulb} /> : null),
  lifestyle_factors: (v) => (isStringArray(v) ? <StringList items={v} icon={Sparkles} /> : null),
  preparation_checklist: (v) =>
    isStringArray(v) ? <StringList items={v} icon={CheckCircle2} /> : null,
  key_talking_points: (v) => (isStringArray(v) ? <StringList items={v} icon={Target} /> : null),
  red_flags_to_avoid: (v) =>
    isStringArray(v) ? <StringList items={v} icon={AlertTriangle} /> : null,
  strengths: (v) => (isStringArray(v) ? <StringList items={v} icon={CheckCircle2} /> : null),
  areas_for_improvement: (v) =>
    isStringArray(v) ? <StringList items={v} icon={AlertTriangle} /> : null,
  next_steps: (v) => (isStringArray(v) ? <StringList items={v} icon={Lightbulb} /> : null),
  tips: (v) => (isStringArray(v) ? <StringList items={v} icon={Lightbulb} /> : null),
  topics_to_review: (v) => (isStringArray(v) ? <StringList items={v} icon={Brain} /> : null),
  key_concepts: (v) => (isStringArray(v) ? <StringList items={v} icon={Brain} /> : null),
  transferable_skills: (v) =>
    isStringArray(v) ? <StringList items={v} icon={CheckCircle2} /> : null,
  skills_to_acquire: (v) => (isStringArray(v) ? <StringList items={v} icon={Target} /> : null),
  mentor_criteria: (v) => (isStringArray(v) ? <StringList items={v} icon={Users} /> : null),
  networking_strategy: (v) => (isStringArray(v) ? <StringList items={v} icon={Users} /> : null),
  quarterly_priorities: (v) => (isStringArray(v) ? <StringList items={v} icon={Calendar} /> : null),
  accountability_tips: (v) => (isStringArray(v) ? <StringList items={v} icon={Lightbulb} /> : null),
  priority_order: (v) => (isStringArray(v) ? <StringList items={v} icon={Target} /> : null),
  projects_to_add: (v) => (isStringArray(v) ? <StringList items={v} icon={Code2} /> : null),
  presentation_tips: (v) => (isStringArray(v) ? <StringList items={v} icon={Lightbulb} /> : null),
  headline_suggestions: (v) => (isStringArray(v) ? <StringList items={v} icon={Sparkles} /> : null),
  skills_to_add: (v) => (isStringArray(v) ? <StringList items={v} icon={Target} /> : null),
  missing_skills: (v) => (isStringArray(v) ? <StringList items={v} icon={AlertTriangle} /> : null),
  matching_skills: (v) => (isStringArray(v) ? <StringList items={v} icon={CheckCircle2} /> : null),

  // Job seeker ratings
  salary_rating: (v) =>
    typeof v === "string" ? <Badge variant="outline">Salary: {v}</Badge> : null,
  benefits_rating: (v) =>
    typeof v === "string" ? <Badge variant="outline">Benefits: {v}</Badge> : null,
  growth_rating: (v) =>
    typeof v === "string" ? <Badge variant="outline">Growth: {v}</Badge> : null,
  work_life_balance_rating: (v) =>
    typeof v === "string" ? <Badge variant="outline">WLB: {v}</Badge> : null,

  // Numbers
  unique_count: (v) =>
    typeof v === "number" ? <p className="text-muted-foreground">{v} unique candidates</p> : null,
  word_count: (v) =>
    typeof v === "number" ? <p className="text-xs text-muted-foreground">{v} words</p> : null,
  match_score: (v) => (typeof v === "number" ? <ScoreBar label="Match Score" value={v} /> : null),
  similarity: (v) =>
    typeof v === "number" ? (
      <p className="text-xs text-muted-foreground">{Math.round(v * 100)}% similar</p>
    ) : null,

  // Job seeker objects
  market_range: (v) => {
    if (typeof v !== "object" || v === null || Array.isArray(v)) return null;
    const r = v as Record<string, unknown>;
    const low = typeof r.low === "number" ? r.low.toLocaleString() : "?";
    const mid = typeof r.mid === "number" ? r.mid.toLocaleString() : "?";
    const high = typeof r.high === "number" ? r.high.toLocaleString() : "?";
    const currency = typeof r.currency === "string" ? r.currency : "";
    return (
      <div className="rounded-lg border p-3 bg-muted/30">
        <div className="text-sm font-semibold mb-1">Market Salary Range</div>
        <div className="text-sm text-muted-foreground">
          {currency} {low} – {mid} – {high}
        </div>
      </div>
    );
  },
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
  // Job seeker AI array fields
  star_stories: { title: "STAR Stories", icon: Brain },
  likely_questions: { title: "Likely Questions", icon: Brain },
  specific_feedback: { title: "Detailed Feedback", icon: FileText },
  target_skills: { title: "Target Skills", icon: Target },
  milestones: { title: "Milestones", icon: Calendar },
  transition_timeline: { title: "Transition Timeline", icon: Calendar },
  recommended_roles: { title: "Recommended Roles", icon: Briefcase },
  suggested_mentor_types: { title: "Mentor Types", icon: Users },
  outreach_templates: { title: "Outreach Templates", icon: Mail },
  goals: { title: "Goals", icon: Target },
  courses: { title: "Recommended Courses", icon: GraduationCap },
  recommended_certifications: { title: "Certifications", icon: Award },
  projects: { title: "Project Ideas", icon: Code2 },
  improvements: { title: "Improvements", icon: Lightbulb },
  optimized_sections: { title: "Optimized Sections", icon: FileText },
  about_suggestions: { title: "About Section", icon: Sparkles },
  experience_improvements: { title: "Experience", icon: Briefcase },
  practice_problems: { title: "Practice Problems", icon: Brain },
  resources: { title: "Resources", icon: FileText },
  benchmark_comparisons: { title: "Salary Benchmarks", icon: TrendingUp },
  cost_of_living_comparison: { title: "Cost of Living", icon: Target },
  sourcing_channels: { title: "Sourcing Channels", icon: Users },
  // Employer AI array fields
  matches: { title: "Matches", icon: Target },
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
