/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth.middleware";
import { aiGenerateJsonValidated } from "@/integrations/ai/ai-service";
import { recordUserActivity } from "@/lib/activity.server";

// ── Schemas & Types ─────────────────────────────────────────────────────────

export interface TargetTalentProfile {
  role_title: string;
  seniority: string;
  required_skills: string[];
  why: string;
}

export interface CandidateScreeningCriterion {
  category: string;
  must_have: string;
  good_to_have: string;
}

export interface CompensationBenchmarkNPR {
  role: string;
  min_salary: string;
  max_salary: string;
  market_trend: string;
}

export interface AIHiringRoadmap {
  target_talent_profiles?: TargetTalentProfile[];
  skill_demands?: string[];
  recruitment_strategy?: string[];
  candidate_screening_criteria?: CandidateScreeningCriterion[];
  interview_focus_areas?: string[];
  compensation_benchmarks_npr?: CompensationBenchmarkNPR[];
  employer_branding_suggestions?: string[];
  hiring_velocity_assessment?: string;
  [key: string]: any;
}

export interface CompanyJobStats {
  total_jobs: number;
  active_jobs: number;
  closed_jobs: number;
  total_applicants: number;
  shortlisted_count: number;
  interview_count: number;
}

export interface CompanyIntelligenceRecord {
  id: string;
  company_id: string;
  employer_id: string;
  company_name: string;
  industry: string | null;
  size: string | null;
  location: string | null;
  website: string | null;
  hiring_readiness_score: number;
  profile_completeness: number;
  technologies: string[];
  benefits: string[];
  culture_highlights: string[];
  projects_services: any[];
  job_stats: CompanyJobStats;
  social_links: Record<string, any>;
  ai_hiring_roadmap: AIHiringRoadmap;
  ai_recommendations: any;
  score_change: number;
  version_number: number;
  last_synced_at: string;
  created_at: string;
  updated_at: string;
}

export interface CompanySnapshotRecord {
  id: string;
  company_id: string;
  employer_id: string;
  version_number: number;
  snapshot_type: string;
  hiring_readiness_score: number;
  profile_completeness: number;
  job_stats: CompanyJobStats;
  technologies: string[];
  ai_hiring_roadmap: AIHiringRoadmap;
  ai_recommendations: any;
  score_change: number;
  metadata: Record<string, any>;
  created_at: string;
}

const companyHiringStrategySchema = z.object({
  target_talent_profiles: z.array(
    z.object({
      role_title: z.string(),
      seniority: z.string(),
      required_skills: z.array(z.string()),
      why: z.string(),
    }),
  ),
  skill_demands: z.array(z.string()),
  recruitment_strategy: z.array(z.string()),
  candidate_screening_criteria: z.array(
    z.object({
      category: z.string(),
      must_have: z.string(),
      good_to_have: z.string(),
    }),
  ),
  interview_focus_areas: z.array(z.string()),
  compensation_benchmarks_npr: z.array(
    z.object({
      role: z.string(),
      min_salary: z.string(),
      max_salary: z.string(),
      market_trend: z.string(),
    }),
  ),
  employer_branding_suggestions: z.array(z.string()),
  hiring_velocity_assessment: z.string(),
});

// ── Scoring Helpers ─────────────────────────────────────────────────────────

export function computeCompanyProfileCompleteness(company: any): number {
  if (!company) return 0;
  let score = 0;
  if (company.name) score += 15;
  if (company.industry) score += 10;
  if (company.description || company.about) score += 15;
  if (company.headquarters || company.location) score += 10;
  if (company.size) score += 5;
  if (company.website) score += 10;
  if (company.logo_url) score += 5;
  if (company.mission || company.vision) score += 10;
  if (
    Array.isArray(company.technologies)
      ? company.technologies.length > 0
      : Boolean(company.technologies)
  )
    score += 10;
  if (Array.isArray(company.benefits) ? company.benefits.length > 0 : Boolean(company.benefits))
    score += 10;
  return Math.min(100, score);
}

