/* eslint-disable @typescript-eslint/no-explicit-any */

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth.middleware";
import { aiGenerateJsonValidated } from "@/integrations/ai/ai-service";
import { requirePremium } from "@/lib/premium.server";
import { getJobSeekerAiFeature } from "@/lib/jobseeker-ai-features";
import { z } from "zod";
import {
  coverLetterGeneratorSchema,
  resumeOptimizerSchema,
  linkedinOptimizerSchema,
  personalBrandSchema,
  bioGeneratorSchema,
  jobMatchAnalyzerSchema,
  jobSearchStrategySchema,
  salaryAnalyzerSchema,
  offerEvaluatorSchema,
  relocationAdvisorSchema,
  interviewPrepSchema,
  mockInterviewFeedbackSchema,
  behavioralQuestionPrepSchema,
  technicalInterviewPrepSchema,
  skillRoadmapSchema,
  careerTransitionPlannerSchema,
  mentorshipMatcherSchema,
  goalPlannerSchema,
  courseRecommenderSchema,
  certificationAdvisorSchema,
  projectIdeaGeneratorSchema,
  portfolioOptimizerSchema,
} from "@/integrations/ai/jobseeker-ai-schemas";

interface FeatureConfig {
  schema: z.ZodType<any>;
  systemPrompt: string;
}

