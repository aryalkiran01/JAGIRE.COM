/* eslint-disable @typescript-eslint/no-explicit-any */

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth.middleware";
import { aiGenerateJsonValidated } from "@/integrations/ai/ai-service";
import { aiGenerateEmbedding } from "@/integrations/ai/ai-service";
import { requirePremium } from "@/lib/premium.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getAiFeature } from "@/lib/employer-ai-features";
import { z } from "zod";
import {
  candidateMatchSchema,
  resumeScreeningSchema,
  resumeRankingSchema,
  smartShortlistingSchema,
  candidateRankingSchema,
  candidateSummarySchema,
  hiringRecommendationSchema,
  candidateSuccessPredictionSchema,
  talentSearchSchema,
  duplicateCandidateDetectionSchema,
  skillGapAnalysisSchema,
  interviewQuestionGeneratorSchema,
  jobDescriptionWriterSchema,
  jobDescriptionOptimizerSchema,
  hiringAnalyticsSchema,
  emailAssistantSchema,
  meetingSchedulerSchema,
  onboardingAssistantSchema,
  officeDashboardSchema,
  recruitmentAutomationSchema,
  workflowBuilderSchema,
  predictiveHiringAnalyticsSchema,
  workforcePlanningSchema,
  privateAiModelsSchema,
  companyKnowledgeAiSchema,
  talentIntelligenceSchema,
  whiteLabelAssistantSchema,
  dedicatedAiSuccessManagerSchema,
} from "@/integrations/ai/employer-ai-schemas";

interface FeatureConfig {
  schema: z.ZodType<any>;
  systemPrompt: string;
}

