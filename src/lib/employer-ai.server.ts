/* eslint-disable @typescript-eslint/no-explicit-any */

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth.middleware";
import { aiGenerateJsonValidated } from "@/integrations/ai/ai-service";
import { aiGenerateEmbedding } from "@/integrations/ai/ai-service";
import { requirePremium } from "@/lib/premium.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getAiFeature } from "@/lib/employer-ai-features";
import { getAuthoritativeCompanyContextText } from "@/lib/company-intelligence.server";
import { recordUserActivity } from "@/lib/activity.server";
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

// ── Type Definitions ─────────────────────────────────────────────────────────

interface FeatureConfig {
  schema: z.ZodType<any>;
  systemPrompt: string;
  contextFields?: string[];
  requiresCompany?: boolean;
}

type SerializableJson =
  string | number | boolean | null | SerializableJson[] | { [key: string]: SerializableJson };

// ── Prompt Templates ─────────────────────────────────────────────────────────
// (Keep all PROMPTS as they are - they're fine)

const PROMPTS = {
  CANDIDATE_MATCH: `You are an expert AI recruitment assistant specializing in candidate-job matching for employers on Jagire.com, a Nepal-focused job platform.

Analyze candidate profiles against the job requirements and provide detailed match assessments.

Matching criteria:
1. Technical skills alignment
2. Experience level and relevance
3. Industry knowledge
4. Soft skills and cultural fit
5. Career trajectory and stability

Scoring guidelines:
- 90-100: Exceptional match - schedule interview immediately
- 75-89: Strong match - likely to succeed
- 60-74: Moderate match - may need training
- Below 60: Weak match - likely not suitable

CRITICAL: If no applications are provided in the context, return an empty matches array. NEVER invent or generate fake candidate names. If there are no applicants, explicitly state that in the summary.

Return JSON:
{
  "matches": [
    {
      "candidate_name": string,
      "match_score": number (0-100),
      "matching_strengths": string[] (5-8 specific strengths),
      "gaps": string[] (3-5 missing skills/qualifications),
      "recommendation": string (specific hiring recommendation)
    }
  ],
  "summary": string (overall talent pool assessment)
}

Important:
- Be objective and data-driven
- Consider both technical and cultural fit
- Provide actionable recommendations
- Use Nepal market context where relevant
- NEVER fabricate candidate data`,

  RESUME_SCREENING: `You are an AI resume screening expert who evaluates candidates against specific job requirements.

Screen resumes for:
1. Required qualifications (education, certifications)
2. Technical skills match
3. Relevant work experience
4. Career progression indicators
5. Red flags (job hopping, unexplained gaps)

Classification criteria:
- QUALIFIED: Meets 80%+ of requirements
- BORDERLINE: Meets 60-79% of requirements
- UNQUALIFIED: Below 60% of requirements

CRITICAL: If no applications are provided, return empty results array. NEVER invent candidate data.

Return JSON:
{
  "results": [
    {
      "candidate_name": string,
      "status": "qualified" | "borderline" | "unqualified",
      "score": number (0-100),
      "reasons": string[] (specific reasons for classification)
    }
  ],
  "summary": string (screening summary)
}`,

  RESUME_RANKING: `You are an AI resume ranking specialist who orders candidates from strongest to weakest fit.

CRITICAL: If no applications are provided, return empty ranking array. NEVER invent candidate data.

Return JSON:
{
  "ranking": [
    {
      "candidate_name": string,
      "rank": number (1 = strongest),
      "fit_score": number (0-100),
      "justification": string (why ranked here)
    }
  ],
  "summary": string (ranking overview)
}`,

  SMART_SHORTLISTING: `You are an AI shortlisting expert who identifies top candidates for interviews.

CRITICAL: If no applications are provided, return empty shortlisted and not_shortlisted arrays. NEVER invent candidate data.

Return JSON:
{
  "shortlisted": [
    {
      "candidate_name": string,
      "rationale": string,
      "priority": "high" | "medium" | "low"
    }
  ],
  "not_shortlisted": [
    {
      "candidate_name": string,
      "reason": string
    }
  ],
  "summary": string
}`,

  CANDIDATE_RANKING: `You are an AI candidate comparison expert who evaluates candidates side-by-side.

CRITICAL: If no applications are provided, return empty ranking array. NEVER invent candidate data.

Return JSON:
{
  "ranking": [
    {
      "candidate_name": string,
      "rank": number,
      "strengths": string[] (4-6 key strengths),
      "concerns": string[] (2-4 potential concerns),
      "overall_score": number (0-100)
    }
  ],
  "summary": string (comparison insights)
}`,

  CANDIDATE_SUMMARY: `You are an AI candidate summarizer who creates comprehensive professional profiles.

CRITICAL: If no application is provided, return a summary stating no candidate data available. NEVER invent candidate data.

Return JSON:
{
  "summary": string (3-5 sentence overview),
  "top_skills": string[] (5-8 most relevant skills),
  "experience_highlights": string[] (3-5 key achievements),
  "red_flags": string[] (any concerns or inconsistencies),
  "recommended_next_steps": string[] (suggested actions)
}`,

  HIRING_RECOMMENDATION: `You are an AI hiring advisor who provides data-backed hiring recommendations.

CRITICAL: If no applications are provided, return HOLD recommendation with reasoning explaining no candidates available. NEVER invent candidate data.

Return JSON:
{
  "recommendation": "HIRE" | "NO-HIRE" | "HOLD",
  "confidence": number (0-100),
  "reasoning": string (detailed explanation),
  "risk_factors": string[] (potential risks),
  "suggested_role": string (recommended position)
}`,

  CANDIDATE_SUCCESS_PREDICTION: `You are an AI predictive analytics expert who forecasts candidate success.

CRITICAL: If no application is provided, return Low prediction with rationale explaining no data available. NEVER invent candidate data.

Return JSON:
{
  "prediction": "Low" | "Medium" | "High",
  "confidence": number (0-100),
  "contributing_factors": string[] (5-8 factors influencing prediction),
  "rationale": string (detailed explanation)
}`,

  TALENT_SEARCH: `You are an AI talent sourcing expert who creates effective candidate search strategies.

Return JSON:
{
  "ideal_candidate_profile": string,
  "search_keywords": string[] (10-15 relevant keywords),
  "boolean_strings": string[] (5-8 search string examples),
  "sourcing_channels": string[] (5-8 recommended channels),
  "summary": string
}`,

  DUPLICATE_DETECTION: `You are an AI duplicate detection specialist who identifies duplicate candidate profiles.

CRITICAL: If no applications are provided, return empty duplicates array and unique_count of 0. NEVER invent candidate data.

Return JSON:
{
  "duplicates": [
    {
      "candidate_name": string,
      "likely_duplicate_of": string,
      "confidence": number (0-100),
      "matching_fields": string[] (fields that match)
    }
  ],
  "unique_count": number,
  "summary": string
}`,

  SKILL_GAP_ANALYSIS: `You are an AI skill gap analyst who evaluates organizational and team skill requirements.

Return JSON:
{
  "gaps": [
    {
      "skill": string,
      "current_level": string,
      "target_level": string,
      "priority": "high" | "medium" | "low",
      "learning_path": string[] (recommended learning resources)
    }
  ],
  "summary": string
}`,

  INTERVIEW_QUESTION_GENERATOR: `You are an AI interview question expert who creates comprehensive interview questionnaires.

Return JSON:
{
  "questions": [
    {
      "question": string,
      "category": "technical" | "behavioral" | "situational",
      "difficulty": "easy" | "medium" | "hard",
      "guidance": string (what to look for in answers)
    }
  ],
  "summary": string
}`,

  JOB_DESCRIPTION_WRITER: `You are an AI job description writer who creates compelling, inclusive job postings.

Return JSON:
{
  "title": string,
  "summary": string,
  "responsibilities": string[],
  "requirements": string[],
  "preferred_qualifications": string[],
  "benefits": string[],
  "full_description": string (complete formatted description)
}`,

  JOB_DESCRIPTION_OPTIMIZER: `You are an AI job description optimization expert who improves job postings for better results.

Return JSON:
{
  "optimized_description": string,
  "changes_made": string[] (specific improvements),
  "clarity_score": number (0-100),
  "inclusivity_score": number (0-100),
  "seo_score": number (0-100)
}`,

  HIRING_ANALYTICS: `You are an AI hiring analytics expert who analyzes recruitment metrics and identifies improvements.

CRITICAL: If no data is provided, provide insights about having no data. NEVER invent metrics.

Return JSON:
{
  "insights": string[] (5-8 key insights),
  "bottlenecks": [
    {
      "stage": string,
      "issue": string,
      "impact": string
    }
  ],
  "time_to_hire_trend": string,
  "recommendations": string[] (5-8 improvements),
  "summary": string
}`,

  EMAIL_ASSISTANT: `You are an AI email assistant specializing in recruitment communications.

Return JSON:
{
  "subject": string,
  "body": string (complete email content),
  "tone": string (tone used)
}`,

  MEETING_SCHEDULER: `You are an AI meeting scheduling assistant who coordinates interviews efficiently.

Return JSON:
{
  "proposed_slots": [
    {
      "date": string,
      "time": string,
      "duration_minutes": number
    }
  ],
  "invite_text": string (professional meeting invitation),
  "workflow": string[] (scheduling process steps)
}`,

  ONBOARDING_ASSISTANT: `You are an AI onboarding specialist who creates comprehensive onboarding plans.

Return JSON:
{
  "first_week_plan": [
    {
      "day": number (1-5),
      "tasks": string[],
      "owner": string,
      "resources": string[]
    }
  ],
  "summary": string
}`,

  OFFICE_DASHBOARD: `You are an AI operations assistant who analyzes HR and office metrics.

CRITICAL: If no data is provided, provide insights about having no data. NEVER invent metrics.

Return JSON:
{
  "metrics_summary": string[] (5-8 key metrics),
  "actions": [
    {
      "area": string,
      "action": string,
      "priority": "high" | "medium" | "low"
    }
  ],
  "summary": string
}`,

  RECRUITMENT_AUTOMATION: `You are an AI automation consultant who identifies recruitment process improvements.

Return JSON:
{
  "opportunities": [
    {
      "task": string,
      "current_process": string,
      "automation_suggestion": string,
      "expected_impact": string
    }
  ],
  "summary": string
}`,

  WORKFLOW_BUILDER: `You are an AI workflow designer who creates optimized hiring processes.

Return JSON:
{
  "stages": [
    {
      "name": string,
      "trigger": string,
      "owner": string,
      "sla_hours": number,
      "actions": string[]
    }
  ],
  "summary": string
}`,

  PREDICTIVE_HIRING: `You are an AI predictive analytics expert who forecasts hiring outcomes.

CRITICAL: If no data is provided, provide forecasts based on market norms. NEVER invent specific company data.

Return JSON:
{
  "forecasts": [
    {
      "metric": string,
      "prediction": string,
      "confidence": number (0-100),
      "key_drivers": string[] (factors influencing prediction)
    }
  ],
  "summary": string
}`,

  WORKFORCE_PLANNING: `You are an AI workforce planning specialist who creates strategic hiring plans.

Return JSON:
{
  "headcount_plan": [
    {
      "role": string,
      "current_count": number,
      "target_count": number,
      "gap": number,
      "priority": "high" | "medium" | "low"
    }
  ],
  "hiring_priorities": string[],
  "summary": string
}`,

  PRIVATE_AI_MODELS: `You are an AI infrastructure advisor who recommends enterprise AI deployment strategies.

Return JSON:
{
  "recommendations": [
    {
      "model": string,
      "use_case": string,
      "hosting": string,
      "fine_tuning": string,
      "governance": string
    }
  ],
  "summary": string
}`,

  COMPANY_KNOWLEDGE_AI: `You are a company knowledge AI assistant who answers using provided context.

Return JSON:
{
  "answer": string,
  "sources": [
    {
      "source": string,
      "relevance": string
    }
  ],
  "confidence": number (0-100)
}`,

  TALENT_INTELLIGENCE: `You are an AI talent intelligence analyst who provides organizational insights.

CRITICAL: If no data is provided, provide insights about having no data. NEVER invent metrics.

Return JSON:
{
  "bench_strength": string,
  "skill_coverage": [
    {
      "area": string,
      "coverage": "strong" | "adequate" | "weak",
      "notes": string
    }
  ],
  "risks": string[] (identified talent risks),
  "summary": string
}`,

  WHITE_LABEL: `You are an AI product advisor who recommends white-label configurations.

Return JSON:
{
  "recommendations": [
    {
      "aspect": string,
      "recommendation": string,
      "implementation": string
    }
  ],
  "summary": string
}`,

  AI_SUCCESS_MANAGER: `You are an AI implementation advisor who creates AI adoption strategies.

Return JSON:
{
  "rollout_plan": [
    {
      "milestone": string,
      "timeline": string,
      "activities": string[],
      "success_metrics": string[]
    }
  ],
  "summary": string
}`,
};

