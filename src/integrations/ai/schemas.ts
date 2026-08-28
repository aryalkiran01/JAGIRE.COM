import { z } from "zod";

export const resumeAnalysisSchema = z.object({
  overall_score: z.coerce.number().catch(0),
  ats_score: z.coerce.number().catch(0),
  grammar_score: z.coerce.number().catch(0),
  formatting_score: z.coerce.number().catch(0),
  keyword_score: z.coerce.number().catch(0),
  professionalism_score: z.coerce.number().catch(0),
  suggestions: z.array(z.string()).max(8).default([]),
  summary: z.string().default(""),
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
    .object({
      low: z.coerce.number().catch(0),
      mid: z.coerce.number().catch(0),
      high: z.coerce.number().catch(0),
      currency: z.string().default("NPR"),
    })
    .optional()
    .nullable()
    .default(null),
  resume_improvements: z.array(z.string()).optional().default([]),
  interview_prep_plan: z
    .object({
      thirty_days: z.array(z.string()).default([]),
      sixty_days: z.array(z.string()).default([]),
      ninety_days: z.array(z.string()).default([]),
      one_eighty_days: z.array(z.string()).default([]),
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
  experience_years: z.coerce.number().optional().default(0),
  skills: z.array(z.string()).max(20).optional().default([]),
});

// Should look something like this:
export const learningRecommendationsSchema = z.object({
  items: z
    .array(
      z.object({
        kind: z.enum(["course", "video", "challenge", "interview"]),
        title: z.string(),
        provider: z.string(),
        description: z.string(),
        skills: z.array(z.string()),
        url: z.string().optional().default(""),
      }),
    )
    .min(1)
    .max(8),
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
      rank: z.coerce.number().catch(0),
      score: z.coerce.number().catch(0),
      reasons: z.array(z.string()).default([]),
    }),
  ).default([]),
});

export const jobMatchingSchema = z.object({
  matches: z.array(
    z.object({
      job_id: z.string(),
      score: z.coerce.number().catch(0),
      reasons: z.array(z.string()).default([]),
    }),
  ).default([]),
});

export const hiringRecommendationSchema = z.object({
  recommendation: z.string(),
  confidence: z.coerce.number().catch(0),
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
        fit_score: z.coerce.number().catch(0),
        notes: z.string().default(""),
      }),
    )
    .optional()
    .default([]),
});

// Combined single-call schema for scanResumeFromStorage.
// Merges resume scoring, career roadmap, strengths/weaknesses, and
// improvement suggestions so only ONE Ollama call is needed per upload.
export const fullResumeScanSchema = z.object({
  overall_score: z.coerce.number().catch(0),
  ats_score: z.coerce.number().catch(0),
  grammar_score: z.coerce.number().catch(0),
  formatting_score: z.coerce.number().catch(0),
  keyword_score: z.coerce.number().catch(0),
  professionalism_score: z.coerce.number().catch(0),
  suggestions: z.array(z.string()).max(8).default([]),
  summary: z.string().default(""),
  extracted_skills: z.array(z.string()).max(20).default([]),
  strengths: z.array(z.string()).max(5).default([]),
  weaknesses: z.array(z.string()).max(5).default([]),
  missing_skills: z.array(z.string()).max(10).default([]),
  keywords: z.array(z.string()).max(15).default([]),
  career_paths: z
    .array(z.object({ title: z.string().default(""), why: z.string().default(""), next_steps: z.array(z.string()).default([]) }))
    .max(4)
    .default([]),
  skill_gaps: z.array(z.string()).max(8).default([]),
  recommended_certifications: z
    .array(z.object({ name: z.string().default(""), provider: z.string().default("") }))
    .max(5)
    .default([]),
  suggested_projects: z
    .array(z.object({ title: z.string().default(""), description: z.string().default("") }))
    .max(4)
    .default([]),
  recommended_jobs: z
    .array(z.object({ title: z.string().default(""), why: z.string().default("") }))
    .max(5)
    .default([]),
  companies_hiring: z
    .array(z.object({ name: z.string().default(""), sector: z.string().default("") }))
    .max(5)
    .default([]),
  salary_prediction: z
    .object({
      low: z.coerce.number().catch(0),
      mid: z.coerce.number().catch(0),
      high: z.coerce.number().catch(0),
      currency: z.string().default("NPR"),
    })
    .nullable()
    .default(null),
  resume_improvements: z.array(z.string()).max(8).default([]),
  interview_prep_plan: z
    .object({
      thirty_days: z.array(z.string()).default([]),
      sixty_days: z.array(z.string()).default([]),
      ninety_days: z.array(z.string()).default([]),
      one_eighty_days: z.array(z.string()).default([]),
    })
    .nullable()
    .default(null),
});

export type FullResumeScan = z.infer<typeof fullResumeScanSchema>;
export const careerCoachResponseSchema = z.object({
  advice: z.string(),
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
