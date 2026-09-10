/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth.middleware";
import { aiGenerateJsonValidated } from "@/integrations/ai/ai-service";
import { recordUserActivity } from "@/lib/activity.server";

// ── Schemas & Types ─────────────────────────────────────────────────────────

export interface CareerPathItem {
  title: string;
  description: string;
  required_skills: string[];
  growth_potential: string;
  salary_range_npr?: string;
}

export interface RecommendedCertification {
  name: string;
  provider: string;
}

export interface AICareerRoadmap {
  career_paths: CareerPathItem[];
  skill_gaps: string[];
  recommended_certifications: RecommendedCertification[];
  market_readiness?: string;
}

export interface GithubIntelligenceData {
  username: string | null;
  profile_url: string | null;
  project_count: number;
  top_languages: string[];
  total_stars: number;
  synced_at: string;
}

export interface LinkedInIntelligenceData {
  profile_url: string | null;
  headline: string | null;
  about_summary: string | null;
  has_linked_profile: boolean;
  synced_at: string;
}

export interface ResumeIntelligenceSummary {
  resume_id: string | null;
  file_name: string | null;
  ats_score: number | null;
  latest_scan_id: string | null;
  last_scanned_at: string | null;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

export interface ApplicationStatsData {
  total_applied: number;
  in_review: number;
  interview_count: number;
  offer_count: number;
  recent_roles: Array<{
    title?: string;
    company?: string;
    status?: string;
    applied_at?: string;
  }>;
}

export interface UserCareerIntelligenceRecord {
  id: string;
  user_id: string;
  version: number;
  career_readiness_score: number;
  ats_score: number | null;
  profile_completeness: number;
  candidate_name: string | null;
  headline: string | null;
  current_position: string | null;
  experience_years: number;
  location: string | null;
  skills: string[];
  projects: any[];
  experience: any[];
  education: any[];
  github_data: GithubIntelligenceData;
  linkedin_data: LinkedInIntelligenceData;
  resume_summary: ResumeIntelligenceSummary;
  application_stats: ApplicationStatsData;
  ai_career_roadmap: AICareerRoadmap;
  ai_recommendations: string[];
  created_at: string;
  updated_at: string;
  score_change?: number | null;
}

export interface CareerIntelligenceSnapshotRecord {
  id: string;
  user_id: string;
  version: number;
  snapshot_type: string;
  career_readiness_score: number;
  ats_score: number | null;
  profile_completeness: number;
  candidate_name: string | null;
  headline: string | null;
  skills: string[];
  projects: any[];
  experience: any[];
  education: any[];
  github_data: GithubIntelligenceData;
  linkedin_data: LinkedInIntelligenceData;
  resume_summary: ResumeIntelligenceSummary;
  application_stats: ApplicationStatsData;
  ai_career_roadmap: AICareerRoadmap;
  ai_recommendations: string[];
  score_change: number | null;
  created_at: string;
}

const careerInsightsSchema = z.object({
  career_paths: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      required_skills: z.array(z.string()),
      growth_potential: z.string(),
      salary_range_npr: z.string().optional(),
    }),
  ),
  skill_gaps: z.array(z.string()),
  recommended_certifications: z.array(
    z.object({
      name: z.string(),
      provider: z.string(),
    }),
  ),
  actionable_recommendations: z.array(z.string()),
  strengths: z.array(z.string()),
  market_readiness_assessment: z.string(),
});

// ── Helpers ─────────────────────────────────────────────────────────────────

function computeProfileCompleteness(profile: any, resume: any): number {
  let score = 0;
  if (profile?.full_name) score += 15;
  if (profile?.headline || profile?.current_position) score += 10;
  if (profile?.bio || profile?.about) score += 10;
  if (profile?.location) score += 5;
  if (Array.isArray(profile?.skills) && profile.skills.length >= 3) score += 15;
  if (Array.isArray(profile?.experience) && profile.experience.length > 0) score += 15;
  if (Array.isArray(profile?.education) && profile.education.length > 0) score += 10;
  if (Array.isArray(profile?.projects) && profile.projects.length > 0) score += 10;
  if (resume?.id) score += 10;
  return Math.min(100, score);
}