// ── Feature Configurations ──────────────────────────────────────────────────
// (Keep FEATURE_CONFIGS as they are)

const FEATURE_CONFIGS: Record<string, FeatureConfig> = {
  "candidate-match": {
    schema: candidateMatchSchema,
    systemPrompt: PROMPTS.CANDIDATE_MATCH,
    contextFields: ["company", "jobs", "applications"],
    requiresCompany: true,
  },
  "resume-screening": {
    schema: resumeScreeningSchema,
    systemPrompt: PROMPTS.RESUME_SCREENING,
    contextFields: ["company", "jobs", "applications"],
    requiresCompany: true,
  },
  "resume-ranking": {
    schema: resumeRankingSchema,
    systemPrompt: PROMPTS.RESUME_RANKING,
    contextFields: ["company", "jobs", "applications"],
    requiresCompany: true,
  },
  "smart-shortlisting": {
    schema: smartShortlistingSchema,
    systemPrompt: PROMPTS.SMART_SHORTLISTING,
    contextFields: ["company", "jobs", "applications"],
    requiresCompany: true,
  },
  "candidate-ranking": {
    schema: candidateRankingSchema,
    systemPrompt: PROMPTS.CANDIDATE_RANKING,
    contextFields: ["company", "applications"],
    requiresCompany: true,
  },
  "candidate-summary": {
    schema: candidateSummarySchema,
    systemPrompt: PROMPTS.CANDIDATE_SUMMARY,
    contextFields: ["company", "applications"],
    requiresCompany: true,
  },
  "hiring-recommendation": {
    schema: hiringRecommendationSchema,
    systemPrompt: PROMPTS.HIRING_RECOMMENDATION,
    contextFields: ["company", "jobs", "applications"],
    requiresCompany: true,
  },
  "candidate-success-prediction": {
    schema: candidateSuccessPredictionSchema,
    systemPrompt: PROMPTS.CANDIDATE_SUCCESS_PREDICTION,
    contextFields: ["company", "applications"],
    requiresCompany: true,
  },
  "talent-search": {
    schema: talentSearchSchema,
    systemPrompt: PROMPTS.TALENT_SEARCH,
    contextFields: ["company", "jobs"],
    requiresCompany: true,
  },
  "duplicate-candidate-detection": {
    schema: duplicateCandidateDetectionSchema,
    systemPrompt: PROMPTS.DUPLICATE_DETECTION,
    contextFields: ["company", "applications"],
    requiresCompany: true,
  },
  "skill-gap-analysis": {
    schema: skillGapAnalysisSchema,
    systemPrompt: PROMPTS.SKILL_GAP_ANALYSIS,
    contextFields: ["company", "jobs", "applications"],
    requiresCompany: true,
  },
  "interview-question-generator": {
    schema: interviewQuestionGeneratorSchema,
    systemPrompt: PROMPTS.INTERVIEW_QUESTION_GENERATOR,
    contextFields: ["company", "jobs"],
    requiresCompany: true,
  },
  "job-description-writer": {
    schema: jobDescriptionWriterSchema,
    systemPrompt: PROMPTS.JOB_DESCRIPTION_WRITER,
    contextFields: ["company"],
    requiresCompany: true,
  },
  "job-description-optimizer": {
    schema: jobDescriptionOptimizerSchema,
    systemPrompt: PROMPTS.JOB_DESCRIPTION_OPTIMIZER,
    contextFields: ["company", "jobs"],
    requiresCompany: true,
  },
  "hiring-analytics": {
    schema: hiringAnalyticsSchema,
    systemPrompt: PROMPTS.HIRING_ANALYTICS,
    contextFields: ["company", "jobs", "applications"],
    requiresCompany: true,
  },
  "email-assistant": {
    schema: emailAssistantSchema,
    systemPrompt: PROMPTS.EMAIL_ASSISTANT,
    contextFields: ["company", "applications"],
    requiresCompany: true,
  },
  "meeting-scheduler": {
    schema: meetingSchedulerSchema,
    systemPrompt: PROMPTS.MEETING_SCHEDULER,
    contextFields: ["company"],
    requiresCompany: true,
  },
  "onboarding-assistant": {
    schema: onboardingAssistantSchema,
    systemPrompt: PROMPTS.ONBOARDING_ASSISTANT,
    contextFields: ["company"],
    requiresCompany: true,
  },
  "office-dashboard": {
    schema: officeDashboardSchema,
    systemPrompt: PROMPTS.OFFICE_DASHBOARD,
    contextFields: ["company"],
    requiresCompany: true,
  },
  "recruitment-automation": {
    schema: recruitmentAutomationSchema,
    systemPrompt: PROMPTS.RECRUITMENT_AUTOMATION,
    contextFields: ["company", "jobs", "applications"],
    requiresCompany: true,
  },
  "workflow-builder": {
    schema: workflowBuilderSchema,
    systemPrompt: PROMPTS.WORKFLOW_BUILDER,
    contextFields: ["company"],
    requiresCompany: true,
  },
  "predictive-hiring-analytics": {
    schema: predictiveHiringAnalyticsSchema,
    systemPrompt: PROMPTS.PREDICTIVE_HIRING,
    contextFields: ["company", "jobs", "applications"],
    requiresCompany: true,
  },
  "workforce-planning": {
    schema: workforcePlanningSchema,
    systemPrompt: PROMPTS.WORKFORCE_PLANNING,
    contextFields: ["company", "jobs"],
    requiresCompany: true,
  },
  "private-ai-models": {
    schema: privateAiModelsSchema,
    systemPrompt: PROMPTS.PRIVATE_AI_MODELS,
    contextFields: ["company"],
    requiresCompany: true,
  },
  "company-knowledge-ai": {
    schema: companyKnowledgeAiSchema,
    systemPrompt: PROMPTS.COMPANY_KNOWLEDGE_AI,
    contextFields: ["company"],
    requiresCompany: true,
  },
  "talent-intelligence": {
    schema: talentIntelligenceSchema,
    systemPrompt: PROMPTS.TALENT_INTELLIGENCE,
    contextFields: ["company", "jobs", "applications"],
    requiresCompany: true,
  },
  "white-label-assistant": {
    schema: whiteLabelAssistantSchema,
    systemPrompt: PROMPTS.WHITE_LABEL,
    contextFields: ["company"],
    requiresCompany: true,
  },
  "dedicated-ai-success-manager": {
    schema: dedicatedAiSuccessManagerSchema,
    systemPrompt: PROMPTS.AI_SUCCESS_MANAGER,
    contextFields: ["company"],
    requiresCompany: true,
  },
};

