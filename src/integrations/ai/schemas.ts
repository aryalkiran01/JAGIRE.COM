import { z } from "zod";

export const resumeAnalysisSchema = z.object({
  overall_score: z.number(),
  ats_score: z.number(),
  grammar_score: z.number(),
  formatting_score: z.number(),
  keyword_score: z.number(),
  professionalism_score: z.number(),
  suggestions: z.array(z.string()).max(8).default([]),
  summary: z.string(),
  extracted_skills: z.array(z.string()).max(20).default([]),
});

export const careerRecommendationsSchema = z.object({
  career_paths: z
    .array(
      z.object({
        title: z.string(),
        why: z.string(),
        next_steps: z.array(z.string()),
      }),
    )
    .optional()
    .default([]),
  skill_gaps: z.array(z.string()).optional().default([]),
  missing_skills: z.array(z.string()).optional().default([]),
  recommended_certifications: z
    .array(z.object({ name: z.string(), provider: z.string() }))
    .optional()
    .default([]),
  suggested_projects: z
    .array(z.object({ title: z.string(), description: z.string() }))
    .optional()
    .default([]),
  recommended_jobs: z
    .array(z.object({ title: z.string(), why: z.string() }))
    .optional()
    .default([]),
  companies_hiring: z
    .array(z.object({ name: z.string(), sector: z.string() }))
    .optional()
    .default([]),
  salary_prediction: z
    .object({ low: z.number(), mid: z.number(), high: z.number(), currency: z.string() })
    .optional()
    .nullable()
    .default(null),
  resume_improvements: z.array(z.string()).optional().default([]),
  interview_prep_plan: z
    .object({
      thirty_days: z.array(z.string()),
      sixty_days: z.array(z.string()),
      ninety_days: z.array(z.string()),
      one_eighty_days: z.array(z.string()),
    })
    .optional()
    .nullable()
    .default(null),
  suggested_search_keywords: z.array(z.string()).optional().default([]),
});

export const linkedinImportSchema = z.object({
  full_name: z.string().nullable().optional(),
  headline: z.string().nullable().optional(),
  about: z.string().optional().default(""),
  location: z.string().nullable().optional(),
  current_position: z.string().nullable().optional(),
  experience_years: z.number().optional().default(0),
  skills: z.array(z.string()).max(20).optional().default([]),
});

export const learningRecommendationsSchema = z.object({
  items: z
    .array(
      z.object({
        kind: z.string(),
        title: z.string(),
        provider: z.string().optional().default(""),
        url: z.string().optional().default(""),
        skills: z.array(z.string()).optional().default([]),
        description: z.string().optional().default(""),
      }),
    )
    .default([]),
});

export const coverLetterSchema = z.object({
  cover_letter: z.string(),
});

export const interviewQuestionsSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string(),
      category: z.string().optional().default("general"),
      difficulty: z.string().optional().default("medium"),
      sample_answer: z.string().optional().default(""),
    }),
  ),
});

export const candidateRankingSchema = z.object({
  candidates: z.array(
    z.object({
      candidate_id: z.string(),
      rank: z.number(),
      score: z.number(),
      reasons: z.array(z.string()),
    }),
  ),
});

export const jobMatchingSchema = z.object({
  matches: z.array(
    z.object({
      job_id: z.string(),
      score: z.number(),
      reasons: z.array(z.string()),
    }),
  ),
});

export const hiringRecommendationSchema = z.object({
  recommendation: z.string(),
  confidence: z.number(),
  reasoning: z.string(),
  risk_factors: z.array(z.string()).optional().default([]),
});

export const strengthWeaknessSchema = z.object({
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  summary: z.string().optional().default(""),
});

export const companyCandidateAnalysisSchema = z.object({
  analysis: z.string(),
  top_candidates: z
    .array(
      z.object({
        candidate_id: z.string(),
        fit_score: z.number(),
        notes: z.string(),
      }),
    )
    .optional()
    .default([]),
});

// Combined single-call schema for scanResumeFromStorage.
// Merges resume scoring, career roadmap, strengths/weaknesses, and
// improvement suggestions so only ONE Ollama call is needed per upload.
export const fullResumeScanSchema = z.object({
  // scoring
  overall_score: z.number(),
  ats_score: z.number(),
  grammar_score: z.number(),
  formatting_score: z.number(),
  keyword_score: z.number(),
  professionalism_score: z.number(),
  // quick wins
  suggestions: z.array(z.string()).max(8).default([]),
  summary: z.string(),
  extracted_skills: z.array(z.string()).max(20).default([]),
  // analysis
  strengths: z.array(z.string()).max(5).default([]),
  weaknesses: z.array(z.string()).max(5).default([]),
  missing_skills: z.array(z.string()).max(10).default([]),
  keywords: z.array(z.string()).max(15).default([]),
  // career roadmap
  career_paths: z
    .array(z.object({ title: z.string(), why: z.string(), next_steps: z.array(z.string()) }))
    .max(4)
    .default([]),
  skill_gaps: z.array(z.string()).max(8).default([]),
  recommended_certifications: z
    .array(z.object({ name: z.string(), provider: z.string() }))
    .max(5)
    .default([]),
  suggested_projects: z
    .array(z.object({ title: z.string(), description: z.string() }))
    .max(4)
    .default([]),
  recommended_jobs: z
    .array(z.object({ title: z.string(), why: z.string() }))
    .max(5)
    .default([]),
  companies_hiring: z
    .array(z.object({ name: z.string(), sector: z.string() }))
    .max(5)
    .default([]),
  salary_prediction: z
    .object({ low: z.number(), mid: z.number(), high: z.number(), currency: z.string() })
    .nullable()
    .default(null),
  resume_improvements: z.array(z.string()).max(8).default([]),
  interview_prep_plan: z
    .object({
      thirty_days: z.array(z.string()),
      sixty_days: z.array(z.string()),
      ninety_days: z.array(z.string()),
      one_eighty_days: z.array(z.string()),
    })
    .nullable()
    .default(null),
});

export type FullResumeScan = z.infer<typeof fullResumeScanSchema>;
export type ResumeAnalysis = z.infer<typeof resumeAnalysisSchema>;
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