function computeCareerReadinessScore(
  atsScore: number | null,
  completeness: number,
  projectCount: number,
  skillsCount: number,
): number {
  const atsComponent = (atsScore ?? 60) * 0.45;
  const completenessComponent = completeness * 0.25;
  const projectsComponent = Math.min(100, projectCount * 25) * 0.15;
  const skillsComponent = Math.min(100, skillsCount * 10) * 0.15;
  return Math.max(
    0,
    Math.min(
      100,
      Math.round(atsComponent + completenessComponent + projectsComponent + skillsComponent),
    ),
  );
}

// ── Core Sync Engine ────────────────────────────────────────────────────────

/**
 * Builds and persists consolidated 360° Career Intelligence for a user.
 */
export async function syncAndBuildCareerIntelligence(
  userId: string,
  snapshotType = "FULL_SYNC",
): Promise<any> {
  // 1. Fetch Profile
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  // 2. Fetch Latest Resume & Scan Data
  const [{ data: resume }, { data: latestScan }, { data: applications }] = await Promise.all([
    supabaseAdmin
      .from("resumes")
      .select("*")
      .eq("user_id", userId)
      .eq("is_default", true)
      .maybeSingle(),
    supabaseAdmin
      .from("resume_scans")
      .select("*")
      .eq("user_id", userId)
      .eq("scan_status", "completed")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabaseAdmin
      .from("applications")
      .select("id, status, created_at, job:jobs(title, company:companies(name))")
      .eq("applicant_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  // 3. Aggregate and Deduplicate Skills
  const rawSkills: string[] = [
    ...(Array.isArray(profile?.skills) ? profile.skills : []),
    ...(Array.isArray(latestScan?.extracted_skills) ? latestScan.extracted_skills : []),
    ...(Array.isArray((resume?.parsed_data as any)?.skills)
      ? (resume?.parsed_data as any).skills
      : []),
  ];

  const candidateSkills = Array.from(
    new Set(rawSkills.map((s) => String(s).trim()).filter((s) => s.length > 0)),
  ).slice(0, 35);

  // 4. Aggregate Verified Projects (from profile & GitHub)
  const projects = Array.isArray(profile?.projects) ? profile.projects : [];

  // 5. GitHub Summary (Sanitized — zero secrets)
  const githubUsername = (profile?.github_username || "").trim();
  const githubData = {
    username: githubUsername || null,
    profile_url:
      profile?.github_url || (githubUsername ? `https://github.com/${githubUsername}` : null),
    project_count: projects.length,
    top_languages: Array.from(new Set(projects.map((p: any) => p.language).filter(Boolean))),
    total_stars: projects.reduce((acc: number, p: any) => acc + (Number(p.stars) || 0), 0),
    synced_at: profile?.updated_at || new Date().toISOString(),
  };

  // 6. LinkedIn Summary (Sanitized — only user-provided data)
  const linkedinData = {
    profile_url: profile?.linkedin_url || null,
    headline: profile?.headline || null,
    about_summary: profile?.about || profile?.bio || null,
    has_linked_profile: Boolean(profile?.linkedin_url || profile?.about),
    synced_at: profile?.updated_at || new Date().toISOString(),
  };

  // 7. Resume Summary
  const atsScore = latestScan?.ats_score ?? resume?.ats_score ?? resume?.overall_score ?? null;
  const resumeSummary = {
    resume_id: resume?.id || null,
    file_name: resume?.file_name || latestScan?.file_name || null,
    ats_score: atsScore,
    latest_scan_id: latestScan?.id || null,
    last_scanned_at: latestScan?.created_at || null,
    strengths: (latestScan as any)?.strengths || (resume?.career_roadmap as any)?.strengths || [],
    weaknesses:
      (latestScan as any)?.weaknesses || (resume?.career_roadmap as any)?.weaknesses || [],
    suggestions: (latestScan as any)?.recommendations || resume?.suggestions || [],
  };

  // 8. Application Statistics
  const appList = applications || [];
  const applicationStats = {
    total_applied: appList.length,
    in_review: appList.filter(
      (a) => a.status === "reviewing" || a.status === "applied" || a.status === "viewed",
    ).length,
    interview_count: appList.filter(
      (a) =>
        a.status === "interview" ||
        a.status === "interview_scheduled" ||
        a.status === "interview_completed" ||
        a.status === "shortlisted",
    ).length,
    offer_count: appList.filter((a) => a.status === "offer" || a.status === "selected").length,
    recent_roles: appList.slice(0, 5).map((a: any) => ({
      title: a.job?.title,
      company: a.job?.company?.name,
      status: a.status,
      applied_at: a.created_at,
    })),
  };

  // 9. Compute Metrics
  const profileCompleteness = computeProfileCompleteness(profile, resume);
  const careerReadinessScore = computeCareerReadinessScore(
    atsScore,
    profileCompleteness,
    projects.length,
    candidateSkills.length,
  );

  const candidateName = (profile?.full_name || "").trim();

  // 10. Generate AI Career Intelligence Roadmap
  const promptContext = [
    `Candidate Name: ${candidateName || "Not specified"}`,
    `Headline: ${profile?.headline || profile?.current_position || "Job Seeker"}`,
    `Experience: ${profile?.experience_years || 0} years`,
    `Location: ${profile?.location || "Nepal"}`,
    `Skills: ${candidateSkills.join(", ") || "None"}`,
    `Projects: ${JSON.stringify(projects.slice(0, 5))}`,
    `ATS Score: ${atsScore ?? "Not scored"}`,
    `Resume Strengths: ${(resumeSummary.strengths || []).join(", ") || "None"}`,
    `Application Activity: ${applicationStats.total_applied} jobs applied`,
  ].join("\n");

  const systemPrompt = `You are the Jagire AI Chief Career Strategist.
Generate a comprehensive, actionable 360-degree career intelligence assessment tailored for the candidate in the Nepal and global tech/professional job market.
If the candidate name is provided, address them naturally in the assessment without awkward repetition.

Return ONLY valid JSON matching this schema:
{
  "career_paths": [
    {
      "title": string,
      "description": string,
      "required_skills": string[],
      "growth_potential": string,
      "salary_range_npr": string
    }
  ],
  "skill_gaps": string[],
  "recommended_certifications": [
    {
      "name": string,
      "provider": string
    }
  ],
  "actionable_recommendations": string[],
  "strengths": string[],
  "market_readiness_assessment": string
}`;

  let aiInsights: any = {
    career_paths: (latestScan?.career_roadmap as any)?.career_paths || [],
    skill_gaps: (latestScan?.career_roadmap as any)?.skill_gaps || [],
    recommended_certifications:
      (latestScan?.career_roadmap as any)?.recommended_certifications || [],
    actionable_recommendations: (latestScan as any)?.recommendations || [],
    strengths: (latestScan as any)?.strengths || [],
    market_readiness_assessment: `Candidate has an ATS score of ${atsScore ?? 70} with ${candidateSkills.length} identified skills.`,
  };

  try {
    const generated = await aiGenerateJsonValidated(
      promptContext,
      systemPrompt,
      careerInsightsSchema,
      "career-suggestions",
    );
    if (generated && generated.career_paths?.length) {
      aiInsights = generated;
    }
  } catch (e) {
    console.warn(
      "[Career Intelligence] AI generation fallback to existing scan data:",
      (e as Error).message,
    );
  }

  // 11. Determine Version and Score Change
  const { data: previousSnapshot } = await supabaseAdmin
    .from("career_intelligence_snapshots")
    .select("version, career_readiness_score")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextVersion = (previousSnapshot?.version ?? 0) + 1;
  const scoreChange =
    previousSnapshot?.career_readiness_score != null
      ? careerReadinessScore - previousSnapshot.career_readiness_score
      : null;

  // 12. Upsert into user_career_intelligence
  const payload = {
    user_id: userId,
    version: nextVersion,
    career_readiness_score: careerReadinessScore,
    ats_score: atsScore,
    profile_completeness: profileCompleteness,
    candidate_name: candidateName || null,
    headline: profile?.headline || profile?.current_position || null,
    current_position: profile?.current_position || null,
    experience_years: Number(profile?.experience_years) || 0,
    location: profile?.location || null,
    skills: candidateSkills,
    projects,
    experience: Array.isArray(profile?.experience) ? profile.experience : [],
    education: Array.isArray(profile?.education) ? profile.education : [],
    github_data: githubData,
    linkedin_data: linkedinData,
    resume_summary: resumeSummary,
    application_stats: applicationStats,
    ai_career_roadmap: {
      career_paths: aiInsights.career_paths,
      skill_gaps: aiInsights.skill_gaps,
      recommended_certifications: aiInsights.recommended_certifications,
      market_readiness: aiInsights.market_readiness_assessment,
    },
    ai_recommendations: aiInsights.actionable_recommendations,
    updated_at: new Date().toISOString(),
  };

  const { data: updatedIntelligence, error: upsertErr } = await supabaseAdmin
    .from("user_career_intelligence")
    .upsert(payload, { onConflict: "user_id" })
    .select()
    .single();

  if (upsertErr) {
    console.error("[Career Intelligence] Upsert failed:", upsertErr.message);
  }

  // 13. Insert Snapshot
  await supabaseAdmin.from("career_intelligence_snapshots").insert({
    user_id: userId,
    version: nextVersion,
    snapshot_type: snapshotType,
    career_readiness_score: careerReadinessScore,
    ats_score: atsScore,
    profile_completeness: profileCompleteness,
    candidate_name: candidateName || null,
    headline: payload.headline,
    skills: candidateSkills,
    projects,
    experience: payload.experience,
    education: payload.education,
    github_data: githubData,
    linkedin_data: linkedinData,
    resume_summary: resumeSummary,
    application_stats: applicationStats,
    ai_career_roadmap: payload.ai_career_roadmap,
    ai_recommendations: payload.ai_recommendations,
    score_change: scoreChange,
  });

  // 14. Log activity
  await recordUserActivity({
    userId,
    activityType: "CAREER_ROADMAP_GENERATED",
    entityType: "career_intelligence",
    entityId: updatedIntelligence?.id ?? userId,
    metadata: {
      career_readiness_score: careerReadinessScore,
      ats_score: atsScore,
      profile_completeness: profileCompleteness,
      version: nextVersion,
    },
  });

  return updatedIntelligence || payload;
}

// ── Server Functions ────────────────────────────────────────────────────────

/**
 * Get the authenticated user's complete Career Intelligence record and history.
 */
export const getUserCareerIntelligence = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const userId = context.userId;
    if (!userId) throw new Error("Not authenticated");

    let { data: intelligence } = await supabaseAdmin
      .from("user_career_intelligence")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    // Auto-sync if not present yet
    if (!intelligence) {
      intelligence = await syncAndBuildCareerIntelligence(userId, "INITIAL_SYNC");
    }

    const { data: snapshots } = await supabaseAdmin
      .from("career_intelligence_snapshots")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30);

    return {
      intelligence: (intelligence as unknown as UserCareerIntelligenceRecord) || null,
      snapshots: (snapshots || []) as unknown as CareerIntelligenceSnapshotRecord[],
    };
  });