export function computeHiringReadinessScore(
  completeness: number,
  activeJobsCount: number,
  totalApplicants: number,
  interviewCount: number,
): number {
  const completenessComponent = completeness * 0.35;
  const activeJobsComponent = Math.min(100, activeJobsCount * 25) * 0.25;
  const applicantsComponent = Math.min(100, totalApplicants * 10) * 0.2;
  const interviewComponent = Math.min(100, interviewCount * 20) * 0.2;
  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        completenessComponent + activeJobsComponent + applicantsComponent + interviewComponent,
      ),
    ),
  );
}

// ── Core Sync Engine ────────────────────────────────────────────────────────

/**
 * Synchronize and build authoritative Company Intelligence profile.
 */
export async function syncAndBuildCompanyIntelligence(
  companyId: string,
  snapshotType = "MANUAL_SYNC",
  overrideEmployerId?: string,
): Promise<any> {
  // 1. Fetch company record
  const { data: company, error: companyError } = await supabaseAdmin
    .from("companies")
    .select("*")
    .eq("id", companyId)
    .single();

  if (companyError || !company) {
    throw new Error(`Company not found: ${companyError?.message || "Invalid company ID"}`);
  }

  const employerId = overrideEmployerId || company.owner_id;

  // 2. Fetch all jobs posted for this company
  const { data: jobs } = await supabaseAdmin
    .from("jobs")
    .select(
      "id, title, status, required_skills, salary_min, salary_max, salary_currency, location, job_type, applications_count, created_at",
    )
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  const jobList = jobs || [];
  const activeJobs = jobList.filter((j) => j.status === "active");
  const closedJobs = jobList.filter((j) => j.status === "closed");

  // 3. Fetch applications across all company jobs
  const jobIds = jobList.map((j) => j.id);
  let applications: any[] = [];
  if (jobIds.length > 0) {
    const { data: appData } = await supabaseAdmin
      .from("applications")
      .select("id, job_id, status, created_at, applicant_id")
      .in("job_id", jobIds);
    applications = appData || [];
  }

  // 4. Fetch interviews scheduled
  let interviews: any[] = [];
  if (employerId) {
    const { data: intData } = await supabaseAdmin
      .from("interviews")
      .select("id, job_id, status, scheduled_at")
      .eq("employer_id", employerId);
    interviews = intData || [];
  }

  // 5. Compute job & recruitment stats
  const totalApplicants = applications.length;
  const shortlistedCount = applications.filter(
    (a) => a.status === "shortlisted" || a.status === "accepted",
  ).length;
  const interviewCount = interviews.length;

  const jobStats = {
    total_jobs: jobList.length,
    active_jobs: activeJobs.length,
    closed_jobs: closedJobs.length,
    total_applicants: totalApplicants,
    shortlisted_count: shortlistedCount,
    interview_count: interviewCount,
  };

  // 6. Format arrays / data
  const technologies = Array.isArray(company.technologies)
    ? company.technologies
    : typeof company.technologies === "string"
      ? company.technologies
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean)
      : [];

  const benefits = Array.isArray(company.benefits)
    ? company.benefits
    : typeof company.benefits === "string"
      ? company.benefits
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean)
      : [];

  const cultureHighlights = [
    company.work_model ? `Work Model: ${company.work_model}` : null,
    company.mission ? `Mission: ${company.mission}` : null,
    company.vision ? `Vision: ${company.vision}` : null,
  ].filter(Boolean);

  const socialLinks = {
    website: company.website || null,
    linkedin_url: company.linkedin_url || null,
    twitter_url: company.twitter_url || null,
    facebook_url: company.facebook_url || null,
    instagram_url: company.instagram_url || null,
  };

  const completeness = computeCompanyProfileCompleteness(company);
  const hiringReadinessScore = computeHiringReadinessScore(
    completeness,
    activeJobs.length,
    totalApplicants,
    interviewCount,
  );

  // 7. Generate AI Hiring Strategy & Roadmap via Gemini
  const prompt = `Analyze this company profile and recruitment data on Jagire.com (Nepal job platform) to provide strategic hiring intelligence, target talent profiles, screening criteria, and compensation benchmarks:
- Company Name: ${company.name}
- Industry: ${company.industry || "Technology & Services"}
- Size: ${company.size || "10-50 employees"}
- Location: ${company.headquarters || company.location || "Kathmandu, Nepal"}
- Description: ${company.description || "Tech-enabled enterprise in Nepal"}
- Technologies Used: ${technologies.join(", ") || "Standard Tech Stack"}
- Company Benefits: ${benefits.join(", ") || "Competitive Compensation & Growth"}
- Active Jobs (${activeJobs.length}): ${activeJobs.map((j) => `${j.title} (Skills: ${(j.required_skills || []).join(", ")})`).join("; ") || "None currently posted"}
- Recruitment Pipeline: ${totalApplicants} total applicants, ${shortlistedCount} shortlisted candidates, ${interviewCount} scheduled interviews.

Provide actionable hiring recommendations, structured screening criteria, and realistic NPR salary benchmarks suited for the Nepali talent market.`;

  const systemPrompt = `You are Jagire.com's Lead Talent Acquisition & Company Intelligence AI. Provide structured, realistic, and high-impact hiring guidance for employers in Nepal in JSON format strictly conforming to the schema.

Required JSON fields:
- target_talent_profiles: Array of objects with { role_title: string, seniority: string, required_skills: string[], why: string }
- skill_demands: Array of strings
- recruitment_strategy: Array of strings
- candidate_screening_criteria: Array of objects with { category: string, must_have: string, good_to_have: string }
- interview_focus_areas: Array of strings
- compensation_benchmarks_npr: Array of objects with { role: string, min_salary: string, max_salary: string, market_trend: string }
- employer_branding_suggestions: Array of strings
- hiring_velocity_assessment: string`;

  let aiHiringRoadmap: any = {};
  let aiRecommendations: any = {};

  try {
    const aiResult = await aiGenerateJsonValidated(
      prompt,
      systemPrompt,
      companyHiringStrategySchema,
      "company-intelligence",
    );

    aiHiringRoadmap = {
      target_talent_profiles: aiResult.target_talent_profiles,
      skill_demands: aiResult.skill_demands,
      compensation_benchmarks_npr: aiResult.compensation_benchmarks_npr,
      hiring_velocity_assessment: aiResult.hiring_velocity_assessment,
    };

    aiRecommendations = {
      recruitment_strategy: aiResult.recruitment_strategy,
      candidate_screening_criteria: aiResult.candidate_screening_criteria,
      interview_focus_areas: aiResult.interview_focus_areas,
      employer_branding_suggestions: aiResult.employer_branding_suggestions,
    };
  } catch (err) {
    console.warn("[Company Intelligence Engine] AI Generation fallback:", err);
    aiHiringRoadmap = {
      target_talent_profiles: [
        {
          role_title: activeJobs[0]?.title || "Full-Stack Developer",
          seniority: "Mid-to-Senior",
          required_skills: technologies.slice(0, 4),
          why: "Core technical demand aligned with company technologies.",
        },
      ],
      skill_demands: technologies.length ? technologies : ["React", "Node.js", "PostgreSQL"],
      compensation_benchmarks_npr: [
        {
          role: activeJobs[0]?.title || "Software Engineer",
          min_salary: "Rs. 60,000",
          max_salary: "Rs. 130,000",
          market_trend: "High demand",
        },
      ],
      hiring_velocity_assessment:
        "Steady candidate pipeline with opportunities to streamline initial screening.",
    };
    aiRecommendations = {
      recruitment_strategy: [
        "Refine required vs good-to-have skills on job posts",
        "Engage shortlisted candidates within 48 hours",
      ],
      candidate_screening_criteria: [
        {
          category: "Core Competency",
          must_have: "Proven experience in required tech stack",
          good_to_have: "Portfolio or GitHub repositories",
        },
      ],
      interview_focus_areas: ["Practical problem solving", "Team culture and ownership"],
      employer_branding_suggestions: [
        "Highlight remote/hybrid flexibility and engineering culture",
      ],
    };
  }

  // 8. Fetch existing company intelligence record for version comparison
  const { data: existingRecord } = await supabaseAdmin
    .from("company_intelligence")
    .select("id, hiring_readiness_score, version_number")
    .eq("company_id", companyId)
    .maybeSingle();

  const previousScore =
    existingRecord?.hiring_readiness_score != null
      ? Number(existingRecord.hiring_readiness_score)
      : null;
  const scoreChange = previousScore != null ? Math.round(hiringReadinessScore - previousScore) : 0;
  const nextVersion = (existingRecord?.version_number ?? 0) + 1;

  // 9. Upsert active Company Intelligence record
  const payload = {
    company_id: companyId,
    employer_id: employerId,
    company_name: company.name,
    industry: company.industry,
    size: company.size,
    location: company.headquarters || company.location,
    website: company.website,
    hiring_readiness_score: hiringReadinessScore,
    profile_completeness: completeness,
    technologies,
    benefits,
    culture_highlights: cultureHighlights,
    projects_services: (company as any).projects || [],
    job_stats: jobStats,
    social_links: socialLinks,
    ai_hiring_roadmap: aiHiringRoadmap,
    ai_recommendations: aiRecommendations,
    score_change: scoreChange,
    version_number: nextVersion,
    last_synced_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data: updatedRecord, error: upsertError } = await supabaseAdmin
    .from("company_intelligence")
    .upsert(payload, { onConflict: "company_id" })
    .select()
    .single();

  if (upsertError) {
    console.error("[Company Intelligence Engine] Upsert failed:", upsertError);
  }

  // 10. Persist versioned snapshot into company_intelligence_snapshots
  await supabaseAdmin.from("company_intelligence_snapshots").insert({
    company_id: companyId,
    employer_id: employerId,
    version_number: nextVersion,
    snapshot_type: snapshotType,
    hiring_readiness_score: hiringReadinessScore,
    profile_completeness: completeness,
    job_stats: jobStats,
    technologies,
    ai_hiring_roadmap: aiHiringRoadmap,
    ai_recommendations: aiRecommendations,
    score_change: scoreChange,
    metadata: {
      active_jobs_count: activeJobs.length,
      total_applicants: totalApplicants,
      snapshot_trigger: snapshotType,
    },
  });

  // 11. Record employer activity in user_activities
  if (employerId) {
    await recordUserActivity({
      userId: employerId,
      activityType: "COMPANY_INTELLIGENCE_SYNCED",
      entityType: "companies",
      entityId: companyId,
      metadata: {
        company_name: company.name,
        hiring_readiness_score: hiringReadinessScore,
        snapshot_type: snapshotType,
        version: nextVersion,
      },
    });
  }

  return updatedRecord || payload;
}