const FEATURE_CONFIGS: Record<string, FeatureConfig> = {
  "cover-letter-generator": {
    schema: coverLetterGeneratorSchema,
    systemPrompt:
      "You are an AI cover letter writer. Generate a tailored, professional cover letter. " +
      "Return JSON: {cover_letter(string),tone(string),word_count(int),key_strengths_highlighted[string]}",
  },
  "resume-optimizer": {
    schema: resumeOptimizerSchema,
    systemPrompt:
      "You are an AI resume optimizer. Improve resume sections for ATS and impact. " +
      "Return JSON: {optimized_sections:[{section,original,optimized,improvements[]}]," +
      "overall_recommendation,ats_optimization_score(0-100)}",
  },
  "linkedin-optimizer": {
    schema: linkedinOptimizerSchema,
    systemPrompt:
      "You are an AI LinkedIn profile optimizer. Improve profile for recruiter discovery. " +
      "Return JSON: {headline_suggestions[],about_suggestions:[{original,optimized}]," +
      "skills_to_add[],experience_improvements:[{role,suggestion}],profile_completeness_score(0-100)}",
  },
  "personal-brand": {
    schema: personalBrandSchema,
    systemPrompt:
      "You are an AI personal branding expert. Craft a compelling personal brand. " +
      "Return JSON: {brand_statement,key_differentiators[],elevator_pitch," +
      "online_presence_tips[],content_strategy[]}",
  },
  "bio-generator": {
    schema: bioGeneratorSchema,
    systemPrompt:
      "You are an AI bio generator. Create professional bios in three lengths. " +
      "Return JSON: {short_bio,medium_bio,long_bio,tone,keywords[]}",
  },
  "job-match-analyzer": {
    schema: jobMatchAnalyzerSchema,
    systemPrompt:
      "You are an AI job match analyzer. Compare the user's profile to open roles. " +
      "Return JSON: {matches:[{job_title,company,match_score(0-100),matching_skills[]," +
      "missing_skills[],recommendation}],summary}",
  },
  "job-search-strategy": {
    schema: jobSearchStrategySchema,
    systemPrompt:
      "You are an AI job search strategist. Build a targeted job search plan. " +
      "Return JSON: {target_roles[],search_keywords[],boolean_search_strings[]," +
      "sourcing_channels:[{channel,strategy}],networking_tips[],weekly_action_plan[]}",
  },
  "salary-analyzer": {
    schema: salaryAnalyzerSchema,
    systemPrompt:
      "You are an AI salary analyst. Analyze market value and negotiation strategy. " +
      "Use NPR (Nepali Rupees) for salary figures unless specified otherwise. " +
      "Return JSON: {market_range:{low,mid,high,currency}|null,your_market_value(number)," +
      "negotiation_leverage[],benchmark_comparisons:[{role,avg_salary,location}]," +
      "negotiation_script}",
  },
  "offer-evaluator": {
    schema: offerEvaluatorSchema,
    systemPrompt:
      "You are an AI job offer evaluator. Score the offer across multiple dimensions. " +
      "Return JSON: {overall_score(0-100),salary_rating,benefits_rating,growth_rating," +
      "work_life_balance_rating,pros[],cons[],negotiation_points[],recommendation}",
  },
  "relocation-advisor": {
    schema: relocationAdvisorSchema,
    systemPrompt:
      "You are an AI relocation advisor. Compare cost of living and job markets. " +
      "Return JSON: {cost_of_living_comparison:[{category,current,target}],salary_adjustment," +
      "lifestyle_factors[],job_market_outlook,recommendations[]}",
  },
  "interview-prep": {
    schema: interviewPrepSchema,
    systemPrompt:
      "You are an AI interview prep coach. Generate likely questions and a prep plan. " +
      'Return JSON: {likely_questions:[{question,category("technical"|"behavioral"|"situational"),' +
      'difficulty("easy"|"medium"|"hard"),guidance}],preparation_checklist[],' +
      "key_talking_points[],red_flags_to_avoid[]}",
  },
  "mock-interview-feedback": {
    schema: mockInterviewFeedbackSchema,
    systemPrompt:
      "You are an AI mock interview evaluator. Provide detailed feedback on answers. " +
      "Return JSON: {overall_score(0-100),strengths[],areas_for_improvement[]," +
      "specific_feedback:[{question,your_answer_summary,feedback,improved_answer}],next_steps[]}",
  },
  "behavioral-question-prep": {
    schema: behavioralQuestionPrepSchema,
    systemPrompt:
      "You are an AI behavioral interview coach. Build STAR-method stories. " +
      "Return JSON: {star_stories:[{question,situation,task,action,result}],tips[]}",
  },
  "technical-interview-prep": {
    schema: technicalInterviewPrepSchema,
    systemPrompt:
      "You are an AI technical interview coach. Recommend topics, problems, and concepts. " +
      "Return JSON: {topics_to_review[],practice_problems:[{topic,problem,approach}]," +
      "key_concepts[],resources:[{name,url}]}",
  },
  "skill-roadmap": {
    schema: skillRoadmapSchema,
    systemPrompt:
      "You are an AI skill development planner. Create a personalized skill roadmap. " +
      "Return JSON: {current_assessment,target_skills:[{skill,current_level,target_level," +
      'priority("high"|"medium"|"low"),learning_resources[],estimated_time}],' +
      "milestones:[{milestone,target_date,criteria[]}],summary}",
  },
  "career-transition-planner": {
    schema: careerTransitionPlannerSchema,
    systemPrompt:
      "You are an AI career transition planner. Plan a smooth career change. " +
      "Return JSON: {transition_feasibility,transferable_skills[],skills_to_acquire[]," +
      "transition_timeline:[{phase,duration,actions[]}],recommended_roles:[{title,why}],risks[]}",
  },
  "mentorship-matcher": {
    schema: mentorshipMatcherSchema,
    systemPrompt:
      "You are an AI mentorship advisor. Help find the right mentors. " +
      "Return JSON: {mentor_criteria[],suggested_mentor_types:[{type,why,where_to_find}]," +
      "networking_strategy[],outreach_templates:[{scenario,template}]}",
  },
  "goal-planner": {
    schema: goalPlannerSchema,
    systemPrompt:
      "You are an AI career goal planner. Set structured goals with milestones. " +
      'Return JSON: {goals:[{goal,category("career"|"skill"|"networking"|"personal"),' +
      "timeline,milestones[],success_metrics[]}],quarterly_priorities[],accountability_tips[]}",
  },
  "course-recommender": {
    schema: courseRecommenderSchema,
    systemPrompt:
      "You are an AI course recommender. Suggest courses with a learning path. " +
      "Return JSON: {courses:[{title,provider,url,level,skills_gained[],estimated_hours,why}]," +
      "learning_path[],summary}",
  },
  "certification-advisor": {
    schema: certificationAdvisorSchema,
    systemPrompt:
      "You are an AI certification advisor. Recommend certifications by career impact. " +
      "Return JSON: {recommended_certifications:[{name,provider,level,cost_estimate,prep_time," +
      "career_impact,prerequisite}],priority_order[],summary}",
  },
  "project-idea-generator": {
    schema: projectIdeaGeneratorSchema,
    systemPrompt:
      "You are an AI project idea generator. Suggest portfolio projects. " +
      "Return JSON: {projects:[{title,description,skills_demonstrated[]," +
      'difficulty("beginner"|"intermediate"|"advanced"),estimated_time,tech_stack[]}],summary}',
  },
  "portfolio-optimizer": {
    schema: portfolioOptimizerSchema,
    systemPrompt:
      "You are an AI portfolio optimizer. Improve portfolio presentation and projects. " +
      "Return JSON: {portfolio_assessment,improvements:[{section,current_state,recommendation}]," +
      "projects_to_add[],presentation_tips[],overall_score(0-100)}",
  },
};

