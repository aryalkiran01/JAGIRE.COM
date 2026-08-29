import { z } from "zod";

// ── Shared building blocks ──────────────────────────────────────────────────
// .catch(0) ensures formatted strings like "85%" or "Rs. 50,000" that fail
// Number() coercion fall back to 0 instead of throwing and failing the whole response.
const score = z.coerce.number().min(0).max(100).catch(0);
const stringArray = z.array(z.string()).default([]);
const str = z.string().default("");
const priority = z.enum(["high", "medium", "low"]).catch("medium");

// ── Resume & Profile ──────────────────────────────────────────────────────────

export const coverLetterGeneratorSchema = z.object({
  cover_letter: str,
  tone: str,
  word_count: z.coerce.number().catch(0),
  key_strengths_highlighted: stringArray,
});

export const resumeOptimizerSchema = z.object({
  optimized_sections: z
    .array(
      z.object({
        section: str,
        original: str,
        optimized: str,
        improvements: stringArray,
      }),
    )
    .default([]),
  overall_recommendation: str,
  ats_optimization_score: score,
});

export const linkedinOptimizerSchema = z.object({
  headline_suggestions: stringArray,
  about_suggestions: z.array(z.object({ original: str, optimized: str })).default([]),
  skills_to_add: stringArray,
  experience_improvements: z.array(z.object({ role: str, suggestion: str })).default([]),
  profile_completeness_score: score,
});

export const personalBrandSchema = z.object({
  brand_statement: str,
  key_differentiators: stringArray,
  elevator_pitch: str,
  online_presence_tips: stringArray,
  content_strategy: stringArray,
});

export const bioGeneratorSchema = z.object({
  short_bio: str,
  medium_bio: str,
  long_bio: str,
  tone: str,
  keywords: stringArray,
});

// ── Job Search & Matching ─────────────────────────────────────────────────────

export const jobMatchAnalyzerSchema = z.object({
  matches: z
    .array(
      z.object({
        job_title: str,
        company: str,
        match_score: score,
        matching_skills: stringArray,
        missing_skills: stringArray,
        recommendation: str,
      }),
    )
    .default([]),
  summary: str,
});

export const jobSearchStrategySchema = z.object({
  target_roles: stringArray,
  search_keywords: stringArray,
  boolean_search_strings: stringArray,
  sourcing_channels: z.array(z.object({ channel: str, strategy: str })).default([]),
  networking_tips: stringArray,
  weekly_action_plan: stringArray,
});

export const salaryAnalyzerSchema = z.object({
  market_range: z
    .object({
      low: z.coerce.number().catch(0),
      mid: z.coerce.number().catch(0),
      high: z.coerce.number().catch(0),
      currency: str,
    })
    .nullable()
    .default(null),
  your_market_value: z.coerce.number().catch(0),
  negotiation_leverage: stringArray,
  benchmark_comparisons: z
    .array(
      z.object({
        role: str,
        avg_salary: z.coerce.number().catch(0),
        location: str,
      }),
    )
    .default([]),
  negotiation_script: str,
});

export const offerEvaluatorSchema = z.object({
  overall_score: score,
  salary_rating: str,
  benefits_rating: str,
  growth_rating: str,
  work_life_balance_rating: str,
  pros: stringArray,
  cons: stringArray,
  negotiation_points: stringArray,
  recommendation: str,
});

export const relocationAdvisorSchema = z.object({
  cost_of_living_comparison: z
    .array(z.object({ category: str, current: str, target: str }))
    .default([]),
  salary_adjustment: str,
  lifestyle_factors: stringArray,
  job_market_outlook: str,
  recommendations: stringArray,
});

// ── Interview Preparation ────────────────────────────────────────────────────

export const interviewPrepSchema = z.object({
  likely_questions: z
    .array(
      z.object({
        question: str,
        category: z.enum(["technical", "behavioral", "situational"]).catch("technical"),
        difficulty: z.enum(["easy", "medium", "hard"]).catch("medium"),
        guidance: str,
      }),
    )
    .default([]),
  preparation_checklist: stringArray,
  key_talking_points: stringArray,
  red_flags_to_avoid: stringArray,
});