// ── Server Functions ────────────────────────────────────────────────────────

/**
 * Fetch company intelligence for the authenticated employer's company.
 */
export const getCompanyIntelligence = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ companyId: z.string().uuid().optional() }).optional())
  .handler(async ({ data, context }) => {
    const userId = context.userId;
    if (!userId) throw new Error("Not authenticated");

    let companyId = data?.companyId;

    if (!companyId) {
      // Find the user's primary company
      const { data: company } = await supabaseAdmin
        .from("companies")
        .select("id")
        .eq("owner_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!company) {
        return { intelligence: null, snapshots: [], company: null };
      }
      companyId = company.id;
    }

    // Verify company ownership or admin
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    const isAdmin = roleData?.role === "admin";

    const { data: company } = await supabaseAdmin
      .from("companies")
      .select("*")
      .eq("id", companyId)
      .single();

    if (!company || (!isAdmin && company.owner_id !== userId)) {
      throw new Error("Not authorized to access this company's intelligence");
    }

    let { data: intelligence } = await supabaseAdmin
      .from("company_intelligence")
      .select("*")
      .eq("company_id", companyId)
      .maybeSingle();

    if (!intelligence) {
      intelligence = await syncAndBuildCompanyIntelligence(companyId, "INITIAL_SYNC", userId);
    }

    const { data: snapshots } = await supabaseAdmin
      .from("company_intelligence_snapshots")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(30);

    const { data: jobs } = await supabaseAdmin
      .from("jobs")
      .select("id, title, status, required_skills, applications_count, created_at")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    return {
      company,
      intelligence: (intelligence as unknown as CompanyIntelligenceRecord) || null,
      snapshots: (snapshots || []) as unknown as CompanySnapshotRecord[],
      jobs: jobs || [],
    };
  });

