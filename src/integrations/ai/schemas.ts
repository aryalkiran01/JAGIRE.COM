import { z } from "zod";

// ── Shared building blocks ──────────────────────────────────────────────────
// z.coerce.number() alone fails on formatted strings like "85%" or "Rs. 50,000".
// We use .catch(0) so that any parse failure falls back to 0 instead of throwing.
const score = z.coerce.number().min(0).max(100).catch(0);
const stringArray = z.array(z.string()).default([]);
const str = z.string().default("");

export const resumeAnalysisSchema = z.object({
  overall_score: score,
  ats_score: score,
  grammar_score: score,
  formatting_score: score,
  keyword_score: score,
  professionalism_score: score,
  suggestions: z.array(z.string()).max(8).default([]),
  summary: str,
  extracted_skills: z.array(z.string()).max(20).default([]),
});

export const careerRecommendationsSchema = z.object({
  career_paths: z
    .array(
      z.object({
        title: str,
        why: str,
        next_steps: stringArray,
      }),
    )
    .default([]),
  skill_gaps: stringArray,
  missing_skills: stringArray,
  recommended_certifications: z.array(z.object({ name: str, provider: str })).default([]),
  suggested_projects: z.array(z.object({ title: str, description: str })).default([]),
  recommended_jobs: z.array(z.object({ title: str, why: str })).default([]),
  companies_hiring: z.array(z.object({ name: str, sector: str })).default([]),
  salary_prediction: z
    .object({
      low: score,
      mid: score,
      high: score,
      currency: str,
    })
    .nullable()
    .default(null),
  resume_improvements: stringArray,
  interview_prep_plan: z
    .object({
      thirty_days: stringArray,
      sixty_days: stringArray,
      ninety_days: stringArray,
      one_eighty_days: stringArray,
    })
    .nullable()
    .default(null),
  suggested_search_keywords: stringArray,
});

export const linkedinImportSchema = z.object({
  full_name: z.string().nullable().default(null),
  headline: z.string().nullable().default(null),
  about: str,
  location: z.string().nullable().default(null),
  current_position: z.string().nullable().default(null),
  experience_years: z.coerce.number().catch(0),
  skills: z.array(z.string()).max(20).default([]),
});

export const learningRecommendationsSchema = z.object({
  items: z
    .array(
      z.object({
        kind: z.enum(["course", "video", "challenge", "interview"]).catch("course"),
        title: str,
        provider: str,
        description: str,
        skills: stringArray,
        url: z.string().default(""),
      }),
    )
    .default([]),
});

export const coverLetterSchema = z.object({
  cover_letter: str,
});

export const interviewQuestionsSchema = z.object({
  questions: z
    .array(
      z.object({
        question: str,
        category: str,
        difficulty: str,
        sample_answer: z.string().default(""),
      }),
    )
    .default([]),
});

export const candidateRankingSchema = z.object({
  candidates: z
    .array(
      z.object({
        candidate_id: str,
        rank: z.coerce.number().catch(0),
        score: z.coerce.number().catch(0),
        reasons: stringArray,
      }),
    )
    .default([]),
});

export const jobMatchingSchema = z.object({
  matches: z
    .array(
      z.object({
        job_id: str,
        score: z.coerce.number().catch(0),
        reasons: stringArray,
      }),
    )
    .default([]),
});

export const hiringRecommendationSchema = z.object({
  recommendation: str,
  confidence: z.coerce.number().catch(0),
  reasoning: str,
  risk_factors: stringArray,
});

export const strengthWeaknessSchema = z.object({
  strengths: stringArray,
  weaknesses: stringArray,
  summary: str,
});

export const companyCandidateAnalysisSchema = z.object({
  analysis: str,
  top_candidates: z
    .array(
      z.object({
        candidate_id: str,
        fit_score: z.coerce.number().catch(0),
        notes: str,
      }),
    )
    .default([]),
});

// Combined single-call schema for scanResumeFromStorage.
export const fullResumeScanSchema = z.object({
  overall_score: score,
  ats_score: score,
  grammar_score: score,
  formatting_score: score,
  keyword_score: score,
  professionalism_score: score,
  suggestions: z.array(z.string()).max(8).default([]),
  summary: str,
  extracted_skills: z.array(z.string()).max(20).default([]),
  strengths: z.array(z.string()).max(5).default([]),
  weaknesses: z.array(z.string()).max(5).default([]),
  missing_skills: z.array(z.string()).max(10).default([]),
  keywords: z.array(z.string()).max(15).default([]),
  career_paths: z
    .array(
      z.object({
        title: str,
        why: str,
        next_steps: stringArray,
      }),
    )
    .max(4)
    .default([]),
  skill_gaps: z.array(z.string()).max(8).default([]),
  recommended_certifications: z
    .array(z.object({ name: str, provider: str }))
    .max(5)
    .default([]),
  suggested_projects: z
    .array(z.object({ title: str, description: str }))
    .max(4)
    .default([]),
  recommended_jobs: z
    .array(z.object({ title: str, why: str }))
    .max(5)
    .default([]),
  companies_hiring: z
    .array(z.object({ name: str, sector: str }))
    .max(5)
    .default([]),
  salary_prediction: z
    .object({
      low: score,
      mid: score,
      high: score,
      currency: str,
    })
    .nullable()
    .default(null),
  resume_improvements: z.array(z.string()).max(8).default([]),
  interview_prep_plan: z
    .object({
      thirty_days: stringArray,
      sixty_days: stringArray,
      ninety_days: stringArray,
      one_eighty_days: stringArray,
    })
    .nullable()
    .default(null),
});

export type FullResumeScan = z.infer<typeof fullResumeScanSchema>;

export const careerCoachResponseSchema = z.object({
  advice: str,
  recommended_skills: z.array(z.string()).max(8).default([]),
  action_plan: z.array(z.string()).max(6).default([]),
  improvement_suggestions: z.array(z.string()).max(6).default([]),
  follow_up_questions: z.array(z.string()).max(3).default([]),
});

export type CareerCoachResponse = z.infer<typeof careerCoachResponseSchema>;
export type CareerRecommendations = z.infer<typeof careerRecommendationsSchema>;
export type LinkedinImport = z.infer<typeof linkedinImportSchema>;
export type LearningRecommendations = z.infer<typeof learningRecommendationsSchema>;
export type CoverLetter = z.infer<typeof coverLetterSchema>;
export type InterviewQuestions = z.infer<typeof interviewQuestionsSchema>;
export type CandidateRanking = z.infer<typeof candidateRankingSchema>;
export type JobMatching = z.infer<typeof jobMatchingSchema>;
export type HiringRecommendation = z.infer<typeof hiringRecommendationSchema>;
export type StrengthWeakness = z.infer<typeof strengthWeaknessSchema>;
export type CompanyCandidateAnalysis = z.infer<typeof companyCandidateAnalysisSchema>;