export const mockInterviewFeedbackSchema = z.object({
  overall_score: score,
  strengths: stringArray,
  areas_for_improvement: stringArray,
  specific_feedback: z
    .array(
      z.object({
        question: str,
        your_answer_summary: str,
        feedback: str,
        improved_answer: str,
      }),
    )
    .default([]),
  next_steps: stringArray,
});

export const behavioralQuestionPrepSchema = z.object({
  star_stories: z
    .array(
      z.object({
        question: str,
        situation: str,
        task: str,
        action: str,
        result: str,
      }),
    )
    .default([]),
  tips: stringArray,
});

export const technicalInterviewPrepSchema = z.object({
  topics_to_review: stringArray,
  practice_problems: z.array(z.object({ topic: str, problem: str, approach: str })).default([]),
  key_concepts: stringArray,
  resources: z.array(z.object({ name: str, url: str })).default([]),
});

// ── Career Development ────────────────────────────────────────────────────────

export const skillRoadmapSchema = z.object({
  current_assessment: str,
  target_skills: z
    .array(
      z.object({
        skill: str,
        current_level: str,
        target_level: str,
        priority,
        learning_resources: stringArray,
        estimated_time: str,
      }),
    )
    .default([]),
  milestones: z
    .array(z.object({ milestone: str, target_date: str, criteria: stringArray }))
    .default([]),
  summary: str,
});

export const careerTransitionPlannerSchema = z.object({
  transition_feasibility: str,
  transferable_skills: stringArray,
  skills_to_acquire: stringArray,
  transition_timeline: z
    .array(
      z.object({
        phase: str,
        duration: str,
        actions: stringArray,
      }),
    )
    .default([]),
  recommended_roles: z.array(z.object({ title: str, why: str })).default([]),
  risks: stringArray,
});

export const mentorshipMatcherSchema = z.object({
  mentor_criteria: stringArray,
  suggested_mentor_types: z
    .array(z.object({ type: str, why: str, where_to_find: str }))
    .default([]),
  networking_strategy: stringArray,
  outreach_templates: z.array(z.object({ scenario: str, template: str })).default([]),
});

export const goalPlannerSchema = z.object({
  goals: z
    .array(
      z.object({
        goal: str,
        category: z.enum(["career", "skill", "networking", "personal"]).catch("career"),
        timeline: str,
        milestones: stringArray,
        success_metrics: stringArray,
      }),
    )
    .default([]),
  quarterly_priorities: stringArray,
  accountability_tips: stringArray,
});

// ── Learning & Development ────────────────────────────────────────────────────

export const courseRecommenderSchema = z.object({
  courses: z
    .array(
      z.object({
        title: str,
        provider: str,
        url: str,
        level: str,
        skills_gained: stringArray,
        estimated_hours: str,
        why: str,
      }),
    )
    .default([]),
  learning_path: stringArray,
  summary: str,
});

export const certificationAdvisorSchema = z.object({
  recommended_certifications: z
    .array(
      z.object({
        name: str,
        provider: str,
        level: str,
        cost_estimate: str,
        prep_time: str,
        career_impact: str,
        prerequisite: str,
      }),
    )
    .default([]),
  priority_order: stringArray,
  summary: str,
});

export const projectIdeaGeneratorSchema = z.object({
  projects: z
    .array(
      z.object({
        title: str,
        description: str,
        skills_demonstrated: stringArray,
        difficulty: z.enum(["beginner", "intermediate", "advanced"]).catch("intermediate"),
        estimated_time: str,
        tech_stack: stringArray,
      }),
    )
    .default([]),
  summary: str,
});

export const portfolioOptimizerSchema = z.object({
  portfolio_assessment: str,
  improvements: z
    .array(
      z.object({
        section: str,
        current_state: str,
        recommendation: str,
      }),
    )
    .default([]),
  projects_to_add: stringArray,
  presentation_tips: stringArray,
  overall_score: score,
});