async function buildJobSeekerContext(supabase: any, userId: string): Promise<string> {
  const ctx: string[] = [];

  const [{ data: profile }, { data: resume }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "full_name,headline,bio,location,experience_years,current_position,skills,education,experience",
      )
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("resumes")
      .select("overall_score,ats_score,parsed_data,career_roadmap")
      .eq("user_id", userId)
      .eq("is_default", true)
      .maybeSingle(),
  ]);

  if (profile) {
    ctx.push(`## User Profile\n${JSON.stringify(profile)}`);
  }

  if (resume) {
    const parsed = resume.parsed_data as any;
    const roadmap = resume.career_roadmap as any;
    ctx.push(
      `## Resume Analysis\n${JSON.stringify({
        overall_score: resume.overall_score,
        ats_score: resume.ats_score,
        extracted_skills: parsed?.skills ?? [],
        summary: parsed?.summary ?? "",
        missing_skills: roadmap?.missing_skills ?? [],
        strengths: roadmap?.strengths ?? [],
      })}`,
    );
  }

  const { data: applications } = await supabase
    .from("applications")
    .select("status, job:jobs(title)")
    .eq("seeker_id", userId)
    .limit(10);
  if (applications?.length) {
    ctx.push(
      `## Recent Applications\n${applications
        .map((a: any) => `- ${a.job?.title} (${a.status})`)
        .join("\n")}`,
    );
  }

  const { data: savedJobs } = await supabase
    .from("saved_jobs")
    .select("job:jobs(id,title)")
    .eq("user_id", userId)
    .limit(5);
  if (savedJobs?.length) {
    ctx.push(`## Saved Jobs\n${savedJobs.map((s: any) => `- ${s.job?.title}`).join("\n")}`);
  }

  const { data: activeJobs } = await supabase
    .from("jobs")
    .select(
      "id,title,required_skills,salary_min,salary_max,location,job_type, company:companies(name)",
    )
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(20);
  if (activeJobs?.length) {
    ctx.push(
      `## Active Jobs (sample)\n${activeJobs
        .map(
          (j: any) =>
            `- ${j.title} at ${j.company?.name ?? "?"} | Skills: ${(j.required_skills ?? []).join(", ")}`,
        )
        .join("\n")}`,
    );
  }

  return ctx.join("\n\n");
}

export const runJobSeekerAiFeature = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = input as { featureSlug: string; message: string };
    if (!i?.featureSlug) throw new Error("Feature slug is required");
    if (!i?.message?.trim()) throw new Error("Message is required");
    return { featureSlug: i.featureSlug, message: i.message.trim().slice(0, 6000) };
  })
  .handler(async ({ data, context }) => {
    await requirePremium(context.userId);
    const feature = getJobSeekerAiFeature(data.featureSlug);
    if (!feature) throw new Error("Unknown AI feature");

    const config = FEATURE_CONFIGS[data.featureSlug];
    if (!config) throw new Error("AI feature not configured");

    const userContext = await buildJobSeekerContext(context.supabase, context.userId);
    const prompt = [
      `## Your Profile & Context\n${userContext || "No profile data yet."}`,
      `## Request\n${data.message}`,
    ].join("\n\n");

    const result = await aiGenerateJsonValidated(
      prompt,
      config.systemPrompt,
      config.schema,
      "general",
    );

    return {
      response: result as Record<string, unknown>,
      structured: result as Record<string, unknown>,
      featureTitle: feature.title,
    };
  });