/**
 * Manually trigger synchronization of Company Intelligence.
 */
export const syncCompanyIntelligence = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ companyId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const userId = context.userId;
    if (!userId) throw new Error("Not authenticated");

    const { data: company } = await supabaseAdmin
      .from("companies")
      .select("id, owner_id")
      .eq("id", data.companyId)
      .single();

    if (!company) throw new Error("Company not found");

    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (company.owner_id !== userId && roleData?.role !== "admin") {
      throw new Error("Not authorized to sync this company's intelligence");
    }

    const result = await syncAndBuildCompanyIntelligence(data.companyId, "MANUAL_SYNC", userId);
    return { success: true, intelligence: result as unknown as CompanyIntelligenceRecord };
  });

/**
 * Admin view: Retrieve complete 360° Company Intelligence and hiring analytics.
 */
export const adminGetCompanyIntelligence = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ companyId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const adminUserId = context.userId;
    if (!adminUserId) throw new Error("Not authenticated");

    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", adminUserId)
      .maybeSingle();

    if (!roleData || roleData.role !== "admin") {
      throw new Error("Not authorized: admin role required");
    }

    const companyId = data.companyId;

    const [{ data: company }, { data: intelligence }, { data: snapshots }, { data: jobs }] =
      await Promise.all([
        supabaseAdmin.from("companies").select("*").eq("id", companyId).maybeSingle(),
        supabaseAdmin
          .from("company_intelligence")
          .select("*")
          .eq("company_id", companyId)
          .maybeSingle(),
        supabaseAdmin
          .from("company_intelligence_snapshots")
          .select("*")
          .eq("company_id", companyId)
          .order("created_at", { ascending: false })
          .limit(30),
        supabaseAdmin
          .from("jobs")
          .select(
            "id, title, status, required_skills, salary_min, salary_max, location, applications_count, created_at",
          )
          .eq("company_id", companyId)
          .order("created_at", { ascending: false }),
      ]);

    let activities: any[] = [];
    if (company?.owner_id) {
      const { data: actData } = await supabaseAdmin
        .from("user_activities")
        .select("*")
        .eq("user_id", company.owner_id)
        .order("created_at", { ascending: false })
        .limit(30);
      activities = actData || [];
    }

    return {
      company,
      intelligence: (intelligence as unknown as CompanyIntelligenceRecord) || null,
      snapshots: (snapshots || []) as unknown as CompanySnapshotRecord[],
      jobs: jobs || [],
      activities,
    };
  });