const FEATURE_CONFIGS: Record<string, FeatureConfig> = {
  "candidate-match": {
    schema: candidateMatchSchema,
    systemPrompt:
      "You are an AI recruitment assistant. Match candidates to the given job. " +
      "Return JSON: {matches:[{candidate_name,match_score(0-100),matching_strengths[],gaps[],recommendation}],summary}",
  },
  "resume-screening": {
    schema: resumeScreeningSchema,
    systemPrompt:
      "You are an AI resume screening assistant. Screen resumes against job requirements. " +
      'Return JSON: {results:[{candidate_name,status("qualified"|"borderline"|"unqualified"),score(0-100),reasons[]}],summary}',
  },
  "resume-ranking": {
    schema: resumeRankingSchema,
    systemPrompt:
      "You are an AI resume ranking assistant. Rank candidates from strongest to weakest. " +
      "Return JSON: {ranking:[{candidate_name,rank,fit_score(0-100),justification}],summary}",
  },
  "smart-shortlisting": {
    schema: smartShortlistingSchema,
    systemPrompt:
      "You are an AI shortlisting assistant. Shortlist top candidates for interview. " +
      'Return JSON: {shortlisted:[{candidate_name,rationale,priority("high"|"medium"|"low")}],' +
      "not_shortlisted:[{candidate_name,reason}],summary}",
  },
  "candidate-ranking": {
    schema: candidateRankingSchema,
    systemPrompt:
      "You are an AI candidate ranking assistant. Compare candidates side-by-side. " +
      "Return JSON: {ranking:[{candidate_name,rank,strengths[],concerns[],overall_score(0-100)}],summary}",
  },
  "candidate-summary": {
    schema: candidateSummarySchema,
    systemPrompt:
      "You are an AI candidate summarizer. Produce a concise professional summary. " +
      "Return JSON: {summary,top_skills[],experience_highlights[],red_flags[],recommended_next_steps[]}",
  },
  "hiring-recommendation": {
    schema: hiringRecommendationSchema,
    systemPrompt:
      "You are an AI hiring advisor. Give a data-backed recommendation. " +
      'Return JSON: {recommendation("HIRE"|"NO-HIRE"|"HOLD"),confidence(0-100),reasoning,risk_factors[],suggested_role}',
  },
  "candidate-success-prediction": {
    schema: candidateSuccessPredictionSchema,
    systemPrompt:
      "You are an AI predictive hiring analyst. Predict on-the-job success. " +
      'Return JSON: {prediction("Low"|"Medium"|"High"),confidence(0-100),contributing_factors[],rationale}',
  },
  "talent-search": {
    schema: talentSearchSchema,
    systemPrompt:
      "You are an AI talent search assistant. Build a sourcing strategy. " +
      "Return JSON: {ideal_candidate_profile,search_keywords[],boolean_strings[],sourcing_channels[],summary}",
  },
  "duplicate-candidate-detection": {
    schema: duplicateCandidateDetectionSchema,
    systemPrompt:
      "You are an AI duplicate detection assistant. Flag likely duplicate profiles. " +
      "Return JSON: {duplicates:[{candidate_name,likely_duplicate_of,confidence(0-100),matching_fields[]}],unique_count,summary}",
  },
  "skill-gap-analysis": {
    schema: skillGapAnalysisSchema,
    systemPrompt:
      "You are an AI skill gap analyst. Compare current vs target skills. " +
      'Return JSON: {gaps:[{skill,current_level,target_level,priority("high"|"medium"|"low"),learning_path[]}],summary}',
  },
  "interview-question-generator": {
    schema: interviewQuestionGeneratorSchema,
    systemPrompt:
      "You are an AI interview question generator. Generate role-specific questions. " +
      'Return JSON: {questions:[{question,category("technical"|"behavioral"|"situational"),' +
      'difficulty("easy"|"medium"|"hard"),guidance}],summary}',
  },
  "job-description-writer": {
    schema: jobDescriptionWriterSchema,
    systemPrompt:
      "You are an AI job description writer. Write a compelling, inclusive, SEO-friendly job post. " +
      "Return JSON: {title,summary,responsibilities[],requirements[],preferred_qualifications[],benefits[],full_description}",
  },
  "job-description-optimizer": {
    schema: jobDescriptionOptimizerSchema,
    systemPrompt:
      "You are an AI job description optimizer. Improve for clarity, inclusivity, reach, and conversion. " +
      "Return JSON: {optimized_description,changes_made[],clarity_score(0-100),inclusivity_score(0-100),seo_score(0-100)}",
  },
  "hiring-analytics": {
    schema: hiringAnalyticsSchema,
    systemPrompt:
      "You are an AI hiring analytics assistant. Analyze the hiring funnel. " +
      "Return JSON: {insights[],bottlenecks:[{stage,issue,impact}],time_to_hire_trend,recommendations[],summary}",
  },
  "email-assistant": {
    schema: emailAssistantSchema,
    systemPrompt:
      "You are an AI email assistant for recruiters. Draft a professional candidate email. " +
      "Return JSON: {subject,body,tone}",
  },
  "meeting-scheduler": {
    schema: meetingSchedulerSchema,
    systemPrompt:
      "You are an AI meeting scheduler. Propose interview slots and format invite text. " +
      "Return JSON: {proposed_slots:[{date,time,duration_minutes}],invite_text,workflow[]}",
  },
  "onboarding-assistant": {
    schema: onboardingAssistantSchema,
    systemPrompt:
      "You are an AI onboarding assistant. Build a first-week onboarding plan. " +
      "Return JSON: {first_week_plan:[{day(1-5),tasks[],owner,resources[]}],summary}",
  },
  "office-dashboard": {
    schema: officeDashboardSchema,
    systemPrompt:
      "You are an AI office operations assistant. Summarize HR/office metrics and suggest actions. " +
      'Return JSON: {metrics_summary[],actions:[{area,action,priority("high"|"medium"|"low")}],summary}',
  },
  "recruitment-automation": {
    schema: recruitmentAutomationSchema,
    systemPrompt:
      "You are an AI recruitment automation advisor. Recommend automation opportunities. " +
      "Return JSON: {opportunities:[{task,current_process,automation_suggestion,expected_impact}],summary}",
  },
  "workflow-builder": {
    schema: workflowBuilderSchema,
    systemPrompt:
      "You are an AI workflow builder. Design a step-by-step hiring workflow. " +
      "Return JSON: {stages:[{name,trigger,owner,sla_hours,actions[]}],summary}",
  },
  "predictive-hiring-analytics": {
    schema: predictiveHiringAnalyticsSchema,
    systemPrompt:
      "You are a predictive hiring analytics assistant. Forecast hiring outcomes. " +
      "Return JSON: {forecasts:[{metric,prediction,confidence(0-100),key_drivers[]}],summary}",
  },
  "workforce-planning": {
    schema: workforcePlanningSchema,
    systemPrompt:
      "You are a workforce planning AI assistant. Propose a headcount and role plan. " +
      'Return JSON: {headcount_plan:[{role,current_count,target_count,gap,priority("high"|"medium"|"low")}],' +
      "hiring_priorities[],summary}",
  },
  "private-ai-models": {
    schema: privateAiModelsSchema,
    systemPrompt:
      "You are an AI advisor for enterprise private model deployment. " +
      "Return JSON: {recommendations:[{model,use_case,hosting,fine_tuning,governance}],summary}",
  },
  "company-knowledge-ai": {
    schema: companyKnowledgeAiSchema,
    systemPrompt:
      "You are a company knowledge AI assistant. Answer using the provided company context. " +
      "Return JSON: {answer,sources:[{source,relevance}],confidence(0-100)}",
  },
  "talent-intelligence": {
    schema: talentIntelligenceSchema,
    systemPrompt:
      "You are an AI talent intelligence assistant. Provide org-wide talent insights. " +
      'Return JSON: {bench_strength,skill_coverage:[{area,coverage("strong"|"adequate"|"weak"),notes}],risks[],summary}',
  },
  "white-label-assistant": {
    schema: whiteLabelAssistantSchema,
    systemPrompt:
      "You are an AI assistant product advisor. Recommend white-label configuration. " +
      "Return JSON: {recommendations:[{aspect,recommendation,implementation}],summary}",
  },
  "dedicated-ai-success-manager": {
    schema: dedicatedAiSuccessManagerSchema,
    systemPrompt:
      "You are an AI success manager advisor. Propose an AI rollout success plan. " +
      "Return JSON: {rollout_plan:[{milestone,timeline,activities[],success_metrics[]}],summary}",
  },
};

