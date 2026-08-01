import { z } from "zod";

const score = z.number().min(0).max(100);
const stringArray = z.array(z.string()).default([]);
const priority = z.enum(["high", "medium", "low"]);

// ── Resume & Profile ──────────────────────────────────────────────────────────

export const coverLetterGeneratorSchema = z.object({
  cover_letter: z.string(),
  tone: z.string().default("professional"),
  word_count: z.number().optional().default(0),
  key_strengths_highlighted: stringArray,
});

export const resumeOptimizerSchema = z.object({
  optimized_sections: z
    .array(
      z.object({
        section: z.string(),
        original: z.string(),
        optimized: z.string(),
        improvements: stringArray,
      }),
    )
    .default([]),
  overall_recommendation: z.string(),
  ats_optimization_score: score,
});

export const linkedinOptimizerSchema = z.object({
  headline_suggestions: stringArray,
  about_suggestions: z.array(z.object({ original: z.string(), optimized: z.string() })).default([]),
  skills_to_add: stringArray,
  experience_improvements: z
    .array(z.object({ role: z.string(), suggestion: z.string() }))
    .default([]),
  profile_completeness_score: score,
});

export const personalBrandSchema = z.object({
  brand_statement: z.string(),
  key_differentiators: stringArray,
  elevator_pitch: z.string(),
  online_presence_tips: stringArray,
  content_strategy: stringArray,
});

export const bioGeneratorSchema = z.object({
  short_bio: z.string(),
  medium_bio: z.string(),
  long_bio: z.string(),
  tone: z.string().default("professional"),
  keywords: stringArray,
});

// ── Job Search & Matching ─────────────────────────────────────────────────────

export const jobMatchAnalyzerSchema = z.object({
  matches: z
    .array(
      z.object({
        job_title: z.string(),
        company: z.string().default(""),
        match_score: score,
        matching_skills: stringArray,
        missing_skills: stringArray,
        recommendation: z.string(),
      }),
    )
    .default([]),
  summary: z.string(),
});

export const jobSearchStrategySchema = z.object({
  target_roles: stringArray,
  search_keywords: stringArray,
  boolean_search_strings: stringArray,
  sourcing_channels: z.array(z.object({ channel: z.string(), strategy: z.string() })).default([]),
  networking_tips: stringArray,
  weekly_action_plan: stringArray,
});

export const salaryAnalyzerSchema = z.object({
  market_range: z
    .object({ low: z.number(), mid: z.number(), high: z.number(), currency: z.string() })
    .nullable()
    .default(null),
  your_market_value: z.number().optional(),
  negotiation_leverage: stringArray,
  benchmark_comparisons: z
    .array(z.object({ role: z.string(), avg_salary: z.number(), location: z.string() }))
    .default([]),
  negotiation_script: z.string(),
});

export const offerEvaluatorSchema = z.object({
  overall_score: score,
  salary_rating: z.string(),
  benefits_rating: z.string(),
  growth_rating: z.string(),
  work_life_balance_rating: z.string(),
  pros: stringArray,
  cons: stringArray,
  negotiation_points: stringArray,
  recommendation: z.string(),
});

export const relocationAdvisorSchema = z.object({
  cost_of_living_comparison: z
    .array(z.object({ category: z.string(), current: z.string(), target: z.string() }))
    .default([]),
  salary_adjustment: z.string(),
  lifestyle_factors: stringArray,
  job_market_outlook: z.string(),
  recommendations: stringArray,
});

// ── Interview Preparation ────────────────────────────────────────────────────

export const interviewPrepSchema = z.object({
  likely_questions: z
    .array(
      z.object({
        question: z.string(),
        category: z.enum(["technical", "behavioral", "situational"]),
        difficulty: z.enum(["easy", "medium", "hard"]),
        guidance: z.string(),
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
        question: z.string(),
        your_answer_summary: z.string(),
        feedback: z.string(),
        improved_answer: z.string(),
      }),
    )
    .default([]),
  next_steps: stringArray,
});

export const behavioralQuestionPrepSchema = z.object({
  star_stories: z
    .array(
      z.object({
        question: z.string(),
        situation: z.string(),
        task: z.string(),
        action: z.string(),
        result: z.string(),
      }),
    )
    .default([]),
  tips: stringArray,
});

export const technicalInterviewPrepSchema = z.object({
  topics_to_review: stringArray,
  practice_problems: z
    .array(z.object({ topic: z.string(), problem: z.string(), approach: z.string() }))
    .default([]),
  key_concepts: stringArray,
  resources: z.array(z.object({ name: z.string(), url: z.string().default("") })).default([]),
});

// ── Career Development ────────────────────────────────────────────────────────

export const skillRoadmapSchema = z.object({
  current_assessment: z.string(),
  target_skills: z
    .array(
      z.object({
        skill: z.string(),
        current_level: z.string(),
        target_level: z.string(),
        priority,
        learning_resources: stringArray,
        estimated_time: z.string(),
      }),
    )
    .default([]),
  milestones: z
    .array(z.object({ milestone: z.string(), target_date: z.string(), criteria: stringArray }))
    .default([]),
  summary: z.string(),
});

export const careerTransitionPlannerSchema = z.object({
  transition_feasibility: z.string(),
  transferable_skills: stringArray,
  skills_to_acquire: stringArray,
  transition_timeline: z
    .array(
      z.object({
        phase: z.string(),
        duration: z.string(),
        actions: stringArray,
      }),
    )
    .default([]),
  recommended_roles: z.array(z.object({ title: z.string(), why: z.string() })).default([]),
  risks: stringArray,
});

export const mentorshipMatcherSchema = z.object({
  mentor_criteria: stringArray,
  suggested_mentor_types: z
    .array(z.object({ type: z.string(), why: z.string(), where_to_find: z.string() }))
    .default([]),
  networking_strategy: stringArray,
  outreach_templates: z.array(z.object({ scenario: z.string(), template: z.string() })).default([]),
});

export const goalPlannerSchema = z.object({
  goals: z
    .array(
      z.object({
        goal: z.string(),
        category: z.enum(["career", "skill", "networking", "personal"]),
        timeline: z.string(),
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
        title: z.string(),
        provider: z.string().default(""),
        url: z.string().default(""),
        level: z.string().default("intermediate"),
        skills_gained: stringArray,
        estimated_hours: z.string().default(""),
        why: z.string(),
      }),
    )
    .default([]),
  learning_path: stringArray,
  summary: z.string(),
});

export const certificationAdvisorSchema = z.object({
  recommended_certifications: z
    .array(
      z.object({
        name: z.string(),
        provider: z.string(),
        level: z.string(),
        cost_estimate: z.string().default(""),
        prep_time: z.string().default(""),
        career_impact: z.string(),
        prerequisite: z.string().default(""),
      }),
    )
    .default([]),
  priority_order: stringArray,
  summary: z.string(),
});

export const projectIdeaGeneratorSchema = z.object({
  projects: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        skills_demonstrated: stringArray,
        difficulty: z.enum(["beginner", "intermediate", "advanced"]),
        estimated_time: z.string().default(""),
        tech_stack: stringArray,
      }),
    )
    .default([]),
  summary: z.string(),
});

export const portfolioOptimizerSchema = z.object({
  portfolio_assessment: z.string(),
  improvements: z
    .array(
      z.object({
        section: z.string(),
        current_state: z.string(),
        recommendation: z.string(),
      }),
    )
    .default([]),
  projects_to_add: stringArray,
  presentation_tips: stringArray,
  overall_score: score,
});
