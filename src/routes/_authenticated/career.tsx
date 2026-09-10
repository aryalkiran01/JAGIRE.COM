/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  TrendingUp,
  Sparkles,
  Loader as Loader2,
  ScanText,
  Github,
  Linkedin,
  Briefcase,
  GraduationCap,
  Award,
  CheckCircle2,
  AlertCircle,
  History,
  RefreshCw,
  FolderGit2,
  ExternalLink,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  UserCheck,
  Zap,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import {
  getUserCareerIntelligence,
  syncCareerIntelligence,
  updatePreferredName,
} from "@/lib/career-intelligence.server";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/career")({ component: CareerPage });

function getReadinessTier(score: number) {
  if (score >= 80)
    return {
      label: "Market Ready",
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    };
  if (score >= 65)
    return {
      label: "Competitive",
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
    };
  if (score >= 45)
    return {
      label: "Developing",
      color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
    };
  return { label: "Emerging", color: "bg-muted text-muted-foreground border-border" };
}

function CareerPage() {
  const qc = useQueryClient();
  const fetchCI = useServerFn(getUserCareerIntelligence);
  const syncCI = useServerFn(syncCareerIntelligence);
  const saveName = useServerFn(updatePreferredName);

  const [isSyncing, setIsSyncing] = useState(false);
  const [preferredNameInput, setPreferredNameInput] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["user-career-intelligence"],
    queryFn: async () => {
      return await fetchCI();
    },
  });

  const intelligence = data?.intelligence;
  const snapshots = data?.snapshots || [];

  const candidateName = intelligence?.candidate_name || "";
  const readinessScore = intelligence?.career_readiness_score ?? 0;
  const profileCompleteness = intelligence?.profile_completeness ?? 0;
  const atsScore = intelligence?.ats_score;
  const scoreChange = (snapshots[0] as any)?.score_change ?? (intelligence as any)?.score_change;
  const readinessTier = getReadinessTier(readinessScore);

  const roadmap = intelligence?.ai_career_roadmap as any;
  const recommendations = intelligence?.ai_recommendations as any;
  const githubData = intelligence?.github_data as any;
  const linkedinData = intelligence?.linkedin_data as any;
  const resumeSummary = (intelligence?.resume_summary as any) || {};
  const skills = (intelligence?.skills || []) as string[];
  const projects = (intelligence?.projects || []) as any[];
  const experience = (intelligence?.experience || []) as any[];
  const education = (intelligence?.education || []) as any[];
  const appStats = (intelligence?.application_stats as any) || {
    total_applied: 0,
    interview_count: 0,
    offer_count: 0,
  };

  async function handleSync() {
    setIsSyncing(true);
    try {
      await syncCI();
      await qc.invalidateQueries({ queryKey: ["user-career-intelligence"] });
      toast.success("Career intelligence synchronized successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to sync career intelligence");
    } finally {
      setIsSyncing(false);
    }
  }

  async function handleSavePreferredName(e: React.FormEvent) {
    e.preventDefault();
    if (!preferredNameInput.trim()) return;
    setIsSavingName(true);
    try {
      await saveName({ data: { preferredName: preferredNameInput.trim() } });
      await qc.invalidateQueries({ queryKey: ["user-career-intelligence"] });
      toast.success(`Preferred name updated to "${preferredNameInput.trim()}"`);
      setPreferredNameInput("");
    } catch (err: any) {
      toast.error(err.message || "Failed to save preferred name");
    } finally {
      setIsSavingName(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-7 w-7 text-primary" />
            <h1 className="text-3xl font-bold">360° Career Intelligence & Roadmap</h1>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Unified candidate profile combining resume ATS scans, GitHub, LinkedIn, skills, and AI
            career guidance.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={isSyncing || isLoading}
            className="gap-1.5 text-xs h-9"
          >
            {isSyncing ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <RefreshCw className="h-4 w-4 text-primary" />
            )}
            <span>{isSyncing ? "Syncing 360° Data…" : "Re-sync Career Intelligence"}</span>
          </Button>

          <Button asChild size="sm" className="gap-1.5 text-xs h-9">
            <Link to="/resume-scanner">
              <ScanText className="h-4 w-4" />
              <span>Scan New Resume</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Preferred Name Prompt Banner if missing */}
      {!candidateName && !isLoading && (
        <Card className="border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10">
          <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                <UserCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">What should we call you?</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Set your preferred name so our AI career coach and recruiters address you
                  naturally.
                </p>
              </div>
            </div>

            <form
              onSubmit={handleSavePreferredName}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <Input
                placeholder="e.g. Kiran Aryal"
                value={preferredNameInput}
                onChange={(e) => setPreferredNameInput(e.target.value)}
                className="h-9 text-xs w-full sm:w-56"
                disabled={isSavingName}
              />
              <Button
                size="sm"
                type="submit"
                disabled={isSavingName || !preferredNameInput.trim()}
                className="h-9 text-xs shrink-0"
              >
                {isSavingName ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                Save Name
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Top 360-Degree Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Career Readiness Index */}
        <Card className="border-border bg-card/70 backdrop-blur">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Career Readiness
              </span>
              <Badge className={cn("text-[10px] px-1.5 py-0 border", readinessTier.color)}>
                {readinessTier.label}
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
              <span className="text-xs text-muted-foreground">Unified 360°</span>
            </div>
            <div className="mt-3">
              <Progress value={profileCompleteness} className="h-1.5" />
            </div>
          </CardContent>
        </Card>

        {/* Metric 3: Latest ATS Resume Score */}
        <Card className="border-border bg-card/70 backdrop-blur">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Latest ATS Score
              </span>
              {scoreChange != null && (
                <div
                  className={cn(
                    "text-[10px] font-semibold flex items-center gap-0.5",
                    scoreChange > 0
                      ? "text-emerald-600"
                      : scoreChange < 0
                        ? "text-red-500"
                        : "text-muted-foreground",
                  )}
                >
                  {scoreChange > 0 ? (
                    <>
                      <ArrowUpRight className="h-3 w-3" /> +{scoreChange} pts
                    </>
                  ) : scoreChange < 0 ? (
                    <>
                      <ArrowDownRight className="h-3 w-3" /> {scoreChange} pts
                    </>
                  ) : (
                    "Baseline"
                  )}
                </div>
              )}
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-foreground">
                {atsScore != null ? atsScore : "—"}
              </span>
              <span className="text-xs text-muted-foreground">/ 100</span>
            </div>
            <div className="mt-3 text-[11px] text-muted-foreground truncate">
              {resumeSummary?.file_name
                ? `Resume: ${resumeSummary.file_name}`
                : "No resume scanned yet"}
            </div>
          </CardContent>
        </Card>

        {/* Metric 4: Job Application Momentum */}
        <Card className="border-border bg-card/70 backdrop-blur">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Applications
              </span>
              <span className="text-xs text-muted-foreground">
                {appStats.interview_count} Interviews
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-foreground">
                {appStats.total_applied}
              </span>
              <span className="text-xs text-muted-foreground">applied</span>
            </div>
            <div className="mt-3 text-[11px] text-muted-foreground">
              {appStats.offer_count > 0
                ? `${appStats.offer_count} offers received`
                : "Active job searches"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="roadmap" className="w-full space-y-6">
        <TabsList className="grid grid-cols-3 max-w-lg">
          <TabsTrigger value="roadmap" className="gap-1.5 text-xs">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>AI Roadmap</span>
          </TabsTrigger>
          <TabsTrigger value="portfolio" className="gap-1.5 text-xs">
            <Briefcase className="h-4 w-4 text-blue-500" />
            <span>360° Portfolio</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5 text-xs">
            <History className="h-4 w-4 text-purple-500" />
            <span>Snapshot History ({snapshots.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* ── Tab 1: AI Career Roadmap & Insights ─────────────────────── */}
        <TabsContent value="roadmap" className="space-y-6">
          {/* AI Market Readiness Assessment Banner */}
          {recommendations?.market_readiness_assessment && (
            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-card to-background">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">AI Market Readiness Assessment</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {recommendations.market_readiness_assessment}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Strengths and Skill Gaps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" /> Core Candidate Strengths
                </CardTitle>
                <CardDescription className="text-xs">
                  Verified high-impact capabilities from your resume, projects, and work history.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(
                    recommendations?.strengths || [
                      "Full-stack project execution",
                      "Problem-solving and technical agility",
                      "Clear ATS document structure",
                    ]
                  ).map((str: string, i: number) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-xs p-2.5 rounded-lg border bg-muted/20"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{str}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <AlertCircle className="h-4 w-4" /> Skill Gaps & Growth Opportunities
                </CardTitle>
                <CardDescription className="text-xs">
                  Skills that will elevate your market competitiveness for target roles.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    recommendations?.skill_gaps || [
                      "System Architecture",
                      "Cloud Native (GCP/AWS)",
                      "Automated CI/CD",
                    ]
                  ).map((gap: string, i: number) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="text-xs px-2.5 py-1 bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                    >
                      {gap}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommended Career Paths */}
          {recommendations?.career_paths?.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" /> Target Career Paths & Progression
                </CardTitle>
                <CardDescription className="text-xs">
                  Recommended career avenues aligned with your combined experience and technical
                  skill set.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {recommendations.career_paths.map((p: any, i: number) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl border bg-muted/20 hover:bg-muted/30 transition-all space-y-2"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="font-bold text-sm text-foreground">{p.title}</div>
                      {p.salary_range_npr && (
                        <Badge
                          variant="outline"
                          className="text-[11px] self-start sm:self-auto font-medium"
                        >
                          {p.salary_range_npr}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{p.description}</p>

                    {p.required_skills?.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        <span className="text-[11px] font-medium text-muted-foreground">
                          Key Skills:
                        </span>
                        {p.required_skills.map((sk: string, j: number) => (
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

          {/* Recommended Certifications & Action Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations?.recommended_certifications?.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Award className="h-4 w-4 text-primary" /> Industry Certifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {recommendations.recommended_certifications.map((cert: any, i: number) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg border bg-muted/20 flex items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <div className="font-semibold text-foreground">{cert.name}</div>
                        <div className="text-muted-foreground text-[11px]">{cert.provider}</div>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        Recommended
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {recommendations?.actionable_recommendations?.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" /> Actionable Next Steps
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {recommendations.actionable_recommendations.map((rec: string, i: number) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg border bg-muted/20 text-xs flex items-start gap-2"
                    >
                      <span className="font-bold text-primary">{i + 1}.</span>
                      <span className="text-muted-foreground">{rec}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ── Tab 2: 360° Portfolio & Connected Sources ──────────────── */}
        <TabsContent value="portfolio" className="space-y-6">
          {/* Linked Sources Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* GitHub Card */}
            <Card className="border-border">
              <CardContent className="p-5 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    <Github className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm">GitHub Integration</h4>
                      {githubData?.username ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px] px-1.5 py-0">
                          Connected
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          Not Linked
                        </Badge>
                      )}
                    </div>
                    {githubData?.username ? (
                      <p className="text-xs text-muted-foreground mt-1">
                        @{githubData.username} · {githubData.project_count || 0} repositories (
                        {githubData.total_stars || 0} stars)
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1">
                        Link your GitHub in your profile to automatically verify project experience
                        and tech stacks.
                      </p>
                    )}
                  </div>
                </div>
                {githubData?.profile_url && (
                  <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
                    <a href={githubData.profile_url} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* LinkedIn Card */}
            <Card className="border-border">
              <CardContent className="p-5 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                    <Linkedin className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm">LinkedIn Integration</h4>
                      {linkedinData?.profile_url ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px] px-1.5 py-0">
                          Connected
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          Not Linked
                        </Badge>
                      )}
                    </div>
                    {linkedinData?.profile_url ? (
                      <p className="text-xs text-muted-foreground mt-1 truncate max-w-xs">
                        {linkedinData.profile_url}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1">
                        Provide your LinkedIn URL or import your summary to enhance career
                        intelligence recommendations.
                      </p>
                    )}
                  </div>
                </div>
                {linkedinData?.profile_url && (
                  <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
                    <a href={linkedinData.profile_url} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Unified Combined Skills Cloud */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Award className="h-4 w-4 text-primary" /> Unified 360° Skills Cloud (
                    {skills.length})
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Combined and deduplicated across your Resume ATS Scans, GitHub projects,
                    LinkedIn profile, and candidate bio.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!skills.length ? (
                <div className="p-6 text-center text-xs text-muted-foreground border rounded-lg">
                  No skills indexed yet. Scan a resume or update your profile to enrich your career
                  intelligence.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {skills.map((sk, i) => (
                    <Badge key={i} variant="secondary" className="text-xs px-2.5 py-1">
                      {sk}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Verified Projects Grid */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FolderGit2 className="h-4 w-4 text-primary" /> Verified Projects & Repositories (
                {projects.length})
              </CardTitle>
              <CardDescription className="text-xs">
                Indexed codebases, applications, and featured portfolio projects.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!projects.length ? (
                <div className="p-6 text-center text-xs text-muted-foreground border rounded-lg">
                  No projects recorded yet. Link your GitHub account or add projects in your
                  profile.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {projects.map((proj, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-xl border bg-muted/20 hover:bg-muted/30 transition-all space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-xs text-foreground truncate">
                          {proj.name}
                        </span>
                        {proj.language && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {proj.language}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {proj.description || "Portfolio project"}
                      </p>
                      {proj.url && (
                        <div className="pt-1">
                          <a
                            href={proj.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-primary hover:underline flex items-center gap-1"
                          >
                            <span>View Project</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Work Experience & Education Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" /> Experience History (
                  {experience.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!experience.length ? (
                  <div className="p-4 text-center text-xs text-muted-foreground border rounded-lg">
                    No experience records in profile yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {experience.map((exp: any, i: number) => (
                      <div
                        key={i}
                        className="border-l-2 border-primary/40 pl-3 space-y-0.5 text-xs"
                      >
                        <div className="font-semibold text-foreground">
                          {exp.title || exp.position || "Role"}
                        </div>
                        <div className="text-muted-foreground">
                          {exp.company} ·{" "}
                          {exp.duration || `${exp.start_date || ""} - ${exp.end_date || "Present"}`}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-primary" /> Education & Credentials (
                  {education.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!education.length ? (
                  <div className="p-4 text-center text-xs text-muted-foreground border rounded-lg">
                    No education records in profile yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {education.map((edu: any, i: number) => (
                      <div
                        key={i}
                        className="border-l-2 border-primary/40 pl-3 space-y-0.5 text-xs"
                      >
                        <div className="font-semibold text-foreground">
                          {edu.degree || "Degree"}
                        </div>
                        <div className="text-muted-foreground">
                          {edu.institution || edu.school} · {edu.year || edu.graduation_year || ""}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Tab 3: Intelligence Version History Timeline ───────────── */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4 text-primary" /> Career Intelligence Snapshots & Version
                Audit
              </CardTitle>
              <CardDescription className="text-xs">
                Permanent versioned progression tracking ATS improvements, GitHub/LinkedIn sync
                events, and AI roadmap updates over time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!snapshots.length ? (
                <div className="p-8 text-center text-xs text-muted-foreground border rounded-lg">
                  No snapshots recorded yet. Click "Re-sync Career Intelligence" above to capture
                  your baseline snapshot.
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
                                Readiness
                              </span>
                              <span className="font-bold">{snap.career_readiness_score}/100</span>
                            </div>
                            <div className="p-2 rounded-lg bg-background/50 border text-xs">
                              <span className="text-muted-foreground text-[10px] block">
                                ATS Score
                              </span>
                              <span className="font-bold">
                                {snap.ats_score ? `${snap.ats_score}/100` : "—"}
                              </span>
                            </div>
                            <div className="p-2 rounded-lg bg-background/50 border text-xs">
                              <span className="text-muted-foreground text-[10px] block">
                                Completeness
                              </span>
                              <span className="font-bold">{snap.profile_completeness}%</span>
                            </div>
                            <div className="p-2 rounded-lg bg-background/50 border text-xs">
                              <span className="text-muted-foreground text-[10px] block">
                                Score Change
                              </span>
                              <span
                                className={cn(
                                  "font-bold",
                                  snap.score_change > 0
                                    ? "text-emerald-600"
                                    : snap.score_change < 0
                                      ? "text-red-500"
                                      : "text-foreground",
                                )}
                              >
                                {snap.score_change != null
                                  ? snap.score_change > 0
                                    ? `+${snap.score_change}`
                                    : snap.score_change
                                  : "Baseline"}
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
