import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, Loader as Loader2, Sparkles, Lock } from "lucide-react";
import { getAiFeature, EMPLOYER_AI_GROUPS } from "@/lib/employer-ai-features";
import { runEmployerAiFeature } from "@/lib/employer-ai.server";
import { useSubscription } from "@/hooks/use-subscription";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/employer/ai/$featureSlug")({
  head: () => ({ meta: [{ title: "AI Feature — Jagire" }] }),
  component: AiFeaturePage,
});

type Turn = { role: "user" | "assistant"; content: string; ts: string };

const SUGGESTED_PROMPTS: Record<string, string[]> = {
  "candidate-match": [
    "Match my applicants to the Senior React Engineer role",
    "Which candidates best fit a remote backend Python position?",
  ],
  "resume-screening": [
    "Screen these 5 resumes against the job requirements",
    "Flag unqualified applicants for the data analyst role",
  ],
  "resume-ranking": [
    "Rank my applicants for the product manager role",
    "Rank these candidates from best to worst fit",
  ],
  "smart-shortlisting": [
    "Shortlist the top 3 candidates for interview",
    "Who should advance from the current applicant pool?",
  ],
  "candidate-ranking": [
    "Compare the top 5 candidates side-by-side",
    "Rank candidates by overall hiring suitability",
  ],
  "candidate-summary": [
    "Summarize the profile of applicant Jane Doe",
    "Give me a snapshot of the strongest candidate",
  ],
  "hiring-recommendation": [
    "Should I hire this candidate for the senior role?",
    "Give a hire/no-hire recommendation for the top applicant",
  ],
  "candidate-success-prediction": [
    "Predict success likelihood for the top candidate",
    "Which applicant is most likely to succeed in this role?",
  ],
  "talent-search": [
    "Build a search strategy for a senior DevOps engineer",
    "Suggest boolean search strings for a React developer",
  ],
  "duplicate-candidate-detection": [
    "Check my applicant pool for duplicate profiles",
    "Flag likely duplicates among recent applicants",
  ],
  "skill-gap-analysis": [
    "Analyze skill gaps in my engineering team",
    "What skills are missing for our next product launch?",
  ],
  "interview-question-generator": [
    "Generate interview questions for a senior backend role",
    "Create behavioral questions for a product manager",
  ],
  "job-description-writer": [
    "Write a job description for a Senior Frontend Engineer",
    "Draft a job post for a marketing manager",
  ],
  "job-description-optimizer": [
    "Optimize this job description for reach and inclusivity",
    "Improve my job post's conversion",
  ],
  "hiring-analytics": [
    "Analyze my hiring funnel and bottlenecks",
    "Where am I losing candidates in the pipeline?",
  ],
  "email-assistant": [
    "Draft an interview invite email",
    "Write a polite rejection email to a candidate",
  ],
  "meeting-scheduler": [
    "Propose interview slots for 3 candidates this week",
    "Format a calendar invite for a panel interview",
  ],
  "onboarding-assistant": [
    "Build a first-week onboarding plan for a new engineer",
    "Create an onboarding checklist for a sales hire",
  ],
  "office-dashboard": [
    "Summarize my team's capacity and hiring needs",
    "What HR actions should I prioritize this month?",
  ],
  "recruitment-automation": [
    "What recruiting tasks can I automate?",
    "Recommend automation for my screening workflow",
  ],
  "workflow-builder": [
    "Design a hiring workflow for engineering roles",
    "Build a 4-stage interview workflow with SLAs",
  ],
  "predictive-hiring-analytics": [
    "Forecast time-to-fill for my open roles",
    "Predict offer acceptance likelihood for top candidates",
  ],
  "workforce-planning": [
    "Propose a headcount plan for next quarter",
    "What roles should I prioritize hiring for?",
  ],
  "private-ai-models": [
    "Recommend a private model strategy for my company",
    "How should we host and govern private AI models?",
  ],
  "company-knowledge-ai": [
    "Answer questions using our company knowledge base",
    "Summarize our internal hiring playbook",
  ],
  "talent-intelligence": [
    "Assess our bench strength across teams",
    "Where are our talent coverage risks?",
  ],
  "white-label-assistant": [
    "How do I configure a white-label AI assistant?",
    "Recommend a branded assistant for our HR team",
  ],
  "dedicated-ai-success-manager": [
    "Propose an AI rollout plan for our company",
    "What milestones should we track for AI adoption?",
  ],
};

function AiFeaturePage() {
  const { featureSlug } = Route.useParams();
  const { data: subscription } = useSubscription();
  const feature = getAiFeature(featureSlug);
  const run = useServerFn(runEmployerAiFeature);
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
        { role: "assistant", content: res.response, ts: new Date().toISOString() },
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
        <Card>
          <CardContent className="p-10 text-center">
            <h1 className="text-2xl font-bold mb-2">Feature not found</h1>
            <p className="text-muted-foreground mb-6">
              The AI feature you're looking for doesn't exist.
            </p>
            <Button asChild variant="outline">
              <Link to="/employer">
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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 shrink-0">
          <feature.icon className="h-6 w-6 text-primary" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold truncate">{feature.title}</h1>
          <p className="text-sm text-muted-foreground truncate">{feature.description}</p>
        </div>
      </div>

      {!isPremium && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950 p-4 mb-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-300">
            <Lock className="h-4 w-4 shrink-0" />
            <span>AI features require Premium. Upgrade your plan to unlock real AI workflows.</span>
          </div>
          <Button asChild size="sm" className="gradient-brand text-primary-foreground">
            <Link to="/pricing">Upgrade now</Link>
          </Button>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          {suggestions.length > 0 && (
            <Card>
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
          <Card>
            <CardContent className="p-4">
              <div className="text-sm font-semibold mb-2">Other AI features</div>
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
                      <span className="truncate">{f.title}</span>
                    </Link>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-3">
          <Card className="flex-1">
            <CardContent className="p-4 min-h-96 max-h-[60vh] overflow-y-auto space-y-4">
              {turns.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center py-12 text-muted-foreground">
                  <div className="mb-5 animate-ai-float">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
                      <feature.icon className="h-10 w-10 text-primary" />
                    </div>
                  </div>
                  <p className="text-sm max-w-xs">
                    Describe what you need and {feature.title} will analyze your company data and
                    respond with actionable results.
                  </p>
                </div>
              )}
              {turns.map((t, i) => (
                <div
                  key={i}
                  className={t.role === "user" ? "flex justify-end" : "flex justify-start"}
                >
                  <div
                    className={
                      t.role === "user"
                        ? "rounded-2xl rounded-br-sm bg-primary text-primary-foreground px-4 py-2 max-w-[85%] text-sm whitespace-pre-wrap"
                        : "rounded-2xl rounded-bl-sm bg-muted px-4 py-2 max-w-[85%] text-sm whitespace-pre-wrap"
                    }
                  >
                    {t.content}
                  </div>
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
              className="resize-none"
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
              className="gradient-brand text-primary-foreground h-auto"
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
