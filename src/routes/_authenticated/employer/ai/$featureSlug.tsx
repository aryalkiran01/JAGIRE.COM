import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Send,
  Loader as Loader2,
  Sparkles,
  Lock,
  Check,
  AlertTriangle,
  ArrowRight,
  Lightbulb,
  Star,
} from "lucide-react";
import { getAiFeature, EMPLOYER_AI_GROUPS } from "@/lib/employer-ai-features";
import { runEmployerAiFeature } from "@/lib/employer-ai.server";
import { useSubscription } from "@/hooks/use-subscription";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/employer/ai/$featureSlug")({
  head: () => ({ meta: [{ title: "AI Feature — Jagire" }] }),
  component: AiFeaturePage,
});

type Turn = {
  role: "user" | "assistant";
  content: string;
  structured?: Record<string, any>;
  ts: string;
};

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

// 🎨 Generic Structured Renderer - Makes ANY JSON look beautiful
function GenericStructuredRenderer({ data }: { data: any }) {
  if (!data || typeof data !== "object") return null;

  const entries = Object.entries(data).filter(([key]) => !key.startsWith("_"));

  if (entries.length === 0) return null;

  return (
    <Card className="shadow-lg border-0 overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-primary via-purple-500 to-pink-500" />
      <CardContent className="p-6 space-y-5">
        {entries.map(([key, value]) => {
          const formattedKey = key
            .replace(/_/g, " ")
            .replace(/([A-Z])/g, " $1")
            .trim()
            .replace(/\b\w/g, (c) => c.toUpperCase());

          return (
            <div key={key} className="space-y-2">
              <h4 className="text-sm font-semibold text-primary flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                {formattedKey}
              </h4>

              {Array.isArray(value) ? (
                <div className="space-y-2">
                  {value.map((item: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border/50 hover:border-primary/20 transition-all"
                    >
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                        <span className="text-xs font-bold text-primary">{i + 1}</span>
                      </div>
                      <div className="text-sm flex-1">
                        {typeof item === "object" && item !== null ? (
                          <div className="space-y-1.5">
                            {Object.entries(item).map(([k, v]) => (
                              <div key={k} className="flex items-center gap-2">
                                <span className="text-xs font-medium text-muted-foreground capitalize">
                                  {k.replace(/_/g, " ")}:
                                </span>
                                <span className="text-xs">
                                  {typeof v === "string" ? v : JSON.stringify(v)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span>{String(item)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : typeof value === "object" && value !== null ? (
                <div className="bg-muted/30 rounded-lg p-4">
                  <GenericStructuredRenderer data={value} />
                </div>
              ) : (
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">{String(value)}</p>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function CandidateMatchRenderer({ data }: { data: any }) {
  if (!data?.candidates) return <GenericStructuredRenderer data={data} />;

  return (
    <div className="space-y-4">
      {data.candidates.map((candidate: any, index: number) => (
        <Card key={index} className="overflow-hidden shadow-lg hover:shadow-xl transition-all">
          <div
            className={`h-2 ${
              candidate.score >= 80
                ? "bg-gradient-to-r from-green-400 to-green-600"
                : candidate.score >= 60
                  ? "bg-gradient-to-r from-yellow-400 to-yellow-600"
                  : "bg-gradient-to-r from-red-400 to-red-600"
            }`}
          />
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="font-bold text-lg">{candidate.name}</h4>
                {candidate.recommendation && (
                  <p className="text-sm text-muted-foreground mt-1">{candidate.recommendation}</p>
                )}
              </div>
              <Badge
                className={`text-base px-4 py-2 font-bold ${
                  candidate.score >= 80
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : candidate.score >= 60
                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                }`}
              >
                {candidate.score}%
              </Badge>
            </div>

            <Progress value={candidate.score} className="h-2.5 mb-4 rounded-full" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {candidate.strengths?.length > 0 && (
                <div className="space-y-2">
                  <h5 className="font-semibold text-green-600 dark:text-green-400 flex items-center gap-2">
                    <Check className="h-4 w-4" /> Strengths
                  </h5>
                  {candidate.strengths.map((strength: string, i: number) => (
                    <p key={i} className="text-sm text-muted-foreground pl-6">
                      • {strength}
                    </p>
                  ))}
                </div>
              )}

              {candidate.gaps?.length > 0 && (
                <div className="space-y-2">
                  <h5 className="font-semibold text-orange-600 dark:text-orange-400 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" /> Gaps
                  </h5>
                  {candidate.gaps.map((gap: string, i: number) => (
                    <p key={i} className="text-sm text-muted-foreground pl-6">
                      • {gap}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ResumeScreeningRenderer({ data }: { data: any }) {
  if (!data) return <GenericStructuredRenderer data={data} />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950 shadow-lg">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Check className="h-5 w-5 text-green-600" />
            <h4 className="font-bold text-green-800 dark:text-green-200">
              Qualified ({data.qualified?.length || 0})
            </h4>
          </div>
          <div className="space-y-3">
            {data.qualified?.map((candidate: any, i: number) => (
              <div key={i} className="bg-white dark:bg-green-900/20 p-3 rounded-lg">
                <p className="font-semibold text-green-900 dark:text-green-100">{candidate.name}</p>
                <ul className="mt-2 space-y-1">
                  {candidate.reasons?.map((reason: string, j: number) => (
                    <li key={j} className="text-xs text-green-700 dark:text-green-300 pl-3">
                      • {reason}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {!data.qualified?.length && (
              <p className="text-xs text-muted-foreground text-center py-4">
                No qualified candidates
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950 shadow-lg">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <h4 className="font-bold text-yellow-800 dark:text-yellow-200">
              Borderline ({data.borderline?.length || 0})
            </h4>
          </div>
          <div className="space-y-3">
            {data.borderline?.map((candidate: any, i: number) => (
              <div key={i} className="bg-white dark:bg-yellow-900/20 p-3 rounded-lg">
                <p className="font-semibold text-yellow-900 dark:text-yellow-100">
                  {candidate.name}
                </p>
                <ul className="mt-2 space-y-1">
                  {candidate.reasons?.map((reason: string, j: number) => (
                    <li key={j} className="text-xs text-yellow-700 dark:text-yellow-300 pl-3">
                      • {reason}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {!data.borderline?.length && (
              <p className="text-xs text-muted-foreground text-center py-4">
                No borderline candidates
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 shadow-lg">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h4 className="font-bold text-red-800 dark:text-red-200">
              Unqualified ({data.unqualified?.length || 0})
            </h4>
          </div>
          <div className="space-y-3">
            {data.unqualified?.map((candidate: any, i: number) => (
              <div key={i} className="bg-white dark:bg-red-900/20 p-3 rounded-lg">
                <p className="font-semibold text-red-900 dark:text-red-100">{candidate.name}</p>
                <ul className="mt-2 space-y-1">
                  {candidate.reasons?.map((reason: string, j: number) => (
                    <li key={j} className="text-xs text-red-700 dark:text-red-300 pl-3">
                      • {reason}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {!data.unqualified?.length && (
              <p className="text-xs text-muted-foreground text-center py-4">
                No unqualified candidates
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ResumeRankingRenderer({ data }: { data: any }) {
  if (!data?.rankings) return <GenericStructuredRenderer data={data} />;

  return (
    <div className="space-y-3">
      {data.rankings.map((item: any, index: number) => (
        <Card key={index} className="hover:shadow-lg transition-all">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-base font-bold text-primary">#{item.rank}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-semibold truncate">{item.name}</h4>
                <Badge variant="secondary" className="text-sm font-bold">
                  {item.score}%
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{item.justification}</p>
              <Progress value={item.score} className="h-2 mt-2 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function HiringRecommendationRenderer({ data }: { data: any }) {
  if (!data) return <GenericStructuredRenderer data={data} />;

  const decisionConfig = {
    HIRE: {
      color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-500",
      icon: Check,
    },
    NO_HIRE: {
      color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-500",
      icon: AlertTriangle,
    },
    HOLD: {
      color:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-500",
      icon: AlertTriangle,
    },
  };

  const config =
    decisionConfig[data.decision as keyof typeof decisionConfig] || decisionConfig.HOLD;
  const Icon = config.icon;

  return (
    <Card className="border-l-4 border-l-primary shadow-lg overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-primary to-primary/50" />
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">Hiring Recommendation</h3>
          <Badge className={`text-base px-5 py-2 font-bold border-2 ${config.color}`}>
            <Icon className="h-4 w-4 mr-2" />
            {data.decision}
          </Badge>
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground font-medium">Confidence Level</span>
            <span className="font-bold">{data.confidence}%</span>
          </div>
          <Progress value={data.confidence} className="h-2.5 rounded-full" />
        </div>

        <div className="space-y-4">
          {data.reasons?.length > 0 && (
            <div>
              <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2 flex items-center gap-2">
                <Check className="h-4 w-4" /> Key Reasons
              </h4>
              <ul className="space-y-2">
                {data.reasons.map((reason: string, i: number) => (
                  <li
                    key={i}
                    className="text-sm text-muted-foreground flex items-start gap-2 bg-green-50 dark:bg-green-950/30 p-2 rounded-lg"
                  >
                    <span className="text-green-500 mt-0.5">•</span>
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.risks?.length > 0 && (
            <div>
              <h4 className="font-semibold text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Risks
              </h4>
              <ul className="space-y-2">
                {data.risks.map((risk: string, i: number) => (
                  <li
                    key={i}
                    className="text-sm text-muted-foreground flex items-start gap-2 bg-red-50 dark:bg-red-950/30 p-2 rounded-lg"
                  >
                    <span className="text-red-500 mt-0.5">•</span>
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.nextSteps?.length > 0 && (
            <div>
              <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-2">
                <ArrowRight className="h-4 w-4" /> Next Steps
              </h4>
              <ul className="space-y-2">
                {data.nextSteps.map((step: string, i: number) => (
                  <li
                    key={i}
                    className="text-sm text-muted-foreground flex items-start gap-2 bg-blue-50 dark:bg-blue-950/30 p-2 rounded-lg"
                  >
                    <span className="text-blue-500 mt-0.5">→</span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CandidateSummaryRenderer({ data }: { data: any }) {
  if (!data) return <GenericStructuredRenderer data={data} />;

  return (
    <Card className="shadow-lg overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-blue-500 to-purple-500" />
      <CardContent className="p-6">
        {data.overallAssessment && (
          <div className="bg-muted/30 p-4 rounded-lg mb-6">
            <p className="text-sm leading-relaxed">{data.overallAssessment}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {data.topSkills?.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 text-blue-600 dark:text-blue-400 flex items-center gap-2">
                <Check className="h-4 w-4" /> Top Skills
              </h4>
              <div className="flex flex-wrap gap-2">
                {data.topSkills.map((skill: string, i: number) => (
                  <Badge key={i} variant="secondary" className="text-sm px-3 py-1">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {data.experienceHighlights?.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 text-green-600 dark:text-green-400 flex items-center gap-2">
                <Star className="h-4 w-4" /> Experience Highlights
              </h4>
              <ul className="space-y-2">
                {data.experienceHighlights.map((highlight: string, i: number) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.redFlags?.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Red Flags
              </h4>
              <ul className="space-y-2">
                {data.redFlags.map((flag: string, i: number) => (
                  <li
                    key={i}
                    className="text-sm text-red-700 dark:text-red-300 flex items-start gap-2 bg-red-50 dark:bg-red-950/30 p-2 rounded-lg"
                  >
                    <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    {flag}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.recommendedNextSteps?.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 text-purple-600 dark:text-purple-400 flex items-center gap-2">
                <ArrowRight className="h-4 w-4" /> Next Steps
              </h4>
              <ul className="space-y-2">
                {data.recommendedNextSteps.map((step: string, i: number) => (
                  <li
                    key={i}
                    className="text-sm flex items-start gap-2 bg-purple-50 dark:bg-purple-950/30 p-2 rounded-lg"
                  >
                    <ArrowRight className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SkillGapRenderer({ data }: { data: any }) {
  if (!data) return <GenericStructuredRenderer data={data} />;

  const priorityConfig = {
    high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-500",
    medium:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-500",
    low: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-500",
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">Skill Gap Analysis</h3>
      {data.missingSkills?.map((skill: any, i: number) => (
        <Card key={i} className="shadow-md hover:shadow-lg transition-all">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-lg">{skill.skill}</h4>
              <Badge
                className={`text-sm px-3 py-1 font-bold border ${
                  priorityConfig[skill.priority as keyof typeof priorityConfig] || "bg-gray-100"
                }`}
              >
                {skill.priority?.toUpperCase()}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
              {skill.learningPath}
            </p>
          </CardContent>
        </Card>
      ))}

      {data.recommendations?.length > 0 && (
        <Card className="border-primary/30 shadow-lg">
          <div className="h-1.5 bg-gradient-to-r from-yellow-400 to-orange-500" />
          <CardContent className="p-5">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Recommendations
            </h4>
            <ul className="space-y-2">
              {data.recommendations.map((rec: string, i: number) => (
                <li key={i} className="text-sm flex items-start gap-2 bg-muted/30 p-2 rounded-lg">
                  <span className="text-primary mt-0.5 font-bold">→</span>
                  {rec}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function InterviewQuestionsRenderer({ data }: { data: any }) {
  if (!data?.questions) return <GenericStructuredRenderer data={data} />;

  const categoryConfig = {
    technical: {
      border: "border-l-blue-500",
      bg: "bg-blue-50 dark:bg-blue-950",
      badge: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      icon: "💻",
    },
    behavioral: {
      border: "border-l-green-500",
      bg: "bg-green-50 dark:bg-green-950",
      badge: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      icon: "🧠",
    },
    situational: {
      border: "border-l-purple-500",
      bg: "bg-purple-50 dark:bg-purple-950",
      badge: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      icon: "🎯",
    },
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">Interview Questions</h3>
      {data.questions.map((q: any, i: number) => {
        const config =
          categoryConfig[q.category as keyof typeof categoryConfig] || categoryConfig.technical;

        return (
          <Card key={i} className={`border-l-4 ${config.border} shadow-md`}>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">{config.icon}</span>
                <Badge className={`text-xs font-bold ${config.badge}`}>{q.category}</Badge>
                <span className="text-xs text-muted-foreground ml-auto">Question {i + 1}</span>
              </div>

              <p className="font-semibold text-base mb-4">{q.question}</p>

              <div className="space-y-3">
                <div>
                  <h5 className="text-sm font-semibold text-muted-foreground mb-2">
                    Expected Answer
                  </h5>
                  <p className="text-sm bg-muted/50 p-3 rounded-lg">{q.expectedAnswer}</p>
                </div>

                {q.evaluationCriteria?.length > 0 && (
                  <div>
                    <h5 className="text-sm font-semibold text-muted-foreground mb-2">
                      Evaluation Criteria
                    </h5>
                    <ul className="space-y-1">
                      {q.evaluationCriteria.map((criteria: string, j: number) => (
                        <li key={j} className="text-sm flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          {criteria}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function JobDescriptionRenderer({ data }: { data: any }) {
  if (!data) return <GenericStructuredRenderer data={data} />;

  return (
    <Card className="shadow-lg overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-blue-500 to-green-500" />
      <CardContent className="p-6 space-y-5">
        {data.title && <h3 className="text-2xl font-bold">{data.title}</h3>}

        {data.summary && (
          <div className="bg-muted/30 p-4 rounded-lg">
            <p className="text-sm leading-relaxed">{data.summary}</p>
          </div>
        )}

        {data.responsibilities?.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3 text-blue-600 dark:text-blue-400">
              Responsibilities
            </h4>
            <ul className="space-y-2">
              {data.responsibilities.map((resp: string, i: number) => (
                <li key={i} className="text-sm flex items-start gap-2 bg-muted/30 p-2 rounded-lg">
                  <span className="text-primary mt-0.5 font-bold">•</span>
                  {resp}
                </li>
              ))}
            </ul>
          </div>
        )}

        {data.requirements?.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3 text-green-600 dark:text-green-400">Requirements</h4>
            <ul className="space-y-2">
              {data.requirements.map((req: string, i: number) => (
                <li key={i} className="text-sm flex items-start gap-2 bg-muted/30 p-2 rounded-lg">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  {req}
                </li>
              ))}
            </ul>
          </div>
        )}

        {data.benefits?.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3 text-yellow-600 dark:text-yellow-400">Benefits</h4>
            <ul className="space-y-2">
              {data.benefits.map((benefit: string, i: number) => (
                <li key={i} className="text-sm flex items-start gap-2 bg-muted/30 p-2 rounded-lg">
                  <span className="text-yellow-500 mt-0.5">★</span>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        )}

        {data.keywords?.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3 text-purple-600 dark:text-purple-400">Keywords</h4>
            <div className="flex flex-wrap gap-2">
              {data.keywords.map((keyword: string, i: number) => (
                <Badge key={i} variant="outline" className="text-sm px-3 py-1">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SuccessPredictionRenderer({ data }: { data: any }) {
  if (!data) return <GenericStructuredRenderer data={data} />;

  const likelihoodConfig = {
    High: {
      color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-500",
      bar: "bg-green-500",
    },
    Medium: {
      color:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-500",
      bar: "bg-yellow-500",
    },
    Low: {
      color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-500",
      bar: "bg-red-500",
    },
  };

  const config =
    likelihoodConfig[data.likelihood as keyof typeof likelihoodConfig] || likelihoodConfig.Medium;

  return (
    <Card className="border-l-4 border-l-primary shadow-lg overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-primary to-primary/50" />
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">Success Prediction</h3>
          <Badge className={`text-base px-5 py-2 font-bold border-2 ${config.color}`}>
            {data.likelihood} Likelihood
          </Badge>
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground font-medium">Success Score</span>
            <span className="font-bold">{data.score}%</span>
          </div>
          <Progress value={data.score} className="h-2.5 rounded-full" />
        </div>

        {data.factors?.length > 0 && (
          <div className="mb-4">
            <h4 className="font-semibold mb-3">Contributing Factors</h4>
            <div className="space-y-2">
              {data.factors.map((factor: any, i: number) => (
                <div key={i} className="flex items-start gap-3 bg-muted/30 p-3 rounded-lg">
                  {factor.impact === "positive" ? (
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  ) : factor.impact === "negative" ? (
                    <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <span className="h-5 w-5 flex items-center justify-center text-gray-500 mt-0.5 flex-shrink-0 font-bold">
                      •
                    </span>
                  )}
                  <div>
                    <p className="text-sm font-medium">{factor.factor}</p>
                    <Badge variant="outline" className="text-xs mt-1">
                      {factor.impact}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.rationale && (
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Rationale</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">{data.rationale}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Main response renderer that switches between structured views
function StructuredResponseRenderer({ featureSlug, data }: { featureSlug: string; data: any }) {
  if (!data) return null;

  switch (featureSlug) {
    case "candidate-match":
      return <CandidateMatchRenderer data={data} />;
    case "resume-screening":
      return <ResumeScreeningRenderer data={data} />;
    case "resume-ranking":
    case "candidate-ranking":
    case "smart-shortlisting":
      return <ResumeRankingRenderer data={data} />;
    case "hiring-recommendation":
      return <HiringRecommendationRenderer data={data} />;
    case "candidate-summary":
      return <CandidateSummaryRenderer data={data} />;
    case "skill-gap-analysis":
      return <SkillGapRenderer data={data} />;
    case "interview-question-generator":
      return <InterviewQuestionsRenderer data={data} />;
    case "job-description-writer":
    case "job-description-optimizer":
      return <JobDescriptionRenderer data={data} />;
    case "candidate-success-prediction":
      return <SuccessPredictionRenderer data={data} />;
    default:
      // ✅ FALLBACK: Render any JSON beautifully
      return <GenericStructuredRenderer data={data} />;
  }
}

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
        {
          role: "assistant",
          content: res.response,
          structured: res.structured,
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
                  {t.role === "user" ? (
                    <div className="rounded-2xl rounded-br-sm bg-primary text-primary-foreground px-4 py-2 max-w-[85%] text-sm whitespace-pre-wrap shadow-md">
                      {t.content}
                    </div>
                  ) : (
                    <div className="max-w-[90%] w-full">
                      {t.structured && Object.keys(t.structured).length > 0 ? (
                        <StructuredResponseRenderer featureSlug={featureSlug} data={t.structured} />
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
