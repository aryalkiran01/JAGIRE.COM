import { z } from "zod";

// ── Shared building blocks ──────────────────────────────────────────────────

const score = z.number().min(0).max(100);
const stringArray = z.array(z.string()).default([]);
const string = z.string().default("");

// ── Recruitment AI schemas ──────────────────────────────────────────────────

export const candidateMatchSchema = z.object({
  matches: z
    .array(
      z.object({
        candidate_name: string,
        match_score: score,
        matching_strengths: stringArray,
        gaps: stringArray,
        recommendation: string,
      }),
    )
    .default([]),
  summary: string,
});

export const resumeScreeningSchema = z.object({
  results: z
    .array(
      z.object({
        candidate_name: string,
        status: z.enum(["qualified", "borderline", "unqualified"]),
        score: score,
        reasons: stringArray,
      }),
    )
    .default([]),
  summary: string,
});

export const resumeRankingSchema = z.object({
  ranking: z
    .array(
      z.object({
        candidate_name: string,
        rank: z.number().int().min(1),
        fit_score: score,
        justification: string,
      }),
    )
    .default([]),
  summary: string,
});

export const smartShortlistingSchema = z.object({
  shortlisted: z
    .array(
      z.object({
        candidate_name: string,
        rationale: string,
        priority: z.enum(["high", "medium", "low"]),
      }),
    )
    .default([]),
  not_shortlisted: z
    .array(
      z.object({
        candidate_name: string,
        reason: string,
      }),
    )
    .default([]),
  summary: string,
});

export const candidateRankingSchema = z.object({
  ranking: z
    .array(
      z.object({
        candidate_name: string,
        rank: z.number().int().min(1),
        strengths: stringArray,
        concerns: stringArray,
        overall_score: score,
      }),
    )
    .default([]),
  summary: string,
});

export const candidateSummarySchema = z.object({
  summary: string,
  top_skills: stringArray,
  experience_highlights: stringArray,
  red_flags: stringArray,
  recommended_next_steps: stringArray,
});

export const hiringRecommendationSchema = z.object({
  recommendation: z.enum(["HIRE", "NO-HIRE", "HOLD"]),
  confidence: score,
  reasoning: string,
  risk_factors: stringArray,
  suggested_role: string.optional().default(""),
});

export const candidateSuccessPredictionSchema = z.object({
  prediction: z.enum(["Low", "Medium", "High"]),
  confidence: score,
  contributing_factors: stringArray,
  rationale: string,
});

export const talentSearchSchema = z.object({
  ideal_candidate_profile: string,
  search_keywords: stringArray,
  boolean_strings: stringArray,
  sourcing_channels: stringArray,
  summary: string,
});

export const duplicateCandidateDetectionSchema = z.object({
  duplicates: z
    .array(
      z.object({
        candidate_name: string,
        likely_duplicate_of: string,
        confidence: score,
        matching_fields: stringArray,
      }),
    )
    .default([]),
  unique_count: z.number().int().min(0).default(0),
  summary: string,
});

export const skillGapAnalysisSchema = z.object({
  gaps: z
    .array(
      z.object({
        skill: string,
        current_level: string,
        target_level: string,
        priority: z.enum(["high", "medium", "low"]),
        learning_path: stringArray,
      }),
    )
    .default([]),
  summary: string,
});

export const interviewQuestionGeneratorSchema = z.object({
  questions: z
    .array(
      z.object({
        question: string,
        category: z.enum(["technical", "behavioral", "situational"]),
        difficulty: z.enum(["easy", "medium", "hard"]),
        guidance: string,
      }),
    )
    .default([]),
  summary: string,
});

// ── Job AI schemas ──────────────────────────────────────────────────────────

export const jobDescriptionWriterSchema = z.object({
  title: string,
  summary: string,
  responsibilities: stringArray,
  requirements: stringArray,
  preferred_qualifications: stringArray,
  benefits: stringArray,
  full_description: string,
});

export const jobDescriptionOptimizerSchema = z.object({
  optimized_description: string,
  changes_made: stringArray,
  clarity_score: score,
  inclusivity_score: score,
  seo_score: score,
});

export const hiringAnalyticsSchema = z.object({
  insights: stringArray,
  bottlenecks: z
    .array(
      z.object({
        stage: string,
        issue: string,
        impact: string,
      }),
    )
    .default([]),
  time_to_hire_trend: string,
  recommendations: stringArray,
  summary: string,
});

// ── HR & Office AI schemas ──────────────────────────────────────────────────

export const emailAssistantSchema = z.object({
  subject: string,
  body: string,
  tone: string.optional().default("professional"),
});

export const meetingSchedulerSchema = z.object({
  proposed_slots: z
    .array(
      z.object({
        date: string,
        time: string,
        duration_minutes: z.number().int().min(15).default(30),
      }),
    )
    .default([]),
  invite_text: string,
  workflow: stringArray,
});

export const onboardingAssistantSchema = z.object({
  first_week_plan: z
    .array(
      z.object({
        day: z.number().int().min(1).max(5),
        tasks: stringArray,
        owner: string,
        resources: stringArray,
      }),
    )
    .default([]),
  summary: string,
});

