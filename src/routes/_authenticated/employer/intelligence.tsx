/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Building2,
  Sparkles,
  Loader as Loader2,
  TrendingUp,
  Briefcase,
  Users,
  Video,
  Target,
  Award,
  CheckCircle2,
  AlertCircle,
  History,
  RefreshCw,
  ExternalLink,
  Code2,
  HeartHandshake,
  DollarSign,
  Zap,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { getCompanyIntelligence, syncCompanyIntelligence } from "@/lib/company-intelligence.server";
import { cn } from "@/lib/utils";

type IntelligenceSearch = {
  companyId?: string;
};

export const Route = createFileRoute("/_authenticated/employer/intelligence")({
  validateSearch: (s: Record<string, unknown>): IntelligenceSearch => ({
    companyId: typeof s.companyId === "string" ? s.companyId : undefined,
  }),
  component: EmployerCompanyIntelligencePage,
});

function getHiringTier(score: number) {
  if (score >= 80)
    return {
      label: "Talent Magnet",
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    };
  if (score >= 65)
    return {
      label: "High Velocity",
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
    };
  if (score >= 45)
    return {
      label: "Active Recruiter",
      color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
    };
  return { label: "Emerging Setup", color: "bg-muted text-muted-foreground border-border" };
}

function EmployerCompanyIntelligencePage() {
  const { user } = useAuth();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const qc = useQueryClient();
  const fetchCI = useServerFn(getCompanyIntelligence);
  const syncCI = useServerFn(syncCompanyIntelligence);

  const [isSyncing, setIsSyncing] = useState(false);

  // Fetch all companies owned by this employer
  const { data: companies = [], isLoading: isCompaniesLoading } = useQuery({
    queryKey: ["my-companies", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, slug, logo_url, industry, headquarters, location")
        .eq("owner_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const selectedCompanyId =
    search.companyId || (companies.length > 0 ? companies[0].id : undefined);

  const { data, isLoading } = useQuery({
    queryKey: ["employer-company-intelligence", selectedCompanyId],
    enabled: !!selectedCompanyId || (!isCompaniesLoading && companies.length === 0),
    queryFn: async () => {
      return await fetchCI({ data: { companyId: selectedCompanyId } });
    },
  });

  const company = data?.company;
  const intelligence = data?.intelligence;
  const snapshots = data?.snapshots || [];
  const jobs = data?.jobs || [];

  const readinessScore = intelligence?.hiring_readiness_score ?? 0;
  const profileCompleteness = intelligence?.profile_completeness ?? 0;
  const scoreChange = (snapshots[0] as any)?.score_change ?? (intelligence as any)?.score_change;
  const hiringTier = getHiringTier(readinessScore);

  const roadmap = intelligence?.ai_hiring_roadmap as any;
  const recommendations = intelligence?.ai_recommendations as any;
  const technologies = (intelligence?.technologies || []) as string[];
  const benefits = (intelligence?.benefits || []) as string[];
  const cultureHighlights = (intelligence?.culture_highlights || []) as string[];
  const jobStats = ((intelligence?.job_stats as any) || {
    total_jobs: 0,
    active_jobs: 0,
    closed_jobs: 0,
    total_applicants: 0,
    shortlisted_count: 0,
    interview_count: 0,
  }) as any;

  async function handleSync() {
    if (!company?.id) return;
    setIsSyncing(true);
    try {
      await syncCI({ data: { companyId: company.id } });
      await qc.invalidateQueries({ queryKey: ["employer-company-intelligence", selectedCompanyId] });
      toast.success("360° Company intelligence synchronized successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to sync company intelligence");
    } finally {
      setIsSyncing(false);
    }
  }

  if (!isLoading && !isCompaniesLoading && (!company || companies.length === 0)) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-lg text-center space-y-4">
        <div className="h-16 w-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
          <Building2 className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold">No Company Profile Found</h2>
        <p className="text-sm text-muted-foreground">
          Create your company profile first to activate AI company intelligence, recruitment
          analytics, and hiring roadmap.
        </p>
        <Button asChild className="gap-2">
          <Link to="/employer/company">
            <Plus className="h-4 w-4" /> Create Company Profile
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Building2 className="h-7 w-7 text-primary" />
            <h1 className="text-3xl font-bold">
              {company?.name ? `${company.name} Intelligence` : "360° Company Intelligence"}
            </h1>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Continuous company & recruitment intelligence profile powering AI candidate screening,
            matching, and hiring strategies.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Company Selector Dropdown for multi-company employers */}
          {companies.length > 1 && (
            <div className="flex items-center gap-2 mr-2">
              <Select
                value={selectedCompanyId}
                onValueChange={(newId) => {
                  navigate({ search: { companyId: newId } });
                }}
              >
                <SelectTrigger className="w-[200px] sm:w-[240px] h-9 bg-card border-border text-xs shadow-sm">
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="font-medium truncate">{c.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={isSyncing || isLoading || !company}
            className="gap-1.5 text-xs h-9"
          >
            {isSyncing ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <RefreshCw className="h-4 w-4 text-primary" />
            )}
            <span>{isSyncing ? "Syncing 360° Data…" : "Re-sync Intelligence"}</span>
          </Button>

          <Button asChild variant="secondary" size="sm" className="gap-1.5 text-xs h-9">
            <Link to="/employer/company">
              <span>Edit Profile</span>
            </Link>
          </Button>

          <Button asChild size="sm" className="gap-1.5 text-xs h-9">
            <Link to="/employer/jobs/new" search={{ companyId: company?.id }}>
              <Plus className="h-4 w-4" />
              <span>Post New Job</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Top 360-Degree Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Hiring Readiness Score */}
        <Card className="border-border bg-card/70 backdrop-blur">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Hiring Readiness
              </span>
              <Badge className={cn("text-[10px] px-1.5 py-0 border", hiringTier.color)}>
                {hiringTier.label}
              </Badge>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-foreground">{readinessScore}</span>
              <span className="text-xs text-muted-foreground">/ 100</span>
            </div>
            <div className="mt-3">
              <Progress value={readinessScore} className="h-1.5" />
            </div>
          </CardContent>
        </Card>

        {/* Metric 2: Profile Completeness */}
        <Card className="border-border bg-card/70 backdrop-blur">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Profile Completeness
              </span>
              <span className="text-xs font-bold text-primary">{profileCompleteness}%</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-foreground">
                {profileCompleteness}%
              </span>
              <span className="text-xs text-muted-foreground">Company 360°</span>
            </div>
            <div className="mt-3">
              <Progress value={profileCompleteness} className="h-1.5" />
            </div>
          </CardContent>
        </Card>

        {/* Metric 3: Active Job Openings */}
        <Card className="border-border bg-card/70 backdrop-blur">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Active Job Openings
              </span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {jobStats.total_jobs} Total
              </Badge>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-foreground">
                {jobStats.active_jobs}
              </span>
              <span className="text-xs text-muted-foreground">openings live</span>
            </div>
            <div className="mt-3 text-[11px] text-muted-foreground truncate">
              {jobStats.closed_jobs} positions closed/filled
            </div>
          </CardContent>
        </Card>

        {/* Metric 4: Candidate Pipeline Momentum */}
        <Card className="border-border bg-card/70 backdrop-blur">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Applicant Momentum
              </span>
              <span className="text-xs text-muted-foreground">
                {jobStats.interview_count} Interviews
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-foreground">
                {jobStats.total_applicants}
              </span>
              <span className="text-xs text-muted-foreground">applicants</span>
            </div>
            <div className="mt-3 text-[11px] text-muted-foreground">
              {jobStats.shortlisted_count} candidates shortlisted
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="roadmap" className="w-full space-y-6">
        <TabsList className="grid grid-cols-4 max-w-xl">
          <TabsTrigger value="roadmap" className="gap-1.5 text-xs">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>AI Hiring Strategy</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="gap-1.5 text-xs">
            <Building2 className="h-4 w-4 text-blue-500" />
            <span>360° Profile & Tech</span>
          </TabsTrigger>
          <TabsTrigger value="jobs" className="gap-1.5 text-xs">
            <Briefcase className="h-4 w-4 text-emerald-500" />
            <span>Jobs ({jobs.length})</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5 text-xs">
            <History className="h-4 w-4 text-purple-500" />
            <span>Snapshots ({snapshots.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* ── Tab 1: AI Hiring Strategy & Roadmap ─────────────────────── */}
        <TabsContent value="roadmap" className="space-y-6">
          {/* AI Hiring Velocity Assessment Banner */}
          {roadmap?.hiring_velocity_assessment && (
            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-card to-background">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">
                      AI Hiring Velocity & Market Assessment
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {roadmap.hiring_velocity_assessment}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Target Talent Profiles */}
          {roadmap?.target_talent_profiles?.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" /> Recommended Target Talent Profiles
                </CardTitle>
                <CardDescription className="text-xs">
                  Target candidate archetypes and key capabilities tailored to your tech stack and
                  company growth goals.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {roadmap.target_talent_profiles.map((tp: any, i: number) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl border bg-muted/20 hover:bg-muted/30 transition-all space-y-2"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="font-bold text-sm text-foreground">{tp.role_title}</div>
                      <Badge
                        variant="outline"
                        className="text-[11px] self-start sm:self-auto font-medium"
                      >
                        Seniority: {tp.seniority}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{tp.why}</p>

                    {tp.required_skills?.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        <span className="text-[11px] font-medium text-muted-foreground">
                          Core Competencies:
                        </span>
                        {tp.required_skills.map((sk: string, j: number) => (
                          <Badge key={j} variant="secondary" className="text-[10px] px-1.5 py-0">
                            {sk}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Candidate Screening Criteria & Interview Focus */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations?.candidate_screening_criteria?.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" /> AI Candidate Screening Rubric
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Objective evaluation benchmarks for screening applicants automatically.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {recommendations.candidate_screening_criteria.map((sc: any, i: number) => (
                    <div key={i} className="p-3 rounded-lg border bg-muted/20 space-y-1 text-xs">
                      <div className="font-semibold text-foreground">{sc.category}</div>
                      <div className="text-emerald-600 dark:text-emerald-400">
                        <strong>Must Have:</strong> {sc.must_have}
                      </div>
                      {sc.good_to_have && (
                        <div className="text-muted-foreground">
                          <strong>Good to Have:</strong> {sc.good_to_have}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {recommendations?.interview_focus_areas?.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <Video className="h-4 w-4" /> Interview Focus & Evaluation Areas
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Key dimensions to test during recruiter and technical interviews.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {recommendations.interview_focus_areas.map((fa: string, i: number) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 p-2.5 rounded-lg border bg-muted/20 text-xs"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <span>{fa}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Compensation Benchmarks in NPR */}
          {roadmap?.compensation_benchmarks_npr?.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" /> Nepal Market Salary Benchmarks
                  (NPR)
                </CardTitle>
                <CardDescription className="text-xs">
                  Market-competitive salary bands to attract top talent in the Kathmandu & Nepal
                  ecosystem.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {roadmap.compensation_benchmarks_npr.map((cb: any, i: number) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-xl border bg-muted/20 space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-foreground">{cb.role}</span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {cb.market_trend || "Market Standard"}
                        </Badge>
                      </div>
                      <div className="text-sm font-semibold text-primary">
                        {cb.min_salary} — {cb.max_salary}{" "}
                        <span className="text-xs font-normal text-muted-foreground">/ month</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recruitment Strategy & Employer Branding */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations?.recruitment_strategy?.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" /> Recruitment Strategy
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {recommendations.recruitment_strategy.map((st: string, i: number) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg border bg-muted/20 text-xs flex items-start gap-2"
                    >
                      <span className="font-bold text-primary">{i + 1}.</span>
                      <span className="text-muted-foreground">{st}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {recommendations?.employer_branding_suggestions?.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <HeartHandshake className="h-4 w-4 text-primary" /> Employer Branding Advice
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {recommendations.employer_branding_suggestions.map((eb: string, i: number) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg border bg-muted/20 text-xs flex items-start gap-2"
                    >
                      <span className="font-bold text-primary">{i + 1}.</span>
                      <span className="text-muted-foreground">{eb}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ── Tab 2: 360° Company Profile & Tech ──────────────────────── */}
        <TabsContent value="profile" className="space-y-6">
          {/* Overview Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" /> Company Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg border bg-muted/20">
                  <div className="text-[11px] text-muted-foreground">Industry</div>
                  <div className="font-semibold text-sm mt-0.5">
                    {company?.industry || "Not specified"}
                  </div>
                </div>
                <div className="p-3 rounded-lg border bg-muted/20">
                  <div className="text-[11px] text-muted-foreground">Location</div>
                  <div className="font-semibold text-sm mt-0.5">
                    {company?.headquarters || company?.location || "Kathmandu, Nepal"}
                  </div>
                </div>
                <div className="p-3 rounded-lg border bg-muted/20">
                  <div className="text-[11px] text-muted-foreground">Company Size</div>
                  <div className="font-semibold text-sm mt-0.5">
                    {company?.size || "Not specified"}
                  </div>
                </div>
              </div>

              {company?.description && (
                <div className="p-3.5 rounded-lg border bg-muted/20 leading-relaxed text-muted-foreground">
                  <strong className="text-foreground block mb-1">About Company:</strong>
                  {company.description}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Technologies Stack & Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-primary" /> Technologies & Tools Stack (
                  {technologies.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!technologies.length ? (
                  <div className="p-4 text-center text-xs text-muted-foreground border rounded-lg">
                    No technologies listed. Update your company profile to enrich AI candidate
                    matching.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {technologies.map((t, i) => (
                      <Badge key={i} variant="secondary" className="text-xs px-2.5 py-1">
                        {t}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" /> Benefits & Perks ({benefits.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!benefits.length ? (
                  <div className="p-4 text-center text-xs text-muted-foreground border rounded-lg">
                    No benefits listed.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {benefits.map((b, i) => (
                      <Badge key={i} variant="outline" className="text-xs px-2.5 py-1">
                        {b}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Culture & Work Model */}
          {cultureHighlights.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <HeartHandshake className="h-4 w-4 text-primary" /> Culture & Mission
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {cultureHighlights.map((c, i) => (
                  <div key={i} className="p-3 rounded-lg border bg-muted/20 text-xs">
                    {c}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Tab 3: Job Postings & Talent Pipeline ───────────────────── */}
        <TabsContent value="jobs" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-primary" /> Job Postings & Candidate Pipeline
                    ({jobs.length})
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Active, draft, and closed positions posted under your company.
                  </CardDescription>
                </div>
                <Button asChild size="sm" className="h-8 text-xs gap-1">
                  <Link to="/employer/jobs/new" search={{ companyId: company?.id }}>
                    <Plus className="h-3.5 w-3.5" /> New Job
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {!jobs.length ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No job postings created yet.
                </div>
              ) : (
                <div className="divide-y">
                  {jobs.map((job: any) => (
                    <div
                      key={job.id}
                      className="p-4 hover:bg-muted/30 transition-all flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{job.title}</span>
                          <Badge
                            variant={job.status === "active" ? "default" : "outline"}
                            className="text-[10px] uppercase px-1.5 py-0"
                          >
                            {job.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3 flex-wrap">
                          <span>{job.applications_count || 0} applicants</span>
                          <span>·</span>
                          <span>Posted {new Date(job.created_at).toLocaleDateString()}</span>
                        </div>
                        {job.required_skills?.length > 0 && (
                          <div className="flex items-center gap-1 mt-2 flex-wrap">
                            {job.required_skills.slice(0, 4).map((sk: string, i: number) => (
                              <Badge key={i} variant="secondary" className="text-[10px]">
                                {sk}
                              </Badge>
                            ))}
                            {job.required_skills.length > 4 && (
                              <Badge variant="secondary" className="text-[10px]">
                                +{job.required_skills.length - 4}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>

                      <Button asChild variant="outline" size="sm" className="h-8 text-xs shrink-0">
                        <Link to="/employer/jobs/$jobId" params={{ jobId: job.id }}>
                          View Details
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 4: Snapshots & Audit Timeline ───────────────────────── */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4 text-primary" /> Company Intelligence Snapshots & Audit
                Timeline
              </CardTitle>
              <CardDescription className="text-xs">
                Permanent versioned progression tracking company updates, hiring roadmap updates,
                and talent acquisition milestones.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!snapshots.length ? (
                <div className="p-8 text-center text-xs text-muted-foreground border rounded-lg">
                  No snapshots recorded yet. Click "Re-sync Intelligence" above to capture your
                  baseline snapshot.
                </div>
              ) : (
                <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                  {snapshots.map((snap: any, idx: number) => {
                    const dateFormatted = new Date(snap.created_at).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <div key={snap.id} className="relative">
                        <div className="absolute -left-6 top-1 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                        <div className="rounded-xl border p-3.5 bg-muted/20 space-y-2">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px] font-bold">
                                Version {snap.version_number}
                              </Badge>
                              <span className="font-semibold text-xs text-foreground uppercase tracking-wide">
                                {snap.snapshot_type?.replace(/_/g, " ")}
                              </span>
                              {idx === 0 && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                  Current Active
                                </Badge>
                              )}
                            </div>
                            <span className="text-[11px] text-muted-foreground">
                              {dateFormatted}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                            <div className="p-2 rounded-lg bg-background/50 border text-xs">
                              <span className="text-muted-foreground text-[10px] block">
                                Hiring Readiness
                              </span>
                              <span className="font-bold">{snap.hiring_readiness_score}/100</span>
                            </div>
                            <div className="p-2 rounded-lg bg-background/50 border text-xs">
                              <span className="text-muted-foreground text-[10px] block">
                                Completeness
                              </span>
                              <span className="font-bold">{snap.profile_completeness}%</span>
                            </div>
                            <div className="p-2 rounded-lg bg-background/50 border text-xs">
                              <span className="text-muted-foreground text-[10px] block">
                                Active Jobs
                              </span>
                              <span className="font-bold">
                                {snap.job_stats?.active_jobs ?? snap.job_stats?.total_jobs ?? 0}
                              </span>
                            </div>
                            <div className="p-2 rounded-lg bg-background/50 border text-xs">
                              <span className="text-muted-foreground text-[10px] block">
                                Applicants
                              </span>
                              <span className="font-bold">
                                {snap.job_stats?.total_applicants ?? 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