/**
 * Build authoritative text context of the company for all employer AI tools.
 */
export async function getAuthoritativeCompanyContextText(companyId: string): Promise<string> {
  if (!companyId) return "No company profile context available.";

  const { data: ci } = await supabaseAdmin
    .from("company_intelligence")
    .select("*")
    .eq("company_id", companyId)
    .maybeSingle();

  if (!ci) {
    // Fallback directly to company table
    const { data: comp } = await supabaseAdmin
      .from("companies")
      .select("name, industry, description, headquarters, size, website, technologies, benefits")
      .eq("id", companyId)
      .maybeSingle();

    if (!comp) return "No company profile context available.";

    return [
      `## Company Profile Context`,
      `- Company Name: ${comp.name}`,
      `- Industry: ${comp.industry || "Technology"}`,
      `- Location: ${comp.headquarters || "Nepal"}`,
      `- Size: ${comp.size || "Standard"}`,
      `- Overview: ${comp.description || "N/A"}`,
    ].join("\n");
  }

  const tech = Array.isArray(ci.technologies) ? ci.technologies.join(", ") : "Standard";
  const benefits = Array.isArray(ci.benefits) ? ci.benefits.join(", ") : "Competitive";
  const stats = (ci.job_stats as any) || {
    total_jobs: 0,
    active_jobs: 0,
    total_applicants: 0,
    shortlisted_count: 0,
  };

  return [
    `## Employer & Company Intelligence Context`,
    `- Company: ${ci.company_name} (${ci.industry || "Industry"})`,
    `- Location / HQ: ${ci.location || "Nepal"}`,
    `- Company Size: ${ci.size || "10-50 employees"}`,
    `- Hiring Readiness Score: ${ci.hiring_readiness_score}/100`,
    `- Technologies Stack: ${tech}`,
    `- Benefits & Culture: ${benefits}`,
    `- Recruitment Activity: ${stats.active_jobs} active job postings, ${stats.total_applicants} total applicants received, ${stats.shortlisted_count || 0} shortlisted candidates`,
  ].join("\n");
}