/**
 * Manually trigger a full career intelligence synchronization.
 */
export const syncCareerIntelligence = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const userId = context.userId;
    if (!userId) throw new Error("Not authenticated");

    const result = await syncAndBuildCareerIntelligence(userId, "MANUAL_SYNC");
    return { success: true, intelligence: result as unknown as UserCareerIntelligenceRecord };
  });

/**
 * Admin view: Retrieve complete 360° Career Intelligence for any candidate.
 */
export const adminGetUserCareerIntelligence = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ userId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const adminUserId = context.userId;
    if (!adminUserId) throw new Error("Not authenticated");

    // Verify admin role
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", adminUserId)
      .maybeSingle();

    if (!roleData || roleData.role !== "admin") {
      throw new Error("Not authorized: admin role required");
    }

    const userId = data.userId;

    const [
      { data: intelligence },
      { data: snapshots },
      { data: profile },
      { data: scans },
      { data: activities },
    ] = await Promise.all([
      supabaseAdmin
        .from("user_career_intelligence")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle(),
      supabaseAdmin
        .from("career_intelligence_snapshots")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(30),
      supabaseAdmin.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabaseAdmin
        .from("resume_scans")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20),
      supabaseAdmin
        .from("user_activities")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(40),
    ]);

    return {
      intelligence: (intelligence as unknown as UserCareerIntelligenceRecord) || null,
      snapshots: (snapshots || []) as unknown as CareerIntelligenceSnapshotRecord[],
      profile,
      scans: scans || [],
      activities: activities || [],
    };
  });

