import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Send,
  Loader2,
  Sparkles,
  Lock,
  Building2,
  Copy,
  Check,
  RotateCcw,
  AlertCircle,
  ChevronRight,
  Briefcase,
  Users,
  FileText,
  ChevronsUpDown,
} from "lucide-react";
import { getAiFeature, EMPLOYER_AI_GROUPS } from "@/lib/employer-ai-features";
import { runEmployerAiFeature } from "@/lib/employer-ai.server";
import { AiResultRenderer, CleanMarkdownView } from "@/components/ai-result-renderer";
import { useSubscription } from "@/hooks/use-subscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useMemo } from "react";
export const Route = createFileRoute("/_authenticated/employer/ai/$featureSlug")({
  head: () => ({ meta: [{ title: "AI Feature — Jagire" }] }),
  component: AiFeaturePage,
});

// ── Types ───────────────────────────────────────────────────────────────────

type Turn = {
  id: string;
  role: "user" | "assistant";
  content: string;
  structured?: Record<string, unknown>;
  ts: string;
  isError?: boolean;
};

type CompanyProfile = {
  id: string;
  name: string;
  industry?: string | null;
  headquarters?: string | null;
  location?: string | null;
  description?: string | null;
  website?: string | null;
  size?: string | null;
  founded_year?: number | null;
  active_jobs_count?: number;
  total_applications_count?: number;
  active_jobs?: Array<{ id: string; title: string; status: string }>;
};

// ── Suggested Prompts ───────────────────────────────────────────────────────

const SUGGESTED_PROMPTS: Record<string, string[]> = {
  "candidate-match": [
    "Match my applicants to our active positions",
    "Which candidates best fit our technical requirements?",
    "Find the best cultural and skillset fit among recent applicants",
  ],
  "resume-screening": [
    "Screen applicants against our job requirements",
    "Flag unqualified applicants for our open roles",
    "Review candidate resumes and highlight top matches",
  ],
  "resume-ranking": [
    "Rank my applicants for our open roles",
    "Rank these candidates from best to worst fit",
    "Order candidates by technical proficiency and relevance",
  ],
  "smart-shortlisting": [
    "Shortlist the top 3 candidates for interview",
    "Who should advance from the current applicant pool?",
    "Select candidates for the second round",
  ],
  "candidate-ranking": [
    "Compare the top candidates side-by-side",
    "Rank candidates by overall hiring suitability",
    "Evaluate candidates for team fit",
  ],
  "candidate-summary": [
    "Summarize the profile of our top applicant",
    "Give me a snapshot of the strongest candidate",
    "Create a summary for the interview panel",
  ],
  "hiring-recommendation": [
    "Should I hire this candidate for our open role?",
    "Give a hire/no-hire recommendation for the top applicant",
    "Evaluate if we should extend an offer",
  ],
  "candidate-success-prediction": [
    "Predict success likelihood for the top candidate",
    "Which applicant is most likely to succeed in this role?",
    "Assess long-term retention probability",
  ],
  "talent-search": [
    "Build a talent search and sourcing strategy for our team",
    "Suggest boolean search strings for our target skills",
    "Create a sourcing plan for niche technical skills",
  ],
  "duplicate-candidate-detection": [
    "Check my applicant pool for duplicate profiles",
    "Flag likely duplicates among recent applicants",
    "Identify redundant applications",
  ],
  "skill-gap-analysis": [
    "Analyze skill gaps in our current team",
    "What skills are missing for our next milestone?",
    "Assess team capabilities vs project requirements",
  ],
  "interview-question-generator": [
    "Generate interview questions for our open role",
    "Create behavioral questions for a candidate interview",
    "Build a technical assessment questionnaire",
  ],
  "job-description-writer": [
    "Write an engaging job description for our upcoming opening",
    "Draft a job post highlighting our company culture",
    "Create a compelling job posting with clear responsibilities",
  ],
  "job-description-optimizer": [
    "Optimize this job description for reach and inclusivity",
    "Improve my job post's applicant conversion",
    "Make this JD more attractive to qualified candidates",
  ],
  "hiring-analytics": [
    "Analyze my hiring funnel and bottlenecks",
    "Where am I losing candidates in the pipeline?",
    "Review my time-to-hire metrics and pipeline health",
  ],
  "email-assistant": [
    "Draft an interview invite email for shortlisted candidates",
    "Write a polite rejection email to a candidate",
    "Create a follow-up email template",
  ],
  "meeting-scheduler": [
    "Propose interview slots for candidates this week",
    "Format a calendar invite for a panel interview",
    "Schedule technical rounds efficiently",
  ],
  "onboarding-assistant": [
    "Build a first-week onboarding plan for a new hire",
    "Create an onboarding checklist for our new team member",
    "Design a 30-day onboarding program",
  ],
  "office-dashboard": [
    "Summarize my team's capacity and hiring needs",
    "What HR actions should I prioritize this month?",
    "Review team performance metrics",
  ],
  "recruitment-automation": [
    "What recruiting tasks can I automate?",
    "Recommend automation for my screening workflow",
    "Identify manual processes to streamline",
  ],
  "workflow-builder": [
    "Design an efficient hiring workflow for our team",
    "Build a 4-stage interview workflow with SLAs",
    "Create an efficient candidate approval process",
  ],
  "predictive-hiring-analytics": [
    "Forecast time-to-fill for my open roles",
    "Predict offer acceptance likelihood for top candidates",
    "Analyze hiring trends and candidate velocity",
  ],
  "workforce-planning": [
    "Propose a headcount plan for next quarter",
    "What roles should I prioritize hiring for?",
    "Create a 12-month hiring roadmap",
  ],
  "private-ai-models": [
    "Recommend a private model strategy for my company",
    "How should we host and govern private AI models?",
    "Evaluate AI deployment options",
  ],
  "company-knowledge-ai": [
    "Answer questions using our company knowledge base",
    "Summarize our internal hiring playbook",
    "Extract insights from company documents",
  ],
  "talent-intelligence": [
    "Assess our bench strength across teams",
    "Where are our talent coverage risks?",
    "Analyze organizational skill distribution",
  ],
  "white-label-assistant": [
    "How do I configure a white-label AI assistant?",
    "Recommend a branded assistant for our HR team",
    "Customize AI for our company culture",
  ],
  "dedicated-ai-success-manager": [
    "Propose an AI rollout plan for our company",
    "What milestones should we track for AI adoption?",
    "Create an AI training program",
  ],
};