export const officeDashboardSchema = z.object({
  metrics_summary: stringArray,
  actions: z
    .array(
      z.object({
        area: string,
        action: string,
        priority: z.enum(["high", "medium", "low"]),
      }),
    )
    .default([]),
  summary: string,
});

export const recruitmentAutomationSchema = z.object({
  opportunities: z
    .array(
      z.object({
        task: string,
        current_process: string,
        automation_suggestion: string,
        expected_impact: string,
      }),
    )
    .default([]),
  summary: string,
});

export const workflowBuilderSchema = z.object({
  stages: z
    .array(
      z.object({
        name: string,
        trigger: string,
        owner: string,
        sla_hours: z.number().int().min(1).default(48),
        actions: stringArray,
      }),
    )
    .default([]),
  summary: string,
});

export const predictiveHiringAnalyticsSchema = z.object({
  forecasts: z
    .array(
      z.object({
        metric: string,
        prediction: string,
        confidence: score,
        key_drivers: stringArray,
      }),
    )
    .default([]),
  summary: string,
});

export const workforcePlanningSchema = z.object({
  headcount_plan: z
    .array(
      z.object({
        role: string,
        current_count: z.number().int().min(0).default(0),
        target_count: z.number().int().min(0).default(0),
        gap: z.number().int().default(0),
        priority: z.enum(["high", "medium", "low"]),
      }),
    )
    .default([]),
  hiring_priorities: stringArray,
  summary: string,
});

// ── Enterprise AI schemas ───────────────────────────────────────────────────

export const privateAiModelsSchema = z.object({
  recommendations: z
    .array(
      z.object({
        model: string,
        use_case: string,
        hosting: string,
        fine_tuning: string,
        governance: string,
      }),
    )
    .default([]),
  summary: string,
});

export const companyKnowledgeAiSchema = z.object({
  answer: string,
  sources: z
    .array(
      z.object({
        source: string,
        relevance: string,
      }),
    )
    .default([]),
  confidence: score,
});

export const talentIntelligenceSchema = z.object({
  bench_strength: string,
  skill_coverage: z
    .array(
      z.object({
        area: string,
        coverage: z.enum(["strong", "adequate", "weak"]),
        notes: string,
      }),
    )
    .default([]),
  risks: stringArray,
  summary: string,
});

export const whiteLabelAssistantSchema = z.object({
  recommendations: z
    .array(
      z.object({
        aspect: string,
        recommendation: string,
        implementation: string,
      }),
    )
    .default([]),
  summary: string,
});

export const dedicatedAiSuccessManagerSchema = z.object({
  rollout_plan: z
    .array(
      z.object({
        milestone: string,
        timeline: string,
        activities: stringArray,
        success_metrics: stringArray,
      }),
    )
    .default([]),
  summary: string,
});

// ── Type exports ─────────────────────────────────────────────────────────────

export type CandidateMatch = z.infer<typeof candidateMatchSchema>;
export type ResumeScreening = z.infer<typeof resumeScreeningSchema>;
export type ResumeRanking = z.infer<typeof resumeRankingSchema>;
export type SmartShortlisting = z.infer<typeof smartShortlistingSchema>;
export type CandidateRanking = z.infer<typeof candidateRankingSchema>;
export type CandidateSummary = z.infer<typeof candidateSummarySchema>;
export type HiringRecommendation = z.infer<typeof hiringRecommendationSchema>;
export type CandidateSuccessPrediction = z.infer<typeof candidateSuccessPredictionSchema>;
export type TalentSearch = z.infer<typeof talentSearchSchema>;
export type DuplicateCandidateDetection = z.infer<typeof duplicateCandidateDetectionSchema>;
export type SkillGapAnalysis = z.infer<typeof skillGapAnalysisSchema>;
export type InterviewQuestionGenerator = z.infer<typeof interviewQuestionGeneratorSchema>;
export type JobDescriptionWriter = z.infer<typeof jobDescriptionWriterSchema>;
export type JobDescriptionOptimizer = z.infer<typeof jobDescriptionOptimizerSchema>;
export type HiringAnalytics = z.infer<typeof hiringAnalyticsSchema>;
export type EmailAssistant = z.infer<typeof emailAssistantSchema>;
export type MeetingScheduler = z.infer<typeof meetingSchedulerSchema>;
export type OnboardingAssistant = z.infer<typeof onboardingAssistantSchema>;
export type OfficeDashboard = z.infer<typeof officeDashboardSchema>;
export type RecruitmentAutomation = z.infer<typeof recruitmentAutomationSchema>;
export type WorkflowBuilder = z.infer<typeof workflowBuilderSchema>;
export type PredictiveHiringAnalytics = z.infer<typeof predictiveHiringAnalyticsSchema>;
export type WorkforcePlanning = z.infer<typeof workforcePlanningSchema>;
export type PrivateAiModels = z.infer<typeof privateAiModelsSchema>;
export type CompanyKnowledgeAi = z.infer<typeof companyKnowledgeAiSchema>;
export type TalentIntelligence = z.infer<typeof talentIntelligenceSchema>;
export type WhiteLabelAssistant = z.infer<typeof whiteLabelAssistantSchema>;
export type DedicatedAiSuccessManager = z.infer<typeof dedicatedAiSuccessManagerSchema>;