/**
 * Save user's preferred name to their profile and sync career intelligence.
 */
export const updatePreferredName = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ preferredName: z.string().min(1).max(100) }))
  .handler(async ({ data, context }) => {
    const userId = context.userId;
    if (!userId) throw new Error("Not authenticated");

    const trimmed = data.preferredName.trim();
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ full_name: trimmed })
      .eq("id", userId);

    if (error) throw error;

    await recordUserActivity({
      userId,
      activityType: "PROFILE_UPDATED",
      entityType: "profiles",
      entityId: userId,
      metadata: { preferred_name: trimmed },
    });

    // Re-sync career intelligence
    const updated = await syncAndBuildCareerIntelligence(userId, "PROFILE_UPDATED");
    return { success: true, intelligence: updated };
  });

/**
 * Helper to build comprehensive text context for AI prompts across all AI tools.
 */
export async function getAuthoritativeCareerContextText(
  supabaseOrUserId: any,
  optionalUserId?: string,
): Promise<string> {
  const userId = optionalUserId || (typeof supabaseOrUserId === "string" ? supabaseOrUserId : "");
  if (!userId) return "Candidate profile context not yet synchronized.";

  const { data: ci } = await supabaseAdmin
    .from("user_career_intelligence")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!ci) return "Candidate profile context not yet synchronized.";

  const skills = Array.isArray(ci.skills) ? ci.skills.join(", ") : "None listed";
  const projects = Array.isArray(ci.projects)
    ? ci.projects
        .map((p: any) => `- ${p.name} (${p.language || "Tech"}): ${p.description || "Project"}`)
        .join("\n")
    : "None listed";

  const githubData = ci.github_data as any;
  const linkedinData = ci.linkedin_data as any;
  const appStats = ci.application_stats as any;

  return [
    `## Candidate Career Intelligence Context`,
    `- Preferred Name: ${ci.candidate_name || "Candidate"}`,
    `- Current Role / Headline: ${ci.headline || "Job Seeker"}`,
    `- Experience: ${ci.experience_years || 0} years`,
    `- Location: ${ci.location || "Nepal"}`,
    `- Career Readiness Index: ${ci.career_readiness_score}/100`,
    `- Latest ATS Resume Score: ${ci.ats_score ? `${ci.ats_score}/100` : "Not scanned"}`,
    `- GitHub Integration: ${githubData?.username ? `@${githubData.username} (${githubData.project_count} repos, ${githubData.total_stars} stars)` : "Not linked"}`,
    `- LinkedIn Profile: ${linkedinData?.profile_url ? "Linked" : "Not linked"}`,
    `- Combined Skills (${Array.isArray(ci.skills) ? ci.skills.length : 0}): ${skills}`,
    `- Verified & Highlighted Projects:\n${projects}`,
    `- Applications Activity: ${appStats?.total_applied ?? 0} applied (${appStats?.interview_count ?? 0} interviews, ${appStats?.offer_count ?? 0} offers)`,
  ].join("\n");
}
