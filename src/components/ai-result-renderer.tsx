/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
  ChevronRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type FieldRenderer = (value: unknown) => React.ReactNode;

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

function formatKeyLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const color = pct >= 75 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="space-y-1.5 my-2">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground font-medium">{label}</span>
        <span className="font-bold">{pct}/100</span>
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
    active: { variant: "default", icon: CheckCircle2 },
    selected: { variant: "default", icon: Award },
    shortlisted: { variant: "secondary", icon: Sparkles },
    rejected: { variant: "destructive", icon: XCircle },
  };
  const cfg = map[status] ?? { variant: "outline" as const, icon: Sparkles };
  const Icon = cfg.icon;
  return (
    <Badge variant={cfg.variant} className="gap-1 capitalize">
      <Icon className="h-3 w-3" />
      {status.replace(/_/g, " ")}
    </Badge>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  return <StatusBadge status={priority} />;
}

function StringList({ items, icon: Icon }: { items: string[]; icon?: LucideIcon }) {
  if (!items.length) return null;
  return (
    <ul className="space-y-1.5 my-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm leading-relaxed">
          {Icon ? (
            <Icon className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
          ) : (
            <span className="text-primary mt-0.5 text-base leading-none">•</span>
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
    <Card className="shadow-sm border-border/60 bg-card/60 backdrop-blur my-2">
      <CardHeader className="py-2.5 px-4 border-b border-border/40">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary shrink-0" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 text-sm">{children}</CardContent>
    </Card>
  );
}

const renderers: Record<string, FieldRenderer> = {
  // Simple strings & text blocks
  summary: (v) =>
    typeof v === "string" ? <p className="text-muted-foreground leading-relaxed">{v}</p> : null,
  answer: (v) => (typeof v === "string" ? <p className="leading-relaxed">{v}</p> : null),
  full_description: (v) =>
    typeof v === "string" ? <p className="whitespace-pre-wrap leading-relaxed">{v}</p> : null,
  optimized_description: (v) =>
    typeof v === "string" ? <p className="whitespace-pre-wrap leading-relaxed">{v}</p> : null,
  body: (v) =>
    typeof v === "string" ? <p className="whitespace-pre-wrap leading-relaxed">{v}</p> : null,
  invite_text: (v) =>
    typeof v === "string" ? <p className="whitespace-pre-wrap leading-relaxed">{v}</p> : null,
  subject: (v) =>
    typeof v === "string" ? (
      <div className="rounded-md bg-muted/60 p-2.5 font-medium text-sm text-foreground border border-border/50">
        <span className="text-xs uppercase text-muted-foreground block font-bold">Subject:</span>
        {v}
      </div>
    ) : null,
  ideal_candidate_profile: (v) =>
    typeof v === "string" ? <p className="leading-relaxed">{v}</p> : null,
  bench_strength: (v) => (typeof v === "string" ? <p>{v}</p> : null),
  time_to_hire_trend: (v) =>
    typeof v === "string" ? <p className="text-muted-foreground">{v}</p> : null,
  reasoning: (v) => (typeof v === "string" ? <p className="text-muted-foreground">{v}</p> : null),
  rationale: (v) => (typeof v === "string" ? <p className="text-muted-foreground">{v}</p> : null),
  suggested_role: (v) =>
    typeof v === "string" && v ? (
      <div className="flex items-center gap-2 text-sm font-medium">
        <Briefcase className="h-4 w-4 text-primary" />
        <span>Suggested role: {v}</span>
      </div>
    ) : null,

  // Score fields
  confidence: (v) =>
    typeof v === "number" ? <ScoreBar label="Confidence Score" value={v} /> : null,
  clarity_score: (v) =>
    typeof v === "number" ? <ScoreBar label="Clarity Score" value={v} /> : null,
  inclusivity_score: (v) =>
    typeof v === "number" ? <ScoreBar label="Inclusivity Score" value={v} /> : null,
  seo_score: (v) => (typeof v === "number" ? <ScoreBar label="SEO Score" value={v} /> : null),
  ats_score: (v) =>
    typeof v === "number" ? <ScoreBar label="ATS Compatibility Score" value={v} /> : null,
  overall_score: (v) =>
    typeof v === "number" ? <ScoreBar label="Overall Assessment Score" value={v} /> : null,
  career_readiness_score: (v) =>
    typeof v === "number" ? <ScoreBar label="Career Readiness Score" value={v} /> : null,
  hiring_readiness_score: (v) =>
    typeof v === "number" ? <ScoreBar label="Hiring Readiness Score" value={v} /> : null,

  // String arrays
  matching_strengths: (v) =>
    isStringArray(v) ? <StringList items={v} icon={CheckCircle2} /> : null,
  gaps: (v) => (isStringArray(v) ? <StringList items={v} icon={AlertTriangle} /> : null),
  reasons: (v) => (isStringArray(v) ? <StringList items={v} icon={Lightbulb} /> : null),
  recommendations: (v) => (isStringArray(v) ? <StringList items={v} icon={Lightbulb} /> : null),
  actionable_recommendations: (v) =>
    isStringArray(v) ? <StringList items={v} icon={Zap} /> : null,
  top_skills: (v) => (isStringArray(v) ? <StringList items={v} icon={Target} /> : null),
  experience_highlights: (v) =>
    isStringArray(v) ? <StringList items={v} icon={TrendingUp} /> : null,
  red_flags: (v) => (isStringArray(v) ? <StringList items={v} icon={AlertTriangle} /> : null),
  recommended_next_steps: (v) =>
    isStringArray(v) ? <StringList items={v} icon={CheckCircle2} /> : null,
  search_keywords: (v) => (isStringArray(v) ? <StringList items={v} icon={Target} /> : null),
  boolean_strings: (v) => (isStringArray(v) ? <StringList items={v} icon={FileText} /> : null),
  sourcing_channels: (v) => (isStringArray(v) ? <StringList items={v} icon={Users} /> : null),
  matching_fields: (v) => (isStringArray(v) ? <StringList items={v} icon={CheckCircle2} /> : null),
  contributing_factors: (v) =>
    isStringArray(v) ? <StringList items={v} icon={Lightbulb} /> : null,
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
  strengths: (v) => (isStringArray(v) ? <StringList items={v} icon={CheckCircle2} /> : null),
  weaknesses: (v) => (isStringArray(v) ? <StringList items={v} icon={AlertTriangle} /> : null),
  missing_skills: (v) => (isStringArray(v) ? <StringList items={v} icon={Target} /> : null),
  extracted_skills: (v) => (isStringArray(v) ? <StringList items={v} icon={Target} /> : null),
  skill_gaps: (v) => (isStringArray(v) ? <StringList items={v} icon={AlertTriangle} /> : null),
  suggestions: (v) => (isStringArray(v) ? <StringList items={v} icon={Lightbulb} /> : null),
  action_plan: (v) => (isStringArray(v) ? <StringList items={v} icon={CheckCircle2} /> : null),
  improvement_suggestions: (v) =>
    isStringArray(v) ? <StringList items={v} icon={Lightbulb} /> : null,
  follow_up_questions: (v) => (isStringArray(v) ? <StringList items={v} icon={Brain} /> : null),

  // Badges
  recommendation: (v) => (typeof v === "string" ? <StatusBadge status={v} /> : null),
  prediction: (v) => (typeof v === "string" ? <StatusBadge status={v} /> : null),
  status: (v) => (typeof v === "string" ? <StatusBadge status={v} /> : null),
  priority: (v) => (typeof v === "string" ? <PriorityBadge priority={v} /> : null),
  tone: (v) => (typeof v === "string" && v ? <Badge variant="outline">Tone: {v}</Badge> : null),
  coverage: (v) => (typeof v === "string" ? <StatusBadge status={v} /> : null),

  // Job seeker AI fields
  cover_letter: (v) =>
    typeof v === "string" ? (
      <div className="rounded-xl border border-border/60 bg-muted/20 p-4 leading-relaxed whitespace-pre-wrap text-sm">
        {v}
      </div>
    ) : null,
  brand_statement: (v) =>
    typeof v === "string" ? (
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-sm leading-relaxed font-medium">
        {v}
      </div>
    ) : null,
  elevator_pitch: (v) =>
    typeof v === "string" ? (
      <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5 italic text-sm text-foreground/90">
        "{v}"
      </div>
    ) : null,
  short_bio: (v) => (typeof v === "string" ? <p className="text-sm leading-relaxed">{v}</p> : null),
  medium_bio: (v) =>
    typeof v === "string" ? <p className="text-sm leading-relaxed">{v}</p> : null,
  long_bio: (v) =>
    typeof v === "string" ? (
      <p className="text-sm whitespace-pre-wrap leading-relaxed">{v}</p>
    ) : null,
  negotiation_script: (v) =>
    typeof v === "string" ? (
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm whitespace-pre-wrap leading-relaxed">
        {v}
      </div>
    ) : null,
  overall_recommendation: (v) =>
    typeof v === "string" ? <p className="text-sm leading-relaxed">{v}</p> : null,
  transition_feasibility: (v) =>
    typeof v === "string" ? <p className="text-sm leading-relaxed">{v}</p> : null,
  current_assessment: (v) =>
    typeof v === "string" ? <p className="text-sm leading-relaxed">{v}</p> : null,
  portfolio_assessment: (v) =>
    typeof v === "string" ? <p className="text-sm leading-relaxed">{v}</p> : null,
  job_market_outlook: (v) =>
    typeof v === "string" ? (
      <p className="text-sm text-muted-foreground leading-relaxed">{v}</p>
    ) : null,
  salary_adjustment: (v) => (typeof v === "string" ? <p className="text-sm">{v}</p> : null),

  // Job seeker score fields
  ats_optimization_score: (v) =>
    typeof v === "number" ? <ScoreBar label="ATS Optimization Score" value={v} /> : null,
  profile_completeness_score: (v) =>
    typeof v === "number" ? <ScoreBar label="Profile Completeness" value={v} /> : null,
  your_market_value: (v) =>
    typeof v === "number" ? (
      <div className="rounded-lg border border-primary/30 bg-primary/10 p-3 flex items-center justify-between">
        <span className="text-sm font-semibold">Estimated Market Value (NPR)</span>
        <span className="text-base font-bold text-primary">Rs. {v.toLocaleString()}</span>
      </div>
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
  matching_skills: (v) => (isStringArray(v) ? <StringList items={v} icon={CheckCircle2} /> : null),

  // Job seeker salary prediction object
  salary_prediction: (v) => {
    if (typeof v !== "object" || v === null || Array.isArray(v)) return null;
    const r = v as Record<string, unknown>;
    const low = typeof r.low === "number" ? r.low.toLocaleString() : "?";
    const mid = typeof r.mid === "number" ? r.mid.toLocaleString() : "?";
    const high = typeof r.high === "number" ? r.high.toLocaleString() : "?";
    const currency = typeof r.currency === "string" ? r.currency : "NPR";
    return (
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 my-2">
        <div className="text-xs uppercase font-bold text-muted-foreground tracking-wider mb-2">
          Estimated Salary Prediction ({currency})
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-background/80 p-2 border">
            <span className="text-[11px] text-muted-foreground block">Minimum</span>
            <span className="font-bold text-xs sm:text-sm">Rs. {low}</span>
          </div>
          <div className="rounded-lg bg-primary/10 p-2 border border-primary/30">
            <span className="text-[11px] text-primary block font-semibold">Expected / Median</span>
            <span className="font-bold text-xs sm:text-sm text-primary">Rs. {mid}</span>
          </div>
          <div className="rounded-lg bg-background/80 p-2 border">
            <span className="text-[11px] text-muted-foreground block">Maximum</span>
            <span className="font-bold text-xs sm:text-sm">Rs. {high}</span>
          </div>
        </div>
      </div>
    );
  },

  market_range: (v) => {
    if (typeof v !== "object" || v === null || Array.isArray(v)) return null;
    const r = v as Record<string, unknown>;
    const low = typeof r.low === "number" ? r.low.toLocaleString() : "?";
    const mid = typeof r.mid === "number" ? r.mid.toLocaleString() : "?";
    const high = typeof r.high === "number" ? r.high.toLocaleString() : "?";
    const currency = typeof r.currency === "string" ? r.currency : "Rs.";
    return (
      <div className="rounded-xl border border-border p-3.5 bg-muted/30 my-2">
        <div className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-1">
          Market Salary Range
        </div>
        <div className="text-sm font-bold text-foreground">
          {currency} {low} – {mid} – {high}
        </div>
      </div>
    );
  },
};

const ARRAY_CARD_CONFIG: Record<string, { title: string; icon: LucideIcon }> = {
  // Job seeker AI array fields
  star_stories: { title: "STAR Interview Stories", icon: Brain },
  likely_questions: { title: "Likely Interview Questions", icon: Brain },
  specific_feedback: { title: "Detailed Feedback", icon: FileText },
  target_skills: { title: "Target Skills to Acquire", icon: Target },
  milestones: { title: "Milestones & Timeline", icon: Calendar },
  transition_timeline: { title: "Career Transition Timeline", icon: Calendar },
  recommended_roles: { title: "Recommended Roles", icon: Briefcase },
  suggested_mentor_types: { title: "Suggested Mentor Types", icon: Users },
  outreach_templates: { title: "Outreach Message Templates", icon: Mail },
  goals: { title: "Career Goals", icon: Target },
  courses: { title: "Recommended Courses & Tutorials", icon: GraduationCap },
  recommended_certifications: { title: "Recommended Certifications", icon: Award },
  suggested_projects: { title: "Suggested Practical Projects", icon: Code2 },
  projects: { title: "Project Ideas", icon: Code2 },
  improvements: { title: "Resume & Profile Improvements", icon: Lightbulb },
  optimized_sections: { title: "Optimized Resume Sections", icon: FileText },
  about_suggestions: { title: "About / Bio Suggestions", icon: Sparkles },
  experience_improvements: { title: "Work Experience Highlights", icon: Briefcase },
  practice_problems: { title: "Practice Questions & Problems", icon: Brain },
  resources: { title: "Learning Resources", icon: FileText },
  benchmark_comparisons: { title: "Salary Benchmark Comparisons", icon: TrendingUp },
  cost_of_living_comparison: { title: "Cost of Living Comparison", icon: Target },
  sourcing_channels: { title: "Recommended Sourcing Channels", icon: Users },
  career_paths: { title: "Recommended Career Pathways", icon: TrendingUp },
  companies_hiring: { title: "Top Companies Hiring in Nepal", icon: Briefcase },
  recommended_jobs: { title: "Recommended Job Opportunities", icon: Briefcase },
  items: { title: "Recommended Learning Items", icon: GraduationCap },

  // Employer AI array fields
  matches: { title: "Candidate Matches", icon: Target },
  results: { title: "Screening Results", icon: FileText },
  ranking: { title: "Candidate Rankings", icon: TrendingUp },
  shortlisted: { title: "Shortlisted Candidates", icon: CheckCircle2 },
  not_shortlisted: { title: "Non-Shortlisted Candidates", icon: XCircle },
  questions: { title: "Custom Interview Questions", icon: Brain },
  bottlenecks: { title: "Hiring Bottlenecks", icon: AlertTriangle },
  opportunities: { title: "Automation Opportunities", icon: Lightbulb },
  stages: { title: "Workflow Stages", icon: Calendar },
  forecasts: { title: "Hiring Forecasts", icon: TrendingUp },
  headcount_plan: { title: "Headcount Plan", icon: Users },
  recommendations: { title: "Strategic Recommendations", icon: Lightbulb },
  actions: { title: "Action Items", icon: Lightbulb },
  first_week_plan: { title: "First Week Onboarding Plan", icon: Calendar },
  proposed_slots: { title: "Proposed Interview Slots", icon: Clock },
  sources: { title: "Candidate Sources", icon: FileText },
  skill_coverage: { title: "Skill Coverage Analysis", icon: Target },
  duplicates: { title: "Duplicate Candidate Warnings", icon: AlertTriangle },
  target_talent_profiles: { title: "Target Talent Profiles", icon: Users },
  candidate_screening_criteria: { title: "Candidate Screening Criteria", icon: ShieldCheck },
  compensation_benchmarks_npr: { title: "Compensation Benchmarks (NPR)", icon: TrendingUp },
};

/**
 * Renders an array of structured objects as beautiful cards instead of JSON
 */
function ObjectArrayCard({
  fieldKey,
  items,
}: {
  fieldKey: string;
  items: Record<string, unknown>[];
}) {
  const cfg = ARRAY_CARD_CONFIG[fieldKey] ?? {
    title: formatKeyLabel(fieldKey),
    icon: Sparkles,
  };

  return (
    <SectionCard title={cfg.title} icon={cfg.icon}>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/60 p-3.5 space-y-2 bg-muted/20 hover:bg-muted/30 transition-colors"
          >
            {Object.entries(item).map(([k, v]) => {
              if (v === null || v === undefined) return null;

              // Title or Name as heading
              if (k === "title" || k === "name" || k === "role" || k === "role_title") {
                return (
                  <div
                    key={k}
                    className="font-semibold text-sm text-foreground flex items-center gap-1.5"
                  >
                    <span className="text-primary">•</span>
                    <span>{String(v)}</span>
                  </div>
                );
              }

              // Known field renderer
              const renderer = renderers[k];
              if (renderer) {
                const rendered = renderer(v);
                if (rendered) return <div key={k}>{rendered}</div>;
              }

              // String arrays
              if (isStringArray(v)) {
                return (
                  <div key={k} className="text-xs space-y-1">
                    <span className="text-muted-foreground font-semibold uppercase tracking-wider block">
                      {formatKeyLabel(k)}:
                    </span>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {v.map((str, sIdx) => (
                        <Badge key={sIdx} variant="secondary" className="text-[11px] font-normal">
                          {str}
                        </Badge>
                      ))}
                    </div>
                  </div>
                );
              }

              // Primitive key-value
              if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
                return (
                  <div key={k} className="text-xs flex items-start gap-1.5 leading-relaxed">
                    <span className="text-muted-foreground font-medium shrink-0">
                      {formatKeyLabel(k)}:
                    </span>
                    <span className="text-foreground">{String(v)}</span>
                  </div>
                );
              }

              // Nested sub-object
              if (typeof v === "object" && !Array.isArray(v)) {
                return (
                  <div
                    key={k}
                    className="rounded-lg bg-muted/40 p-2.5 text-xs space-y-1 border border-border/40"
                  >
                    <span className="font-semibold text-muted-foreground block uppercase text-[10px]">
                      {formatKeyLabel(k)}
                    </span>
                    {Object.entries(v as Record<string, unknown>).map(([subK, subV]) => (
                      <div key={subK} className="flex justify-between">
                        <span className="text-muted-foreground">{formatKeyLabel(subK)}:</span>
                        <span className="font-medium text-foreground">{String(subV)}</span>
                      </div>
                    ))}
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

/**
 * Universal AI Result Renderer. Accepts objects, JSON strings, or arrays, and formats them cleanly with ZERO raw JSON.
 */
export function AiResultRenderer({ data }: { data: unknown }) {
  if (data === null || data === undefined) return null;

  // If string, check if it's JSON or markdown
  if (typeof data === "string") {
    const trimmed = data.trim();
    if (
      (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]"))
    ) {
      try {
        const parsed = JSON.parse(trimmed);
        return <AiResultRenderer data={parsed} />;
      } catch {
        return <CleanMarkdownView text={trimmed} />;
      }
    }
    return <CleanMarkdownView text={data} />;
  }

  // If Array of objects
  if (Array.isArray(data)) {
    if (data.length === 0) return null;
    if (typeof data[0] === "object" && data[0] !== null) {
      return <ObjectArrayCard fieldKey="results" items={data as Record<string, unknown>[]} />;
    }
    if (isStringArray(data)) {
      return <StringList items={data} icon={CheckCircle2} />;
    }
  }

  // If Record/Object
  if (typeof data === "object") {
    const entries = Object.entries(data as Record<string, unknown>).filter(
      ([, v]) => v !== null && v !== undefined,
    );

    return (
      <div className="space-y-3 my-1">
        {entries.map(([key, value]) => {
          // Array of objects
          if (
            Array.isArray(value) &&
            value.length > 0 &&
            typeof value[0] === "object" &&
            value[0] !== null
          ) {
            return (
              <ObjectArrayCard
                key={key}
                fieldKey={key}
                items={value as Record<string, unknown>[]}
              />
            );
          }

          // Known field renderer
          const renderer = renderers[key];
          if (renderer) {
            const rendered = renderer(value);
            if (rendered) return <div key={key}>{rendered}</div>;
          }

          // String arrays fallback to tags or list
          if (isStringArray(value)) {
            return (
              <div key={key} className="space-y-1.5 my-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {formatKeyLabel(key)}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {value.map((tag, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs font-normal">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            );
          }

          // String fallback
          if (typeof value === "string") {
            // Check if string contains markdown or structured text
            return (
              <div key={key} className="space-y-1 my-1.5">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {formatKeyLabel(key)}
                </div>
                <CleanMarkdownView text={value} />
              </div>
            );
          }

          // Number fallback
          if (typeof value === "number") {
            return (
              <div
                key={key}
                className="flex justify-between items-center text-xs py-1 border-b border-border/40"
              >
                <span className="text-muted-foreground font-medium">{formatKeyLabel(key)}</span>
                <span className="font-bold text-foreground">{value}</span>
              </div>
            );
          }

          // Nested object
          if (typeof value === "object" && value !== null) {
            return (
              <div
                key={key}
                className="rounded-xl border border-border/60 bg-muted/20 p-3.5 space-y-2 my-2"
              >
                <div className="text-xs font-bold text-primary uppercase tracking-wider">
                  {formatKeyLabel(key)}
                </div>
                <AiResultRenderer data={value} />
              </div>
            );
          }

          return null;
        })}
      </div>
    );
  }

  return null;
}

/**
 * Formats inline bold, code, and links safely
 */
function formatInlineText(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={index}
          className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-primary font-medium"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

/**
 * Universal Markdown and AI Chat View that guarantees zero raw JSON is shown.
 * Intercepts JSON code blocks and parses them into styled UI automatically.
 */
export function CleanMarkdownView({ text }: { text: string }) {
  if (!text) return null;

  // If text is a full JSON string, render directly with AiResultRenderer
  const trimmed = text.trim();
  if (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    try {
      const parsed = JSON.parse(trimmed);
      return <AiResultRenderer data={parsed} />;
    } catch {
      // Not JSON, continue to markdown
    }
  }

  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let key = 0;
  let inCodeBlock = false;
  let codeLines: string[] = [];
  let codeLang = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block detection
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        // End of code block
        const blockContent = codeLines.join("\n").trim();
        // Check if code block contains JSON
        if (
          codeLang.toLowerCase().includes("json") ||
          (blockContent.startsWith("{") && blockContent.endsWith("}")) ||
          (blockContent.startsWith("[") && blockContent.endsWith("]"))
        ) {
          try {
            const parsedJson = JSON.parse(blockContent);
            elements.push(
              <div key={key++} className="my-3">
                <AiResultRenderer data={parsedJson} />
              </div>,
            );
            inCodeBlock = false;
            codeLines = [];
            codeLang = "";
            continue;
          } catch {
            // Fallback to formatted pre block
          }
        }

        elements.push(
          <div key={key++} className="my-2.5 rounded-lg overflow-hidden border border-border/60">
            {codeLang && (
              <div className="bg-muted/80 text-muted-foreground text-[11px] px-3 py-1 font-mono uppercase border-b border-border/40">
                {codeLang}
              </div>
            )}
            <pre className="bg-muted/30 p-3 text-xs overflow-x-auto font-mono text-foreground">
              <code>{blockContent}</code>
            </pre>
          </div>,
        );
        inCodeBlock = false;
        codeLines = [];
        codeLang = "";
      } else {
        inCodeBlock = true;
        codeLang = line.trim().replace(/^```/, "").trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    // Empty line
    if (!line.trim()) {
      elements.push(<div key={key++} className="h-2" />);
      continue;
    }

    // Headings
    if (line.startsWith("### ")) {
      elements.push(
        <h3
          key={key++}
          className="text-sm font-bold mt-3 mb-1.5 text-foreground flex items-center gap-1.5"
        >
          <ChevronRight className="h-3.5 w-3.5 text-primary shrink-0" />
          {formatInlineText(line.replace("### ", ""))}
        </h3>,
      );
      continue;
    }
    if (line.startsWith("## ")) {
      elements.push(
        <h2
          key={key++}
          className="text-base font-bold mt-4 mb-2 text-foreground border-b border-border/40 pb-1"
        >
          {formatInlineText(line.replace("## ", ""))}
        </h2>,
      );
      continue;
    }
    if (line.startsWith("# ")) {
      elements.push(
        <h1 key={key++} className="text-lg font-bold mt-4 mb-2 text-foreground">
          {formatInlineText(line.replace("# ", ""))}
        </h1>,
      );
      continue;
    }

    // Blockquotes
    if (line.startsWith("> ")) {
      elements.push(
        <blockquote
          key={key++}
          className="border-l-2 border-primary pl-3 py-1 my-2 text-xs italic text-muted-foreground bg-primary/5 rounded-r-md"
        >
          {formatInlineText(line.replace(/^>\s*/, ""))}
        </blockquote>,
      );
      continue;
    }

    // Bullet lists
    if (/^\s*[-*•]\s+/.test(line)) {
      const content = line.replace(/^\s*[-*•]\s+/, "");
      elements.push(
        <div key={key++} className="flex items-start gap-2 text-sm ml-1 my-1 leading-relaxed">
          <span className="text-primary shrink-0 mt-0.5">•</span>
          <div className="flex-1">{formatInlineText(content)}</div>
        </div>,
      );
      continue;
    }

    // Numbered lists
    if (/^\s*\d+[.)]\s+/.test(line)) {
      const num = line.match(/^\s*(\d+)/)?.[1] || "1";
      const content = line.replace(/^\s*\d+[.)]\s+/, "");
      elements.push(
        <div key={key++} className="flex items-start gap-2 text-sm ml-1 my-1 leading-relaxed">
          <span className="font-semibold text-primary shrink-0 text-xs mt-0.5">{num}.</span>
          <div className="flex-1">{formatInlineText(content)}</div>
        </div>,
      );
      continue;
    }

    // Standard paragraph
    elements.push(
      <p key={key++} className="text-sm leading-relaxed my-1">
        {formatInlineText(line)}
      </p>,
    );
  }

  return <div className="space-y-0 text-foreground">{elements}</div>;
}
