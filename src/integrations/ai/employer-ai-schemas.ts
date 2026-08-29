import { z } from "zod";

// ── Shared building blocks ──────────────────────────────────────────────────
// .catch(0) ensures formatted strings like "85%" or "Rs. 50,000" that fail
// Number() coercion fall back to 0 instead of throwing and failing the whole response.
const score = z.coerce.number().min(0).max(100).catch(0);
const stringArray = z.array(z.string()).default([]);
const str = z.string().default("");

// ── Recruitment AI schemas ──────────────────────────────────────────────────

export const candidateMatchSchema = z.object({
  matches: z
    .array(
      z.object({
        candidate_name: str,
        match_score: score,
        matching_strengths: stringArray,
        gaps: stringArray,
        recommendation: str,
      }),
    )
    .default([]),
  summary: str,
});

export const resumeScreeningSchema = z.object({
  results: z
    .array(
      z.object({
        candidate_name: str,
        status: z.enum(["qualified", "borderline", "unqualified"]).catch("borderline"),
        score: score,
        reasons: stringArray,
      }),
    )
    .default([]),
  summary: str,
});

export const resumeRankingSchema = z.object({
  ranking: z
    .array(
      z.object({
        candidate_name: str,
        rank: z.coerce.number().int().min(1).catch(1),
        fit_score: score,
        justification: str,
      }),
    )
    .default([]),
  summary: str,
});

export const smartShortlistingSchema = z.object({
  shortlisted: z
    .array(
      z.object({
        candidate_name: str,
        rationale: str,
        priority: z.enum(["high", "medium", "low"]).catch("medium"),
      }),
    )
    .default([]),
  not_shortlisted: z
    .array(
      z.object({
        candidate_name: str,
        reason: str,
      }),
    )
    .default([]),
  summary: str,
});

export const candidateRankingSchema = z.object({
  ranking: z
    .array(
      z.object({
        candidate_name: str,
        rank: z.coerce.number().int().min(1).catch(1),
        strengths: stringArray,
        concerns: stringArray,
        overall_score: score,
      }),
    )
    .default([]),
  summary: str,
});

export const candidateSummarySchema = z.object({
  summary: str,
  top_skills: stringArray,
  experience_highlights: stringArray,
  red_flags: stringArray,
  recommended_next_steps: stringArray,
});

export const hiringRecommendationSchema = z.object({
  recommendation: z.enum(["HIRE", "NO-HIRE", "HOLD"]).catch("HOLD"),
  confidence: score,
  reasoning: str,
  risk_factors: stringArray,
  suggested_role: str,
});

export const candidateSuccessPredictionSchema = z.object({
  prediction: z.enum(["Low", "Medium", "High"]).catch("Medium"),
  confidence: score,
  contributing_factors: stringArray,
  rationale: str,
});

export const talentSearchSchema = z.object({
  ideal_candidate_profile: str,
  search_keywords: stringArray,
  boolean_strings: stringArray,
  sourcing_channels: stringArray,
  summary: str,
});

export const duplicateCandidateDetectionSchema = z.object({
  duplicates: z
    .array(
      z.object({
        candidate_name: str,
        likely_duplicate_of: str,
        confidence: score,
        matching_fields: stringArray,
      }),
    )
    .default([]),
  unique_count: z.coerce.number().int().min(0).catch(0),
  summary: str,
});

export const skillGapAnalysisSchema = z.object({
  gaps: z
    .array(
      z.object({
        skill: str,
        current_level: str,
        target_level: str,
        priority: z.enum(["high", "medium", "low"]).catch("medium"),
        learning_path: stringArray,
      }),
    )
    .default([]),
  summary: str,
});

export const interviewQuestionGeneratorSchema = z.object({
  questions: z
    .array(
      z.object({
        question: str,
        category: z.enum(["technical", "behavioral", "situational"]).catch("technical"),
        difficulty: z.enum(["easy", "medium", "hard"]).catch("medium"),
        guidance: str,
      }),
    )
    .default([]),
  summary: str,
});

// ── Job AI schemas ──────────────────────────────────────────────────────────