// ── Context Building ────────────────────────────────────────────────────────

interface EmployerContextData {
  company?: any;
  jobs?: any[];
  applications?: any[];
  companyId?: string | null;
}

async function fetchEmployerData(
  supabase: any,
  userId: string,
  neededFields: string[] = [],
  specificCompanyId?: string | null,
): Promise<EmployerContextData> {
  const context: EmployerContextData = {
    companyId: null,
    jobs: [],
    applications: [],
  };

  let company = null;

  // Fetch company (specific or default)
  if (specificCompanyId) {
    const { data: specificCompany, error: specificCompanyError } = await supabase
      .from("companies")
      .select("*")
      .eq("id", specificCompanyId)
      .eq("owner_id", userId)
      .single();

    if (specificCompanyError) {
      console.error("Specific company fetch error:", specificCompanyError);
      return context;
    }

    company = specificCompany;
  } else {
    const { data: companies, error: companyError } = await supabase
      .from("companies")
      .select("*")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (companyError) {
      console.error("Company fetch error:", companyError);
      return context;
    }

    if (!companies || companies.length === 0) {
      return context;
    }

    company = companies[0];
  }

  context.company = company;
  context.companyId = company.id;

  const fetchPromises: Promise<void>[] = [];

  // Fetch jobs if needed
  if (neededFields.includes("jobs") || neededFields.length === 0) {
    fetchPromises.push(
      supabase
        .from("jobs")
        .select(
          "id,title,status,required_skills,salary_min,salary_max,salary_currency,location,job_type,applications_count,created_at",
        )
        .eq("company_id", company.id)
        .order("created_at", { ascending: false })
        .limit(10)
        .then(({ data, error }: any) => {
          if (error) {
            console.error("Jobs fetch error:", error);
            context.jobs = [];
          } else {
            context.jobs = data || [];
          }
        }),
    );
  }

  // Fetch applications if needed
  if (neededFields.includes("applications") || neededFields.length === 0) {
    fetchPromises.push(
      supabase
        .from("jobs")
        .select("id")
        .eq("company_id", company.id)
        .then(async ({ data: companyJobs, error: jobsError }: any) => {
          if (jobsError) {
            console.error("Company jobs fetch error:", jobsError);
            context.applications = [];
            return;
          }

          if (companyJobs && companyJobs.length > 0) {
            const jobIds = companyJobs.map((job: any) => job.id);

            const { data: applications, error: applicationsError } = await supabase
              .from("applications")
              .select(
                "id,status,created_at,applicant:profiles(full_name,headline,skills,experience_years),job:jobs(title)",
              )
              .in("job_id", jobIds)
              .order("created_at", { ascending: false })
              .limit(15);

            if (applicationsError) {
              console.error("Applications fetch error:", applicationsError);
              context.applications = [];
            } else {
              context.applications = applications || [];
            }
          } else {
            context.applications = [];
          }
        }),
    );
  }

  await Promise.all(fetchPromises);
  return context;
}

