import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, Loader as Loader2, Sparkles, Lock } from "lucide-react";
import { getJobSeekerAiFeature, JOBSEEKER_AI_GROUPS } from "@/lib/jobseeker-ai-features";
import { runJobSeekerAiFeature } from "@/lib/jobseeker-ai.server";
import { AiResultRenderer } from "@/components/ai-result-renderer";
import { useSubscription } from "@/hooks/use-subscription";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/ai/$featureSlug")({
  head: () => ({ meta: [{ title: "AI Feature — Jagire" }] }),
  component: JobSeekerAiFeaturePage,
});

type Turn = {
  role: "user" | "assistant";
  content: string;
  structured?: Record<string, unknown>;
  ts: string;
};

const SUGGESTED_PROMPTS: Record<string, string[]> = {
  "cover-letter-generator": [
    "Write a cover letter for a Senior React Developer position",
    "Generate a cover letter for a product manager role at a startup",
  ],
  "resume-optimizer": [
    "Optimize my experience section for ATS",
    "Improve my resume summary and skills section",
  ],
  "linkedin-optimizer": [
    "Improve my LinkedIn headline and about section",
    "What skills should I add to my LinkedIn profile?",
  ],
  "personal-brand": [
    "Help me build my personal brand as a frontend developer",
    "Create an elevator pitch for a data scientist",
  ],
  "bio-generator": [
    "Generate a professional bio for my portfolio",
    "Write a short bio for a conference speaker introduction",
  ],
  "job-match-analyzer": [
    "How well do I match the active jobs on this platform?",
    "Which open roles am I the best fit for?",
  ],
  "job-search-strategy": [
    "Build a job search strategy for a senior backend role",
    "Create a weekly job search action plan",
  ],
  "salary-analyzer": [
    "What is my market value as a React developer in Nepal?",
    "Help me prepare a salary negotiation script",
  ],
  "offer-evaluator": [
    "Evaluate this job offer: 80k NPR/month, remote, with health insurance",
    "Should I accept this offer or negotiate?",
  ],
  "relocation-advisor": [
    "Should I relocate from Kathmandu to Bangalore for a tech job?",
    "Compare cost of living: Kathmandu vs remote",
  ],
  "interview-prep": [
    "Prepare me for a Senior Frontend Developer interview",
    "What behavioral questions should I expect for a PM role?",
  ],
  "mock-interview-feedback": [
    "I answered 'Tell me about yourself' with: I'm a developer with 3 years experience. Give feedback",
    "Rate my answer: Why do you want this job? — I need a change and this looks interesting",
  ],
  "behavioral-question-prep": [
    "Build STAR stories for 'Tell me about a time you faced a conflict'",
    "Prepare STAR stories for leadership and teamwork questions",
  ],
  "technical-interview-prep": [
    "Prepare me for a React technical interview",
    "What topics should I review for a Python backend interview?",
  ],
  "skill-roadmap": [
    "Build a skill roadmap to become a full-stack developer",
    "What skills do I need to reach senior level?",
  ],
  "career-transition-planner": [
    "I want to transition from QA to DevOps. Plan it for me",
    "Help me move from marketing to product management",
  ],
  "mentorship-matcher": [
    "What kind of mentor should I look for as a mid-level developer?",
    "Help me write an outreach message to a potential mentor",
  ],
  "goal-planner": [
    "Set career goals for the next 12 months",
    "Help me plan quarterly career priorities",
  ],
  "course-recommender": [
    "Recommend courses to improve my React and TypeScript skills",
    "What courses should I take to learn cloud computing?",
  ],
  "certification-advisor": [
    "Which certifications should I pursue as a cloud engineer?",
    "Are AWS certifications worth it for my career path?",
  ],
  "project-idea-generator": [
    "Suggest portfolio projects for a frontend developer",
    "Generate project ideas that demonstrate full-stack skills",
  ],
  "portfolio-optimizer": [
    "How can I improve my developer portfolio?",
    "What projects should I add to my portfolio?",
  ],
};

