/* eslint-disable @typescript-eslint/no-explicit-any */

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth.middleware";
import { aiGenerateText } from "@/integrations/ai/ai-service";
import { requirePremium } from "@/lib/premium.server";
import { getAiFeature } from "@/lib/employer-ai-features";

const FEATURE_PROMPTS: Record<string, string> = {
  "candidate-match":
    "You are an AI recruitment assistant. Match candidates to the given job based on skills, experience, and fit. For each candidate provide a match score (0-100), matching strengths, and gaps. Format as markdown.",
  "resume-screening":
    "You are an AI resume screening assistant. Screen the provided resumes against the job requirements. Flag unqualified, borderline, and qualified candidates with reasons. Format as markdown.",
  "resume-ranking":
    "You are an AI resume ranking assistant. Rank the provided candidates from strongest to weakest for the given role, with a fit score (0-100) and one-line justification each. Format as a ranked markdown list.",
  "smart-shortlisting":
    "You are an AI shortlisting assistant. From the provided applicants, shortlist the top candidates who should advance to interview, with a short rationale per candidate. Format as markdown.",
  "candidate-ranking":
    "You are an AI candidate ranking assistant. Compare the provided candidates side-by-side and rank them by overall hiring suitability, with strengths and concerns for each. Format as markdown.",
  "candidate-summary":
    "You are an AI candidate summarizer. Produce a concise professional summary of the candidate: top skills, experience highlights, potential red flags, and recommended next steps. Format as markdown.",
  "hiring-recommendation":
    "You are an AI hiring advisor. Given the candidate and role context, give a data-backed HIRE / NO-HIRE / HOLD recommendation with supporting reasons and risks. Format as markdown.",
  "candidate-success-prediction":
    "You are an AI predictive hiring analyst. Predict the candidate's likelihood of on-the-job success (Low/Medium/High) with contributing factors and a brief rationale. Format as markdown.",
  "talent-search":
    "You are an AI talent search assistant. Given the search criteria, suggest the ideal candidate profile, search keywords, boolean strings, and channels to source from. Format as markdown.",
  "duplicate-candidate-detection":
    "You are an AI duplicate detection assistant. Analyse the provided candidate profiles and flag likely duplicates (same person) with confidence and matching fields. Format as markdown.",
  "skill-gap-analysis":
    "You are an AI skill gap analyst. Compare the team or candidate skills against required/target skills and list gaps, priorities, and recommended learning paths. Format as markdown.",
  "interview-question-generator":
    "You are an AI interview question generator. Generate role-specific interview questions (technical, behavioural, situational) with guidance on what good answers look like. Format as markdown.",
  "job-description-writer":
    "You are an AI job description writer. Write a compelling, inclusive, SEO-friendly job description from the provided details: summary, responsibilities, requirements, benefits. Format as markdown.",
  "job-description-optimizer":
    "You are an AI job description optimizer. Improve the provided job description for clarity, inclusivity, reach, and conversion. Return the optimized version plus a short list of changes made. Format as markdown.",
  "hiring-analytics":
    "You are an AI hiring analytics assistant. Analyse the provided hiring funnel data and surface insights, bottlenecks, time-to-hire trends, and recommendations. Format as markdown.",
  "email-assistant":
    "You are an AI email assistant for recruiters. Draft professional candidate emails (outreach, interview invite, rejection, offer) from the provided context. Format the email ready to send in markdown.",
  "meeting-scheduler":
    "You are an AI meeting scheduler. Propose optimal interview slots, format invite text, and suggest a scheduling workflow for the given participants and constraints. Format as markdown.",
  "onboarding-assistant":
    "You are an AI onboarding assistant. Build a structured first-week onboarding plan for the given role with tasks, owners, and resources. Format as markdown.",
  "office-dashboard":
    "You are an AI office operations assistant. Summarize HR/office metrics from the provided data and suggest actions for hiring, capacity, and workforce health. Format as markdown.",
  "recruitment-automation":
    "You are an AI recruitment automation advisor. Recommend automation opportunities in the provided recruiting workflow with concrete steps and expected impact. Format as markdown.",
  "workflow-builder":
    "You are an AI workflow builder. Design a step-by-step hiring workflow (stages, triggers, owners, SLAs) for the described process. Format as markdown.",
  "predictive-hiring-analytics":
    "You are a predictive hiring analytics assistant. Forecast hiring outcomes (time-to-fill, offer acceptance, attrition risk) from the provided data and explain key drivers. Format as markdown.",
  "workforce-planning":
    "You are a workforce planning AI assistant. Propose a headcount and role plan aligned to the described business goals, with gaps and hiring priorities. Format as markdown.",
  "private-ai-models":
    "You are an AI advisor for enterprise private model deployment. Recommend a private model strategy (models, hosting, fine-tuning, governance) for the described needs. Format as markdown.",
  "company-knowledge-ai":
    "You are a company knowledge AI assistant. Given the provided company context, answer questions and surface relevant knowledge with citations to the source material. Format as markdown.",
  "talent-intelligence":
    "You are an AI talent intelligence assistant. Provide org-wide talent insights (bench strength, skill coverage, risks) from the provided workforce data. Format as markdown.",
  "white-label-assistant":
    "You are an AI assistant product advisor. Recommend how to configure a white-label AI assistant for the described company brand and use cases. Format as markdown.",
  "dedicated-ai-success-manager":
    "You are an AI success manager advisor. Propose an AI rollout success plan (milestones, enablement, adoption metrics) for the described organization. Format as markdown.",
};

function systemPromptFor(slug: string): string {
  return (
    FEATURE_PROMPTS[slug] ??
    "You are Jagire AI, an expert recruitment and HR assistant. Provide clear, actionable, professional answers in markdown."
  );
}

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

    const employerContext = await buildEmployerContext(context.supabase, context.userId);
    const prompt = [
      `## Employer Context\n${employerContext || "No company profile set up yet."}`,
      `## Request\n${data.message}`,
    ].join("\n\n");

    const response = await aiGenerateText(
      prompt,
      systemPromptFor(data.featureSlug),
      undefined,
      "general",
    );
    return { response, featureTitle: feature.title };
  });