async function buildEmployerContext(supabase: any, userId: string): Promise<string> {
  const ctx: string[] = [];
  const { data: company } = await supabase
    .from("companies")
    .select("id,name,industry,headquarters,description,website")
    .eq("owner_id", userId)
    .maybeSingle();
  if (company) {
    ctx.push(`## Company\n${JSON.stringify(company)}`);
    const { data: jobs } = await supabase
      .from("jobs")
      .select(
        "id,title,status,required_skills,salary_min,salary_max,location,job_type,applications_count",
      )
      .eq("company_id", company.id)
      .order("created_at", { ascending: false })
      .limit(10);
    if (jobs?.length) {
      ctx.push(`## Posted Jobs\n${JSON.stringify(jobs)}`);
    }
    const { data: apps } = await supabase
      .from("applications")
      .select("id,status,created_at,applicant:profiles(full_name,headline,skills),job:jobs(title)")
      .eq("job.company_id", company.id)
      .order("created_at", { ascending: false })
      .limit(15);
    if (apps?.length) {
      ctx.push(`## Recent Applications\n${JSON.stringify(apps)}`);
    }
  }
  return ctx.join("\n\n");
}

export const runEmployerAiFeature = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = input as { featureSlug: string; message: string };
    if (!i?.featureSlug) throw new Error("Feature slug is required");
    if (!i?.message?.trim()) throw new Error("Message is required");
    return { featureSlug: i.featureSlug, message: i.message.trim().slice(0, 6000) };
  })
  .handler(async ({ data, context }) => {
    await requirePremium(context.userId);
    const feature = getAiFeature(data.featureSlug);
    if (!feature) throw new Error("Unknown AI feature");

    const config = FEATURE_CONFIGS[data.featureSlug];
    if (!config) throw new Error("AI feature not configured");

    const employerContext = await buildEmployerContext(context.supabase, context.userId);

    let ragContext = "";
    try {
      const { data: company } = await context.supabase
        .from("companies")
        .select("id")
        .eq("owner_id", context.userId)
        .maybeSingle();
      if (company?.id) {
        const embRes = await aiGenerateEmbedding(data.message);
        const { data: chunks } = await supabaseAdmin.rpc("search_knowledge_base", {
          query_embedding: embRes.embedding,
          match_company_id: company.id,
          match_limit: 5,
        });
        if (chunks?.length) {
          ragContext = chunks
            .map((c: any, i: number) => `[${i + 1}] From "${c.document_title}":\n${c.content}`)
            .join("\n\n---\n\n");
        }
      }
    } catch {
      // RAG is optional — continue without it
    }

    const promptParts = [
      `## Employer Context\n${employerContext || "No company profile set up yet."}`,
    ];
    if (ragContext) {
      promptParts.push(`## Knowledge Base Context\n${ragContext}`);
    }
    promptParts.push(`## Request\n${data.message}`);
    const prompt = promptParts.join("\n\n");

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