function JobSeekerAiFeaturePage() {
  const { featureSlug } = Route.useParams();
  const { data: subscription } = useSubscription();
  const feature = getJobSeekerAiFeature(featureSlug);
  const run = useServerFn(runJobSeekerAiFeature);
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const ask = useMutation({
    mutationFn: async (message: string) => run({ data: { featureSlug, message } }),
    onMutate: (message) => {
      setTurns((prev) => [
        ...prev,
        { role: "user", content: message, ts: new Date().toISOString() },
      ]);
      setInput("");
    },
    onSuccess: (res) => {
      setTurns((prev) => [
        ...prev,
        {
          role: "assistant",
          content: typeof res.response === "string" ? res.response : "",
          structured:
            typeof res.response === "object" && res.response !== null
              ? (res.response as Record<string, unknown>)
              : res.structured,
          ts: new Date().toISOString(),
        },
      ]);
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "AI request failed"),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns]);

  function send() {
    const q = input.trim();
    if (!q || ask.isPending) return;
    ask.mutate(q);
  }

  if (!feature) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-lg">
        <Card className="shadow-xl">
          <CardContent className="p-10 text-center">
            <h1 className="text-2xl font-bold mb-2">Feature not found</h1>
            <p className="text-muted-foreground mb-6">
              The AI feature you're looking for doesn't exist.
            </p>
            <Button asChild variant="outline">
              <Link to="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPremium = subscription?.isPremium;
  const suggestions = SUGGESTED_PROMPTS[featureSlug] ?? [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center gap-4 mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 shrink-0 shadow-md">
          <feature.icon className="h-6 w-6 text-primary" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold truncate">{feature.title}</h1>
          <p className="text-sm text-muted-foreground truncate">{feature.description}</p>
        </div>
      </div>

      {!isPremium && (
        <div className="rounded-xl border-2 border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950 p-4 mb-4 flex items-center justify-between gap-3 flex-wrap shadow-md">
          <div className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-300">
            <Lock className="h-4 w-4 shrink-0" />
            <span>AI features require Premium. Upgrade your plan to unlock real AI workflows.</span>
          </div>
          <Button asChild size="sm" className="gradient-brand text-primary-foreground shadow-md">
            <Link to="/pricing">Upgrade now</Link>
          </Button>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          {suggestions.length > 0 && (
            <Card className="shadow-md">
              <CardContent className="p-4 space-y-1">
                <div className="text-sm font-semibold flex items-center gap-1.5 mb-2">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Try these
                </div>
                {suggestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      setInput(q);
                      if (isPremium) ask.mutate(q);
                    }}
                    disabled={!isPremium || ask.isPending}
                    className="w-full text-left text-xs px-3 py-2 rounded-md hover:bg-muted transition-colors disabled:opacity-50"
                  >
                    {q}
                  </button>
                ))}
              </CardContent>
            </Card>
          )}
          <Card className="shadow-md">
            <CardContent className="p-4">
              <div className="text-sm font-semibold mb-2">Other AI features</div>
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
                      <span className="truncate">{f.title}</span>
                    </Link>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-3">
          <Card className="flex-1 shadow-lg">
            <CardContent className="p-4 min-h-96 max-h-[60vh] overflow-y-auto space-y-4">
              {turns.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center py-12 text-muted-foreground">
                  <div className="mb-5 animate-ai-float">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 shadow-lg">
                      <feature.icon className="h-10 w-10 text-primary" />
                    </div>
                  </div>
                  <p className="text-sm max-w-xs">
                    Describe what you need and {feature.title} will analyze your profile and respond
                    with actionable results.
                  </p>
                </div>
              )}

              {turns.map((t, i) => (
                <div
                  key={i}
                  className={t.role === "user" ? "flex justify-end" : "flex justify-start"}
                >
                  {t.role === "user" ? (
                    <div className="rounded-2xl rounded-br-sm bg-primary text-primary-foreground px-4 py-2 max-w-[85%] text-sm whitespace-pre-wrap shadow-md">
                      {t.content}
                    </div>
                  ) : (
                    <div className="max-w-[95%] w-full">
                      {t.structured && Object.keys(t.structured).length > 0 ? (
                        <AiResultRenderer data={t.structured} />
                      ) : (
                        <div className="rounded-2xl rounded-bl-sm bg-muted px-4 py-2 text-sm whitespace-pre-wrap shadow-md">
                          {t.content}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {ask.isPending && (
                <div className="flex gap-2 items-center text-muted-foreground text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {feature.title} is analyzing…
                </div>
              )}
              <div ref={bottomRef} />
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Textarea
              rows={2}
              className="resize-none shadow-md"
              placeholder={`Ask ${feature.title} anything…`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              disabled={ask.isPending || !isPremium}
            />
            <Button
              onClick={send}
              disabled={!input.trim() || ask.isPending || !isPremium}
              className="gradient-brand text-primary-foreground h-auto shadow-md"
            >
              {ask.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Press Enter to send, Shift+Enter for new line.
          </p>
        </div>
      </div>
    </div>
  );
}