// ── Component ───────────────────────────────────────────────────────────────

function AiFeaturePage() {
  const { featureSlug } = Route.useParams();
  const { data: subscription, isLoading: isSubscriptionLoading } = useSubscription();
  const feature = getAiFeature(featureSlug);
  const run = useServerFn(runEmployerAiFeature);
  const queryClient = useQueryClient();

  const [input, setInput] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isPremium = subscription?.isPremium ?? false;

  // Fetch all companies for the user
  const { data: companiesList = [], isLoading: isCompaniesLoading } = useQuery({
    queryKey: ["user-companies"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return [];

      const { data: companies, error } = await supabase
        .from("companies")
        .select("id, name, industry, headquarters, location, description, website, size, founded_year")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Companies fetch error:", error);
        return [];
      }

      return companies || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Effective selected company ID (fallback to first company)
  const activeCompanyId =
    selectedCompanyId || (companiesList && companiesList.length > 0 ? companiesList[0].id : null);

  // Fetch company profile with stats for selected company
  const { data: companyProfile, isLoading: isCompanyLoading } = useQuery({
    queryKey: ["company-profile", activeCompanyId],
    enabled: !!activeCompanyId,
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !activeCompanyId) return null;

      // Get specific company
      const { data: company, error: companyError } = await supabase
        .from("companies")
        .select("id, name, industry, headquarters, location, description, website, size, founded_year")
        .eq("id", activeCompanyId)
        .eq("owner_id", user.id)
        .maybeSingle();

      if (companyError || !company) {
        console.error("Company query error:", companyError);
        return null;
      }

      // Get jobs for this company
      const { data: jobs, error: jobsError } = await supabase
        .from("jobs")
        .select("id, title, status")
        .eq("company_id", company.id);

      const activeJobsList =
        jobs?.filter((j) => j.status === "active" || j.status === "published") || [];
      const activeJobsCount = activeJobsList.length;
      let totalApplicationsCount = 0;

      if (jobs && jobs.length > 0) {
        const jobIds = jobs.map((job) => job.id);

        const { count, error: applicationsError } = await supabase
          .from("applications")
          .select("id", { count: "exact", head: true })
          .in("job_id", jobIds);

        if (!applicationsError) {
          totalApplicationsCount = count || 0;
        }
      }

      return {
        ...company,
        active_jobs: activeJobsList,
        active_jobs_count: activeJobsCount,
        total_applications_count: totalApplicationsCount,
      } as CompanyProfile;
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const hasCompany = !!companyProfile;

  // Personalized dynamic suggestions
  const suggestions = useMemo(() => {
    const defaultList = SUGGESTED_PROMPTS[featureSlug] ?? [];
    if (!companyProfile) return defaultList;

    const activeJobTitle = companyProfile.active_jobs?.[0]?.title;
    if (!activeJobTitle) return defaultList;

    return defaultList.map((q) => {
      return q
        .replace(/our active positions|our open roles|our open positions/gi, `the ${activeJobTitle} role`)
        .replace(/for a candidate interview/gi, `for ${activeJobTitle} candidates`);
    });
  }, [featureSlug, companyProfile]);

  // Scroll to bottom when turns change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns]);

  // Focus textarea on mount and feature change
  useEffect(() => {
    textareaRef.current?.focus();
  }, [featureSlug]);

  const ask = useMutation({
    mutationFn: async (message: string) => {
      return run({
        data: {
          featureSlug,
          message,
          companyId: activeCompanyId, // Pass active company ID
        },
      });
    },
    onMutate: (message) => {
      const userTurn: Turn = {
        id: crypto.randomUUID(),
        role: "user",
        content: message,
        ts: new Date().toISOString(),
      };
      setTurns((prev) => [...prev, userTurn]);
      setInput("");
    },
    onSuccess: (res) => {
      const assistantTurn: Turn = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: typeof res.response === "string" ? res.response : "",
        structured:
          typeof res.response === "object" && res.response !== null
            ? (res.response as Record<string, unknown>)
            : res.structured,
        ts: new Date().toISOString(),
      };
      setTurns((prev) => [...prev, assistantTurn]);

      queryClient.invalidateQueries({ queryKey: ["ai-usage"] });
    },
    onError: (e: unknown) => {
      const errorTurn: Turn = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: e instanceof Error ? e.message : "AI request failed. Please try again.",
        ts: new Date().toISOString(),
        isError: true,
      };
      setTurns((prev) => [...prev, errorTurn]);
      toast.error(e instanceof Error ? e.message : "AI request failed");
    },
  });

  const send = useCallback(() => {
    const q = input.trim();
    if (!q || ask.isPending || !isPremium || !hasCompany) return;
    ask.mutate(q);
  }, [input, ask.isPending, isPremium, hasCompany, ask]);

  const handleSuggestionClick = useCallback(
    (q: string) => {
      setInput(q);
      if (isPremium && hasCompany) {
        ask.mutate(q);
      }
    },
    [isPremium, hasCompany, ask],
  );

  const handleCopyResult = useCallback(async (turn: Turn) => {
    try {
      const content = turn.content || JSON.stringify(turn.structured, null, 2);
      await navigator.clipboard.writeText(content);
      setCopiedId(turn.id);
      setTimeout(() => setCopiedId(null), 2000);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  }, []);

  const handleClearConversation = useCallback(() => {
    setTurns([]);
    setInput("");
    textareaRef.current?.focus();
    toast.success("Conversation cleared");
  }, []);

  const handleCompanySwitch = useCallback((companyId: string) => {
    setSelectedCompanyId(companyId);
    setTurns([]); // Clear conversation when switching companies
    setInput("");
    toast.success("Company switched successfully");
  }, []);

  // If feature not found
  if (!feature) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-lg">
        <Card className="shadow-xl">
          <CardContent className="p-10 text-center">
            <div className="mb-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-2">Feature Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The AI feature you're looking for doesn't exist or has been moved.
            </p>
            <Button asChild variant="outline">
              <Link to="/employer">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isLoading = ask.isPending;
  const isDisabled = !isPremium || !hasCompany || isLoading;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 shrink-0 shadow-md">
            <feature.icon className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold truncate">{feature.title}</h1>
            <p className="text-sm text-muted-foreground truncate">{feature.description}</p>
          </div>
        </div>

        {turns.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearConversation}
            className="shrink-0"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear Chat
          </Button>
        )}
      </div>

      {/* Company Setup Banner */}
      {!hasCompany && !isCompanyLoading && !isCompaniesLoading && (
        <div className="rounded-xl border-2 border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950 p-4 mb-4 flex items-center justify-between gap-3 flex-wrap shadow-md">
          <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-300">
            <Building2 className="h-4 w-4 shrink-0" />
            <span>
              <strong>Set up your company profile</strong> to unlock AI features and get
              personalized insights.
            </span>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link to="/employer/company">
              Set Up Company
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      )}

      {/* Premium Banner */}
      {!isPremium && !isSubscriptionLoading && hasCompany && (
        <div className="rounded-xl border-2 border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950 p-4 mb-4 flex items-center justify-between gap-3 flex-wrap shadow-md">
          <div className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-300">
            <Lock className="h-4 w-4 shrink-0" />
            <span>
              <strong>Premium Feature</strong> — Upgrade your plan to unlock{" "}
              {feature.title.toLowerCase()}.
            </span>
          </div>
          <Button asChild size="sm" className="gradient-brand text-primary-foreground shadow-md">
            <Link to="/pricing">
              Upgrade Now
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="space-y-3">
          {/* Company Stats with Switcher */}
          {hasCompany && companyProfile && (
            <Card className="shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold">Company Overview</div>

                  {/* Company Switcher Dropdown */}
                  {companiesList && companiesList.length > 1 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
                          <Building2 className="h-3.5 w-3.5" />
                          Switch
                          <ChevronsUpDown className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Your Companies</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {companiesList.map((company) => (
                          <DropdownMenuItem
                            key={company.id}
                            onClick={() => handleCompanySwitch(company.id)}
                            className="cursor-pointer"
                          >
                            <div className="flex items-center gap-2 w-full">
                              <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{company.name}</div>
                                {company.industry && (
                                  <div className="text-xs text-muted-foreground truncate">
                                    {company.industry}
                                  </div>
                                )}
                              </div>
                              {company.id === companyProfile.id && (
                                <Check className="h-4 w-4 text-primary shrink-0" />
                              )}
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium">{companyProfile.name}</span>
                  </div>
                  {companyProfile.industry && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Briefcase className="h-3.5 w-3.5" />
                      <span>{companyProfile.industry}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <FileText className="h-3.5 w-3.5" />
                    <span>{companyProfile.active_jobs_count} active jobs</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    <span>{companyProfile.total_applications_count} applications</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Suggested Prompts */}
          {suggestions.length > 0 && (
            <Card className="shadow-md">
              <CardContent className="p-4 space-y-1">
                <div className="text-sm font-semibold flex items-center gap-1.5 mb-2">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Try These
                </div>
                {suggestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSuggestionClick(q)}
                    disabled={isDisabled}
                    className="w-full text-left text-xs px-3 py-2 rounded-md hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {q}
                  </button>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Other AI Features */}
          <Card className="shadow-md">
            <CardContent className="p-4">
              <div className="text-sm font-semibold mb-2">Other AI Features</div>
              <div className="space-y-1 max-h-72 overflow-y-auto">
                {EMPLOYER_AI_GROUPS.flatMap((g) => g.items)
                  .filter((f) => f.slug !== featureSlug)
                  .map((f) => (
                    <Link
                      key={f.slug}
                      to="/employer/ai/$featureSlug"
                      params={{ featureSlug: f.slug }}
                      className="flex items-center gap-2 text-left text-xs px-2 py-1.5 rounded-md hover:bg-muted transition-colors"
                    >
                      <f.icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate flex-1">{f.title}</span>
                    </Link>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Chat Area */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          <Card className="flex-1 shadow-lg">
            <CardContent className="p-4 min-h-[400px] max-h-[60vh] overflow-y-auto space-y-4">
              {/* Empty State */}
              {turns.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center py-12 text-muted-foreground">
                  <div className="mb-5 animate-ai-float">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 shadow-lg">
                      <feature.icon className="h-10 w-10 text-primary" />
                    </div>
                  </div>
                  <h2 className="text-lg font-semibold mb-2">How can I help your hiring?</h2>
                  <p className="text-sm max-w-xs">
                    Describe what you need and {feature.title} will analyze your company data and
                    respond with actionable results.
                  </p>
                  {!hasCompany && !isCompanyLoading && (
                    <Button asChild size="sm" variant="outline" className="mt-4">
                      <Link to="/employer/company">
                        <Building2 className="h-4 w-4 mr-2" />
                        Set Up Company Profile
                      </Link>
                    </Button>
                  )}
                </div>
              )}

              {/* Chat Messages */}
              {turns.map((turn) => (
                <div
                  key={turn.id}
                  className={turn.role === "user" ? "flex justify-end" : "flex justify-start"}
                >
                  {turn.role === "user" ? (
                    <div className="rounded-2xl rounded-br-sm bg-primary text-primary-foreground px-4 py-2 max-w-[85%] text-sm whitespace-pre-wrap shadow-md">
                      {turn.content}
                    </div>
                  ) : (
                    <div className="max-w-[95%] w-full group relative">
                      {turn.isError ? (
                        <div className="rounded-2xl rounded-bl-sm bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive shadow-md">
                          <div className="flex items-center gap-2 mb-1">
                            <AlertCircle className="h-4 w-4" />
                            <span className="font-semibold">Error</span>
                          </div>
                          {turn.content}
                        </div>
                      ) : turn.structured && Object.keys(turn.structured).length > 0 ? (
                        <div className="relative">
                          <AiResultRenderer data={turn.structured} />
                          <button
                            onClick={() => handleCopyResult(turn)}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md bg-background/80 hover:bg-background shadow-sm"
                            title="Copy result"
                          >
                            {copiedId === turn.id ? (
                              <Check className="h-3.5 w-3.5 text-green-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          <div className="rounded-2xl rounded-bl-sm bg-muted px-4 py-3 text-sm shadow-md">
                            <CleanMarkdownView text={turn.content} />
                          </div>
                          <button
                            onClick={() => handleCopyResult(turn)}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md bg-background/80 hover:bg-background shadow-sm"
                            title="Copy result"
                          >
                            {copiedId === turn.id ? (
                              <Check className="h-3.5 w-3.5 text-green-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Loading Indicator */}
              {isLoading && (
                <div className="flex items-center gap-3 text-muted-foreground text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{feature.title} is analyzing your company data...</span>
                </div>
              )}

              <div ref={bottomRef} />
            </CardContent>
          </Card>

          {/* Input Area */}
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              rows={2}
              className="resize-none shadow-md"
              placeholder={
                !hasCompany
                  ? "Set up your company profile first..."
                  : !isPremium
                    ? "Upgrade to Premium to use AI features..."
                    : `Ask ${feature.title} anything...`
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              disabled={isDisabled}
              maxLength={6000}
            />
            <Button
              onClick={send}
              disabled={!input.trim() || isDisabled}
              className="gradient-brand text-primary-foreground h-auto shadow-md"
              title="Send (Enter)"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Press <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Enter</kbd> to send,{" "}
              <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Shift+Enter</kbd> for new
              line
            </span>
            <span>{input.length}/6000</span>
          </div>
        </div>
      </div>
    </div>
  );
}