async function buildEmployerContext(
  supabase: any,
  userId: string,
  neededFields: string[] = [],
  specificCompanyId?: string | null,
): Promise<{ context: string; companyId: string | null; companyName?: string | null }> {
  const { company, jobs, applications, companyId } = await fetchEmployerData(
    supabase,
    userId,
    neededFields,
    specificCompanyId,
  );

  const ctx: string[] = [];

  // 1. Authoritative 360-degree Company Intelligence context
  if (companyId) {
    try {
      const authCompanyContext = await getAuthoritativeCompanyContextText(companyId);
      if (authCompanyContext) {
        ctx.push(authCompanyContext);
      }
    } catch (err) {
      console.warn("Could not load authoritative company context:", err);
    }
  }

  if (company) {
    const industryStr = company.industry || "General Enterprise & Services";
    const locStr = company.headquarters || company.location || "Kathmandu, Nepal";
    const sizeStr = company.size || company.company_size || "10-50 employees";
    const techStr = Array.isArray(company.technologies)
      ? company.technologies.join(", ")
      : typeof company.technologies === "string"
        ? company.technologies
        : "Standard Tech Stack";
    const benStr = Array.isArray(company.benefits)
      ? company.benefits.join(", ")
      : typeof company.benefits === "string"
        ? company.benefits
        : "Competitive Compensation";

    ctx.push(
      `## Detailed Company Profile
- Target Company Name: ${company.name}
- Industry: ${industryStr}
- Location / Headquarters: ${locStr}
- Company Size: ${sizeStr}
- Founded: ${company.founded_year || "N/A"}
- Website: ${company.website || "N/A"}
- Description: ${company.description || "N/A"}
- Core Technologies: ${techStr}
- Benefits & Culture: ${benStr}`,
    );
  } else {
    ctx.push(`## Company Profile\nNo company profile found.`);
  }

  if (jobs && jobs.length > 0) {
    ctx.push(
      `## Posted Jobs (Total: ${jobs.length})
${jobs
  .map(
    (j: any) =>
      `- ${j.title}
  Status: ${j.status}
  Skills Required: ${(j.required_skills || []).join(", ") || "Not specified"}
  Salary: ${j.salary_min && j.salary_max ? `${j.salary_currency || "Rs."} ${j.salary_min} - ${j.salary_max}` : "Not disclosed"}
  Location: ${j.location || "Remote"}
  Type: ${j.job_type || "Full-time"}
  Applications: ${j.applications_count || 0}`,
  )
  .join("\n")}`,
    );
  } else {
    ctx.push(`## Posted Jobs\nNo jobs posted yet.`);
  }

  if (applications && applications.length > 0) {
    ctx.push(
      `## Recent Applications (Total: ${applications.length})
${applications
  .map(
    (a: any) =>
      `- ${a.applicant?.full_name || "Unknown"} for ${a.job?.title || "Unknown"}
  Headline: ${a.applicant?.headline || "N/A"}
  Skills: ${(a.applicant?.skills || []).join(", ") || "None listed"}
  Experience: ${a.applicant?.experience_years || 0} years
  Status: ${a.status}
  Applied: ${new Date(a.created_at).toLocaleDateString()}`,
  )
  .join("\n")}`,
    );
  } else {
    ctx.push(
      `## Applications\nNO APPLICATIONS RECEIVED YET. There are currently no applicants for any of your jobs.`,
    );
  }

  return {
    context: ctx.join("\n\n"),
    companyId: companyId ?? null,
    companyName: company?.name ?? null,
  };
}