export const jobDescriptionWriterSchema = z.object({
  title: str,
  summary: str,
  responsibilities: stringArray,
  requirements: stringArray,
  preferred_qualifications: stringArray,
  benefits: stringArray,
  full_description: str,
});

export const jobDescriptionOptimizerSchema = z.object({
  optimized_description: str,
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
        stage: str,
        issue: str,
        impact: str,
      }),
    )
    .default([]),
  time_to_hire_trend: str,
  recommendations: stringArray,
  summary: str,
});

// ── HR & Office AI schemas ──────────────────────────────────────────────────

export const emailAssistantSchema = z.object({
  subject: str,
  body: str,
  tone: str,
});

export const meetingSchedulerSchema = z.object({
  proposed_slots: z
    .array(
      z.object({
        date: str,
        time: str,
        duration_minutes: z.coerce.number().int().min(15).catch(30),
      }),
    )
    .default([]),
  invite_text: str,
  workflow: stringArray,
});

export const onboardingAssistantSchema = z.object({
  first_week_plan: z
    .array(
      z.object({
        day: z.coerce.number().int().min(1).max(5).catch(1),
        tasks: stringArray,
        owner: str,
        resources: stringArray,
      }),
    )
    .default([]),
  summary: str,
});

export const officeDashboardSchema = z.object({
  metrics_summary: stringArray,
  actions: z
    .array(
      z.object({
        area: str,
        action: str,
        priority: z.enum(["high", "medium", "low"]).catch("medium"),
      }),
    )
    .default([]),
  summary: str,
});

export const recruitmentAutomationSchema = z.object({
  opportunities: z
    .array(
      z.object({
        task: str,
        current_process: str,
        automation_suggestion: str,
        expected_impact: str,
      }),
    )
    .default([]),
  summary: str,
});

export const workflowBuilderSchema = z.object({
  stages: z
    .array(
      z.object({
        name: str,
        trigger: str,
        owner: str,
        sla_hours: z.coerce.number().int().min(1).catch(48),
        actions: stringArray,
      }),
    )
    .default([]),
  summary: str,
});

export const predictiveHiringAnalyticsSchema = z.object({
  forecasts: z
    .array(
      z.object({
        metric: str,
        prediction: str,
        confidence: score,
        key_drivers: stringArray,
      }),
    )
    .default([]),
  summary: str,
});

export const workforcePlanningSchema = z.object({
  headcount_plan: z
    .array(
      z.object({
        role: str,
        current_count: z.coerce.number().int().min(0).catch(0),
        target_count: z.coerce.number().int().min(0).catch(0),
        gap: z.coerce.number().int().catch(0),
        priority: z.enum(["high", "medium", "low"]).catch("medium"),
      }),
    )
    .default([]),
  hiring_priorities: stringArray,
  summary: str,
});

// ── Enterprise AI schemas ───────────────────────────────────────────────────

export const privateAiModelsSchema = z.object({
  recommendations: z
    .array(
      z.object({
        model: str,
        use_case: str,
        hosting: str,
        fine_tuning: str,
        governance: str,
      }),
    )
    .default([]),
  summary: str,
});

export const companyKnowledgeAiSchema = z.object({
  answer: str,
  sources: z
    .array(
      z.object({
        source: str,
        relevance: str,
      }),
    )
    .default([]),
  confidence: score,
});

export const talentIntelligenceSchema = z.object({
  bench_strength: str,
  skill_coverage: z
    .array(
      z.object({
        area: str,
        coverage: z.enum(["strong", "adequate", "weak"]).catch("adequate"),
        notes: str,
      }),
    )
    .default([]),
  risks: stringArray,
  summary: str,
});

export const whiteLabelAssistantSchema = z.object({
  recommendations: z
    .array(
      z.object({
        aspect: str,
        recommendation: str,
        implementation: str,
      }),
    )
    .default([]),
  summary: str,
});

export const dedicatedAiSuccessManagerSchema = z.object({
  rollout_plan: z
    .array(
      z.object({
        milestone: str,
        timeline: str,
        activities: stringArray,
        success_metrics: stringArray,
      }),
    )
    .default([]),
  summary: str,
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
