import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
  Copy,
  Check,
  RotateCcw,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { getJobSeekerAiFeature, JOBSEEKER_AI_GROUPS } from "@/lib/jobseeker-ai-features";
import { runJobSeekerAiFeature } from "@/lib/jobseeker-ai.server";
import { AiResultRenderer } from "@/components/ai-result-renderer";
import { useSubscription } from "@/hooks/use-subscription";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/ai/$featureSlug")({
  head: () => ({ meta: [{ title: "AI Feature — Jagire" }] }),
  component: JobSeekerAiFeaturePage,
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

// ── Suggested Prompts ───────────────────────────────────────────────────────

const SUGGESTED_PROMPTS: Record<string, string[]> = {
  "cover-letter-generator": [
    "Write a cover letter for a Senior React Developer position",
    "Generate a cover letter for a product manager role at a startup",
    "Create a cover letter highlighting my leadership experience",
  ],
  "resume-optimizer": [
    "Optimize my experience section for ATS",
    "Improve my resume summary and skills section",
    "Rewrite my resume for a senior role application",
  ],
  "linkedin-optimizer": [
    "Improve my LinkedIn headline and about section",
    "What skills should I add to my LinkedIn profile?",
    "Optimize my LinkedIn for recruiter searches",
  ],
  "personal-brand": [
    "Help me build my personal brand as a frontend developer",
    "Create an elevator pitch for a data scientist",
    "Develop a professional online presence strategy",
  ],
  "bio-generator": [
    "Generate a professional bio for my portfolio",
    "Write a short bio for a conference speaker introduction",
    "Create a bio for my GitHub profile",
  ],
  "job-match-analyzer": [
    "How well do I match the active jobs on this platform?",
    "Which open roles am I the best fit for?",
    "Compare my skills against current job openings",
  ],
  "job-search-strategy": [
    "Build a job search strategy for a senior backend role",
    "Create a weekly job search action plan",
    "Develop a networking strategy for job hunting",
  ],
  "salary-analyzer": [
    "What is my market value as a React developer in Nepal?",
    "Help me prepare a salary negotiation script",
    "Analyze salary trends for my role",
  ],
  "offer-evaluator": [
    "Evaluate this job offer: 80k NPR/month, remote, with health insurance",
    "Should I accept this offer or negotiate?",
    "Compare two job offers I received",
  ],
  "relocation-advisor": [
    "Should I relocate from Kathmandu to Bangalore for a tech job?",
    "Compare cost of living: Kathmandu vs remote",
    "Evaluate relocating to Singapore for a job",
  ],
  "interview-prep": [
    "Prepare me for a Senior Frontend Developer interview",
    "What behavioral questions should I expect for a PM role?",
    "Create a preparation checklist for my interview",
  ],
  "mock-interview-feedback": [
    "I answered 'Tell me about yourself' with: I'm a developer with 3 years experience. Give feedback",
    "Rate my answer: Why do you want this job? — I need a change and this looks interesting",
    "Review my response to a technical question",
  ],
  "behavioral-question-prep": [
    "Build STAR stories for 'Tell me about a time you faced a conflict'",
    "Prepare STAR stories for leadership and teamwork questions",
    "Create stories for failure and learning experiences",
  ],
  "technical-interview-prep": [
    "Prepare me for a React technical interview",
    "What topics should I review for a Python backend interview?",
    "Create a study plan for system design questions",
  ],
  "skill-roadmap": [
    "Build a skill roadmap to become a full-stack developer",
    "What skills do I need to reach senior level?",
    "Create a learning path for cloud architecture",
  ],
  "career-transition-planner": [
    "I want to transition from QA to DevOps. Plan it for me",
    "Help me move from marketing to product management",
    "Plan my transition to data science",
  ],
  "mentorship-matcher": [
    "What kind of mentor should I look for as a mid-level developer?",
    "Help me write an outreach message to a potential mentor",
    "How to build a mentorship relationship",
  ],
  "goal-planner": [
    "Set career goals for the next 12 months",
    "Help me plan quarterly career priorities",
    "Create SMART goals for skill development",
  ],
  "course-recommender": [
    "Recommend courses to improve my React and TypeScript skills",
    "What courses should I take to learn cloud computing?",
    "Build a learning path for machine learning",
  ],
  "certification-advisor": [
    "Which certifications should I pursue as a cloud engineer?",
    "Are AWS certifications worth it for my career path?",
    "Compare project management certifications",
  ],
  "project-idea-generator": [
    "Suggest portfolio projects for a frontend developer",
    "Generate project ideas that demonstrate full-stack skills",
    "What projects impress hiring managers?",
  ],
  "portfolio-optimizer": [
    "How can I improve my developer portfolio?",
    "What projects should I add to my portfolio?",
    "Optimize my portfolio for freelance work",
  ],
};

// ── Component ───────────────────────────────────────────────────────────────

function JobSeekerAiFeaturePage() {
  const { featureSlug } = Route.useParams();
  const { data: subscription, isLoading: isSubscriptionLoading } = useSubscription();
  const feature = getJobSeekerAiFeature(featureSlug);
  const run = useServerFn(runJobSeekerAiFeature);
  const queryClient = useQueryClient();

  const [input, setInput] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isPremium = subscription?.isPremium ?? false;

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
      return run({ data: { featureSlug, message } });
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

      // Invalidate AI usage query if it exists
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
    if (!q || ask.isPending || !isPremium) return;
    ask.mutate(q);
  }, [input, ask.isPending, isPremium, ask]);

  const handleSuggestionClick = useCallback(
    (q: string) => {
      setInput(q);
      if (isPremium) {
        ask.mutate(q);
      }
    },
    [isPremium, ask],
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
              <Link to="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const suggestions = SUGGESTED_PROMPTS[featureSlug] ?? [];
  const isLoading = ask.isPending;

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

      {/* Premium Banner */}
      {!isPremium && !isSubscriptionLoading && (
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
                    disabled={!isPremium || isLoading}
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
                {JOBSEEKER_AI_GROUPS.flatMap((g) => g.items)
                  .filter((f) => f.slug !== featureSlug)
                  .map((f) => (
                    <Link
                      key={f.slug}
                      to="/ai/$featureSlug"
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
                  <h2 className="text-lg font-semibold mb-2">How can I help you?</h2>
                  <p className="text-sm max-w-xs">
                    Describe what you need and {feature.title} will analyze your profile and respond
                    with actionable results.
                  </p>
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
                          <div className="rounded-2xl rounded-bl-sm bg-muted px-4 py-2 text-sm whitespace-pre-wrap shadow-md">
                            {turn.content}
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
                  <span>{feature.title} is analyzing your request...</span>
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
              placeholder={`Ask ${feature.title} anything...`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              disabled={isLoading || !isPremium}
              maxLength={6000}
            />
            <Button
              onClick={send}
              disabled={!input.trim() || isLoading || !isPremium}
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