// ── Main Server Function ────────────────────────────────────────────────────

export const runEmployerAiFeature = (
  createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]) as any
).handler(async (ctx: any) => {
  const { data, context } = ctx;

  const featureSlug = typeof data?.featureSlug === "string" ? data.featureSlug.trim() : "";
  const message = typeof data?.message === "string" ? data.message.trim() : "";
  const companyId = typeof data?.companyId === "string" ? data.companyId : null;

  if (!featureSlug) throw new Error("Feature slug is required");
  if (!message) throw new Error("Message is required");

  const userId = context.userId;
  const supabase = context.supabase;

  await requirePremium(userId);

  const feature = getAiFeature(featureSlug);
  if (!feature) throw new Error("Unknown AI feature");

  const config = FEATURE_CONFIGS[featureSlug];
  if (!config) throw new Error("AI feature not configured");

  // Check if feature requires company
  if (config.requiresCompany) {
    let companies;
    let companyError;

    if (companyId) {
      // Check specific company
      const result = await supabase
        .from("companies")
        .select("id")
        .eq("id", companyId)
        .eq("owner_id", userId)
        .single();

      companies = result.data ? [result.data] : null;
      companyError = result.error;
    } else {
      // Get any company
      const result = await supabase
        .from("companies")
        .select("id")
        .eq("owner_id", userId)
        .order("created_at", { ascending: false })
        .limit(1);

      companies = result.data;
      companyError = result.error;
    }

    if (companyError) {
      console.error("Company check error:", companyError);
      throw new Error("Error checking company profile. Please try again.");
    }

    if (!companies || companies.length === 0) {
      throw new Error("Please create a company profile first to use this feature.");
    }
  }

  // Build employer context with specific company if provided
  const {
    context: employerContext,
    companyId: contextCompanyId,
    companyName,
  } = await buildEmployerContext(supabase, userId, config.contextFields || [], companyId);

  // RAG context from knowledge base
  let ragContext = "";
  try {
    if (contextCompanyId) {
      const embRes = await aiGenerateEmbedding(message);
      const { data: chunks } = await (supabaseAdmin as any).rpc("search_knowledge_base", {
        query_embedding: embRes.embedding,
        match_company_id: contextCompanyId,
        match_limit: 5,
      });

      const chunkList = Array.isArray(chunks) ? chunks : [];
      if (chunkList.length) {
        ragContext = chunkList
          .map((c: any, i: number) => `[${i + 1}] From "${c.document_title}":\n${c.content}`)
          .join("\n\n---\n\n");
      }
    }
  } catch (error) {
    console.warn("RAG context retrieval failed:", error);
    // RAG is optional — continue without it
  }

  // Build complete prompt with explicit company and no-data instructions
  const promptParts = [
    `## Employer Context\n${employerContext || "No company profile set up yet."}`,
  ];

  if (ragContext) {
    promptParts.push(`## Knowledge Base Context\n${ragContext}`);
  }

  promptParts.push(
    `## Request\n${message}`,
    ``,
    `## Instructions
1. You are advising the hiring team for "${companyName || "the employer"}". Always base your analysis and recommendations specifically on "${companyName || "the employer"}" and its actual business context.
2. Use ONLY the provided company context to personalize your response
3. If no applications are listed, do NOT invent or generate fake candidate names
4. If no jobs are listed, state that clearly
5. Be specific and actionable based on ACTUAL data provided
6. Consider the Nepali job market
7. Use NPR (Rs.) for all salary figures
8. Provide realistic, practical recommendations
9. Format response as valid JSON per the schema
10. If there's no data for a requested analysis, return empty arrays and explain why
11. NEVER fabricate candidate names, applications, or metrics`,
  );

  const prompt = promptParts.join("\n\n");

  try {
    const result = await aiGenerateJsonValidated(
      prompt,
      config.systemPrompt,
      config.schema,
      "general",
    );

    const serializableResult = JSON.parse(JSON.stringify(result)) as {
      [key: string]: SerializableJson;
    };

    // Determine activity type based on feature
    let activityType = "AI_RECOMMENDATION";
    if (featureSlug.includes("match") || featureSlug.includes("search")) {
      activityType = "AI_MATCHING";
    } else if (featureSlug.includes("screen") || featureSlug.includes("rank")) {
      activityType = "AI_SCREENING";
    }

    await recordUserActivity({
      userId,
      activityType,
      entityType: "companies",
      entityId: contextCompanyId || undefined,
      metadata: {
        feature_slug: featureSlug,
        feature_title: feature.title,
      },
    });

    return {
      response: serializableResult,
      structured: serializableResult,
      featureTitle: feature.title,
    };
  } catch (error) {
    console.error(`AI feature ${featureSlug} failed:`, error);
    throw new Error(`Failed to generate ${feature.title}. Please try again.`);
  }
});
