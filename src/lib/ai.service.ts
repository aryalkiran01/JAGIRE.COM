/* eslint-disable @typescript-eslint/no-explicit-any */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth.middleware";
import { aiGenerateJsonValidated, aiGenerateText } from "@/integrations/ai/ai-service";
import { requirePremium } from "@/lib/premium.server";
import {
  resumeAnalysisSchema,
  fullResumeScanSchema,
  careerRecommendationsSchema,
  linkedinImportSchema,
  learningRecommendationsSchema,
  careerCoachResponseSchema,
} from "@/integrations/ai/schemas";

// ── Types ───────────────────────────────────────────────────────────────────

export type JobMatchResult = {
  id: string;
  title: string;
  company: string | null;
  companyId: string | null;
  score: number;
  location: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  jobType: string | null;
  requiredSkills: string[];
  matchingSkills: string[];
  missingSkills: string[];
  isNepalBased: boolean;
  companyLocation: string | null;
  description: string | null;
  matchReasoning: string;
  recommendedNextSteps: string[];
};

// ── Prompt Templates ─────────────────────────────────────────────────────────

const PROMPTS = {
  RESUME_ANALYSIS: {
    system: `You are an expert ATS (Applicant Tracking System) resume reviewer with deep expertise in recruitment technology and HR best practices.

Analyze the resume and provide a comprehensive assessment focusing on:
1. ATS compatibility (parsing accuracy, keyword optimization, formatting)
2. Grammar and language quality
3. Professional formatting and structure
4. Industry-relevant keywords and skills
5. Overall professionalism and impact

Scoring guidelines:
- 90-100: Excellent - ready for top-tier applications
- 75-89: Good - minor improvements needed
- 60-74: Average - significant improvements required
- Below 60: Needs major revision

Return JSON in this exact format:
{
  "overall_score": number,
  "ats_score": number,
  "grammar_score": number,
  "formatting_score": number,
  "keyword_score": number,
  "professionalism_score": number,
  "suggestions": string[] (8 actionable, specific improvements),
  "summary": string (2-3 sentence professional summary),
  "extracted_skills": string[] (up to 20 skills found in resume)
}

Important:
- Scores must be integers 0-100
- Suggestions should be specific and actionable (e.g., "Add quantifiable achievements to your work experience section")
- Extract only skills actually mentioned or clearly implied in the resume
- Be constructive and encouraging in tone`,
  },

  FULL_SCAN: {
    system: `You are a senior career strategist and resume expert with 15+ years of experience in talent acquisition and career coaching.

Analyze the resume comprehensively and provide a complete career development assessment.

CRITICAL INSTRUCTIONS:
- Return ONLY valid JSON - no markdown, no explanations
- All arrays must use [] syntax, objects use {} syntax
- Do not use null values - use empty arrays [] instead
- Ensure all string values are properly escaped
- For salary_prediction, use NPR (Nepali Rupees) with monthly figures
- For companies_hiring, PRIORITIZE NEPALI COMPANIES FIRST, then international

Return this exact structure:
{
  "overall_score": number (0-100),
  "ats_score": number (0-100),
  "grammar_score": number (0-100),
  "formatting_score": number (0-100),
  "keyword_score": number (0-100),
  "professionalism_score": number (0-100),
  "suggestions": string[] (8 specific improvements),
  "summary": string (professional summary),
  "extracted_skills": string[] (20 skills),
  "strengths": string[] (5 key strengths),
  "weaknesses": string[] (5 areas for improvement),
  "missing_skills": string[] (10 skills to acquire),
  "keywords": string[] (15 ATS keywords),
  "career_paths": [
    {
      "title": string,
      "why": string (explanation),
      "next_steps": string[] (3-5 steps)
    }
  ] (4 paths),
  "skill_gaps": string[] (8 gaps to address),
  "recommended_certifications": [
    {
      "name": string,
      "provider": string
    }
  ] (5 certifications),
  "suggested_projects": [
    {
      "title": string,
      "description": string
    }
  ] (4 projects),
  "recommended_jobs": [
    {
      "title": string,
      "why": string
    }
  ] (5 job titles),
  "companies_hiring": [
    {
      "name": string,
      "sector": string,
      "location": string (Nepal city or "International"),
      "is_nepal_based": boolean
    }
  ] (5 companies - NEPALI COMPANIES FIRST),
  "salary_prediction": {
    "low": number (NPR monthly),
    "mid": number (NPR monthly),
    "high": number (NPR monthly),
    "currency": "NPR"
  },
  "resume_improvements": string[] (8 improvements),
  "interview_prep_plan": {
    "thirty_days": string[],
    "sixty_days": string[],
    "ninety_days": string[],
    "one_eighty_days": string[]
  }
}

IMPORTANT NEPAL CONTEXT:
- This is for the Nepali job market (Jagire.com)
- Prioritize companies based in Nepal (Kathmandu, Lalitpur, Pokhara, Bhaktapur, etc.)
- Include international companies but list them AFTER Nepali ones
- Salary should be in NPR (Rs.) with realistic Nepali market rates
- Entry level: Rs. 30,000-60,000/month
- Mid level: Rs. 60,000-120,000/month
- Senior level: Rs. 120,000-250,000/month`,
  },

  JOB_MATCH_ANALYSIS: {
    system: `You are an expert job matching AI for Jagire.com, a Nepal-focused job platform.

Your task is to analyze the candidate's profile and match them with the available jobs.

## Matching Criteria:
1. **Skills Match (40%)**: How well the candidate's skills align with required skills
2. **Experience Level (25%)**: Whether experience level matches the job requirements
3. **Job Title Relevance (20%)**: How relevant the candidate's background is to the job title
4. **Location Preference (15%)**: Whether location aligns with candidate preferences

## Scoring Guidelines:
- 90-100: Exceptional match - candidate is ideal
- 75-89: Strong match - highly recommended
- 60-74: Good match - worth applying
- 40-59: Moderate match - may need training
- Below 40: Weak match - not recommended

## Important:
- Consider related skills (e.g., JavaScript = TypeScript, React = Frontend)
- Consider the Nepali job market context
- Prioritize Nepal-based companies in your analysis
- Be realistic about skill matches
- Consider both hard skills and soft skills

## Return JSON:
{
  "matches": [
    {
      "job_id": string,
      "score": number (0-100),
      "matching_skills": string[],
      "missing_skills": string[],
      "match_reasoning": string (brief explanation),
      "recommended_next_steps": string[] (2-3 actionable steps)
    }
  ]
}

Return ONLY valid JSON. No markdown, no explanations.`,
  },

  CAREER_RECOMMENDATIONS: {
    system: `You are a senior career coach specializing in technology and professional development in Nepal.

Analyze the candidate's profile and provide personalized career guidance based on:
- Current skills and experience level
- Market demand in Nepal and internationally
- Growth potential and career trajectory
- Skills gaps and development opportunities

Return ONLY valid JSON matching this schema:
{
  "career_paths": [
    {
      "title": string,
      "description": string,
      "required_skills": string[],
      "salary_range": string (in NPR),
      "growth_potential": string
    }
  ],
  "skill_gaps": string[],
  "recommended_certifications": [
    {
      "name": string,
      "provider": string,
      "difficulty": string,
      "time_to_complete": string
    }
  ],
  "suggested_search_keywords": string[]
}

Rules:
- Be specific and realistic for Nepal market
- Consider both local and remote opportunities
- Focus on actionable recommendations
- All arrays should have 3-8 items`,
  },

  LINKEDIN_IMPORT: {
    system: `Extract and structure LinkedIn profile information from the provided text.

Parse the text and identify:
- Full name (use professional name format)
- Headline (professional title)
- About/Summary section
- Location (city, country)
- Current position (title and company)
- Total years of experience (calculate if possible)
- Skills (extract from skills section, endorsements, and descriptions)

Return JSON in this format:
{
  "full_name": string,
  "headline": string,
  "about": string,
  "location": string,
  "current_position": string,
  "experience_years": number,
  "skills": string[] (up to 20)
}

Note: 
- If information is not found, use empty string or 0
- For experience_years, estimate based on work history if not explicitly stated`,
  },

  LEARNING_RECOMMENDATIONS: {
    system: `You are a learning and development specialist who creates personalized education plans.

Generate learning recommendations that are:
1. Specific and actionable
2. Appropriate for the user's current skill level
3. From reputable platforms and providers
4. Aligned with career goals

Focus on these learning types:
- Courses (structured learning paths)
- Videos (quick tutorials and lectures)
- Challenges (hands-on practice)
- Interview preparation

For each recommendation, provide:
- Title: Specific course/resource name
- Provider: Well-known platform (Udemy, Coursera, edX, YouTube, freeCodeCamp, Pluralsight)
- Skills: Technologies or topics covered
- Description: What they'll learn and why it's valuable

CRITICAL: Do NOT include URLs - the system generates search links automatically.

Return JSON:
{
  "items": [
    {
      "kind": "course|video|challenge|interview",
      "title": string,
      "provider": string,
      "skills": string[],
      "description": string
    }
  ]
}

Generate 8 diverse, realistic recommendations.`,
  },

  CAREER_COACH: {
    system: `You are Jagire AI Career Coach, an expert career advisor with deep knowledge of:
- Career development strategies in Nepal
- Resume optimization for Nepali and international jobs
- Interview preparation
- Skills development
- Job market trends in Nepal and globally
- Professional networking

You have access to the user's:
- Profile information
- Resume scores and analysis
- Skills and experience
- Application history
- Career goals

Provide personalized, actionable advice that is:
1. Specific to their situation
2. Practical and implementable
3. Encouraging but honest
4. Focused on actionable steps

Return JSON:
{
  "advice": string (main advice, 3-4 sentences),
  "recommended_skills": string[] (8 skills to develop),
  "action_plan": string[] (6 specific actions),
  "improvement_suggestions": string[] (6 areas to improve),
  "follow_up_questions": string[] (3 questions to better understand their goals)
}`,
  },

  AI_ASSISTANT: {
    system: `You are Jagire AI Assistant, a knowledgeable career mentor for Jagire.com, a Nepal-focused job platform.

Your expertise includes:
- Job search strategies in Nepal
- Resume and cover letter optimization
- Interview preparation
- Skills development
- Career transitions
- Salary negotiation (NPR)
- Professional networking

CONTEXT AWARENESS:
- You have access to the user's profile, resume, applications, and saved jobs
- Use this context to provide personalized, relevant advice
- Reference their specific situation in your answers
- Consider Nepal's job market and industry trends

RESPONSE GUIDELINES:
- Use clear markdown formatting (headings, bullet points, bold)
- Keep responses 150-400 words (concise but thorough)
- Provide specific, actionable recommendations
- Use Nepali context where relevant (Rs. for salary, local companies)
- Be encouraging and professional
- Ask clarifying questions when needed

SALARY INFORMATION:
- Always display in NPR/Rs. format (e.g., Rs. 50,000/month)
- Provide realistic ranges based on role and experience in Nepal
- Consider both local and international opportunities`,
  },
};

// ── Utility Functions ────────────────────────────────────────────────────────

function clamp(n: unknown): number {
  return Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
}

function generateSearchUrl(title: string, provider: string, skills: string[]): string {
  const searchTerm = title || skills[0] || "learning";
  const encoded = encodeURIComponent(searchTerm);

  const providerUrls: Record<string, string> = {
    udemy: `https://www.udemy.com/courses/search/?q=${encoded}`,
    youtube: `https://www.youtube.com/results?search_query=${encoded}+course`,
    coursera: `https://www.coursera.org/search?query=${encoded}`,
    edx: `https://www.edx.org/search?q=${encoded}`,
    pluralsight: `https://www.pluralsight.com/search?q=${encoded}`,
    freecodecamp: `https://www.freecodecamp.org/learn/`,
  };

  const providerLower = provider.toLowerCase();
  for (const [key, url] of Object.entries(providerUrls)) {
    if (providerLower.includes(key)) return url;
  }

  return `https://www.google.com/search?q=${encodeURIComponent(`${searchTerm} ${provider} course`)}`;
}

function extractConversationTitle(question: string): string {
  const cleaned = question.trim().replace(/\s+/g, " ");
  return cleaned.length > 50 ? cleaned.slice(0, 50) + "…" : cleaned || "New conversation";
}

function isNepalBasedCompany(location: string | null | undefined): boolean {
  if (!location) return false;

  const nepalLocations = [
    "nepal",
    "kathmandu",
    "lalitpur",
    "pokhara",
    "bhaktapur",
    "butwal",
    "biratnagar",
    "dharan",
    "janakpur",
    "hetauda",
    "dhangadhi",
    "itahari",
    "nepalgunj",
    "birgunj",
    "banepa",
    "dhulikhel",
    "damak",
    "tikapur",
  ];

  const lowerLocation = location.toLowerCase();
  return nepalLocations.some((city) => lowerLocation.includes(city));
}

// ── AI Job Matching Function ───────────────────────────────────────────────

async function aiMatchJobs(
  resumeSkills: string[],
  profile: any,
  jobs: any[],
): Promise<JobMatchResult[]> {
  if (!jobs.length || !resumeSkills.length) return [];

  const candidateProfile = {
    skills: resumeSkills,
    headline: profile?.headline || "",
    experience_years: profile?.experience_years || 0,
    current_position: profile?.current_position || "",
    location: profile?.location || "",
  };

  const jobsForAI = jobs.map((job: any) => ({
    job_id: job.id,
    title: job.title,
    company: job.company?.name || "Unknown",
    required_skills: job.required_skills || [],
    experience_level: job.experience_level || "",
    location: job.location || job.company?.headquarters || "Remote",
    description: job.description?.substring(0, 300) || "",
  }));

  const prompt = `## Candidate Profile:
${JSON.stringify(candidateProfile, null, 2)}

## Available Jobs:
${JSON.stringify(jobsForAI, null, 2)}

Analyze each job and match it with the candidate. Return the match results.`;

  const jobMatchSchema = z.object({
    matches: z
      .array(
        z.object({
          job_id: z.string(),
          score: z.number(),
          matching_skills: z.array(z.string()),
          missing_skills: z.array(z.string()),
          match_reasoning: z.string(),
          recommended_next_steps: z.array(z.string()),
        }),
      )
      .optional(),
  });

  try {
    const aiResult = (await aiGenerateJsonValidated(
      prompt,
      PROMPTS.JOB_MATCH_ANALYSIS.system,
      jobMatchSchema,
      "job-matching",
    )) as {
      matches?: Array<{
        job_id: string;
        score: number;
        matching_skills: string[];
        missing_skills: string[];
        match_reasoning: string;
        recommended_next_steps: string[];
      }>;
    };

    const aiMatches = aiResult.matches || [];

    return aiMatches
      .map((aiMatch: any) => {
        const job = jobs.find((j: any) => j.id === aiMatch.job_id);
        if (!job) return null;

        const company = job.company;
        const companyLocation = company?.headquarters || company?.location || job.location || null;
        const nepalBased = isNepalBasedCompany(companyLocation);

        return {
          id: job.id,
          title: job.title,
          company: company?.name ?? null,
          companyId: company?.id ?? null,
          score: clamp(aiMatch.score),
          location: job.location ?? null,
          salaryMin: job.salary_min ?? null,
          salaryMax: job.salary_max ?? null,
          salaryCurrency: job.salary_currency ?? "NPR",
          jobType: job.job_type ?? null,
          requiredSkills: job.required_skills || [],
          matchingSkills: aiMatch.matching_skills || [],
          missingSkills: aiMatch.missing_skills || [],
          isNepalBased: nepalBased,
          companyLocation,
          description: job.description ?? null,
          matchReasoning: aiMatch.match_reasoning || "",
          recommendedNextSteps: aiMatch.recommended_next_steps || [],
        };
      })
      .filter((match: JobMatchResult | null): match is JobMatchResult => match !== null)
      .sort((a: JobMatchResult, b: JobMatchResult) => {
        if (a.isNepalBased !== b.isNepalBased) {
          return a.isNepalBased ? -1 : 1;
        }
        return b.score - a.score;
      })
      .slice(0, 10);
  } catch (error) {
    console.warn("AI job matching failed:", error);
    return [];
  }
}

// ── Resume Analysis Functions ────────────────────────────────────────────────

export const scoreResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => {
    const i = input as { resumeId: string; text: string };
    if (!i?.resumeId || !i?.text) throw new Error("Missing resumeId or text");
    return { resumeId: i.resumeId, text: i.text.slice(0, 12000) };
  })
  .handler(async ({ data, context }) => {
    await requirePremium(context.userId);

    const parsed = await aiGenerateJsonValidated(
      `Resume:\n${data.text}`,
      PROMPTS.RESUME_ANALYSIS.system,
      resumeAnalysisSchema,
      "resume-analysis",
    );

    const update = {
      overall_score: clamp(parsed.overall_score),
      ats_score: clamp(parsed.ats_score),
      grammar_score: clamp(parsed.grammar_score),
      formatting_score: clamp(parsed.formatting_score),
      keyword_score: clamp(parsed.keyword_score),
      professionalism_score: clamp(parsed.professionalism_score),
      suggestions: parsed.suggestions ?? [],
      parsed_data: { summary: parsed.summary, skills: parsed.extracted_skills ?? [] },
    };

    const { error } = await context.supabase
      .from("resumes")
      .update(update)
      .eq("id", data.resumeId)
      .eq("user_id", context.userId);

    if (error) throw new Error(error.message);
    return update;
  });

export const careerRecommendations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requirePremium(context.userId);

    const [{ data: profile }, { data: resume }] = await Promise.all([
      context.supabase
        .from("profiles")
        .select("full_name,headline,bio,location,experience_years")
        .eq("id", context.userId)
        .maybeSingle(),
      context.supabase
        .from("resumes")
        .select("parsed_data")
        .eq("user_id", context.userId)
        .eq("is_default", true)
        .maybeSingle(),
    ]);

    const skills = (resume?.parsed_data as { skills?: string[] } | null)?.skills ?? [];

    const parsed = await aiGenerateJsonValidated(
      `Profile:${JSON.stringify(profile ?? {})}\nSkills:${skills.join(",") || "unknown"}`,
      PROMPTS.CAREER_RECOMMENDATIONS.system,
      careerRecommendationsSchema,
      "career-suggestions",
    );

    return {
      career_paths: parsed.career_paths ?? [],
      skill_gaps: parsed.skill_gaps ?? [],
      recommended_certifications: parsed.recommended_certifications ?? [],
      suggested_search_keywords: parsed.suggested_search_keywords ?? [],
    };
  });

export const scanResumeFromStorage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => {
    const i = input as { resumeId: string };
    if (!i?.resumeId) throw new Error("Missing resumeId");
    return { resumeId: i.resumeId };
  })
  .handler(async ({ data, context }) => {
    await requirePremium(context.userId);

    const { data: resume, error: rErr } = await context.supabase
      .from("resumes")
      .select("id, file_path, mime_type, file_name, user_id, resume_data, parsed_data")
      .eq("id", data.resumeId)
      .eq("user_id", context.userId)
      .maybeSingle();

    if (rErr || !resume) throw new Error("Resume not found");

    let text = "";
    const parsedData = resume.parsed_data as Record<string, unknown> | null | undefined;
    const storedRawText = typeof parsedData?.raw_text === "string" ? parsedData.raw_text : "";

    if (storedRawText) {
      text = storedRawText;
    } else if (resume.resume_data) {
      const resumeData = resume.resume_data as any;
      text = [
        resumeData.full_name,
        resumeData.headline,
        resumeData.summary,
        ...(resumeData.experience?.items || []),
        ...(resumeData.education?.items || []),
        ...(resumeData.projects?.items || []),
        ...(resumeData.skills?.items || []),
      ]
        .filter(Boolean)
        .join("\n");
    } else if (resume.file_path) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const dl = await supabaseAdmin.storage.from("resumes").download(resume.file_path);
      if (dl.error || !dl.data) throw new Error(dl.error?.message ?? "Failed to download resume");
      const buf = new Uint8Array(await dl.data.arrayBuffer());

      const name = (resume.file_name ?? "").toLowerCase();
      const isDocx = name.endsWith(".docx") || resume.mime_type?.includes("wordprocessingml");
      const isPdf = name.endsWith(".pdf") || resume.mime_type?.includes("pdf");

      try {
        if (isDocx) {
          const mammoth = await import("mammoth");
          const res = await mammoth.extractRawText({ buffer: Buffer.from(buf) });
          text = res.value ?? "";
        } else if (isPdf) {
          let extractedSuccessfully = false;

          try {
            const pdfParseModule = await import("pdf-parse");
            const pdfParse = pdfParseModule.default ?? pdfParseModule;
            const pdfData = await pdfParse(Buffer.from(buf));
            text = pdfData.text ?? "";
            extractedSuccessfully = text.trim().length >= 50;
          } catch (err) {
            console.warn("pdf-parse failed:", err);
          }

          if (!extractedSuccessfully) {
            try {
              const { extractText, getDocumentProxy } = await import("unpdf");
              const pdf = await getDocumentProxy(buf);
              const out = await extractText(pdf, { mergePages: true });
              text = Array.isArray(out.text) ? out.text.join("\n") : (out.text as string);
              extractedSuccessfully = text?.trim().length >= 50;
            } catch (unpdfError) {
              console.warn("unpdf failed:", unpdfError);
            }
          }

          if (!extractedSuccessfully) {
            const rawText = new TextDecoder().decode(buf);
            const readableParts = rawText.match(/[a-zA-Z0-9\s.,!?@#&*()\-–—:;'"/\\]{4,}/g) || [];
            text = readableParts.join(" ").replace(/\s+/g, " ").trim();

            if (text.length < 50) {
              throw new Error(
                "Could not extract enough text from the PDF file. " +
                  "Please ensure your PDF contains selectable text, not scanned images. " +
                  "Try uploading a DOCX version instead.",
              );
            }
          }
        } else {
          text = new TextDecoder().decode(buf);
        }
      } catch (e) {
        throw new Error(`Failed to parse resume: ${(e as Error).message}`);
      }
    } else {
      throw new Error("No resume data or file found");
    }

    text = text.replace(/\s+/g, " ").trim();
    if (text.length < 50) throw new Error("Could not extract enough text from the resume file");
    if (text.length > 8000) text = text.slice(0, 8000);

    const scan = await aiGenerateJsonValidated(
      `Resume:\n${text}`,
      PROMPTS.FULL_SCAN.system,
      fullResumeScanSchema,
      "resume-analysis",
    );

    const scoringUpdate = {
      overall_score: clamp(scan.overall_score),
      ats_score: clamp(scan.ats_score),
      grammar_score: clamp(scan.grammar_score),
      formatting_score: clamp(scan.formatting_score),
      keyword_score: clamp(scan.keyword_score),
      professionalism_score: clamp(scan.professionalism_score),
      suggestions: scan.suggestions ?? [],
      parsed_data: {
        summary: scan.summary,
        skills: scan.extracted_skills ?? [],
        raw_text: text.slice(0, 5000),
      },
      career_roadmap: {
        career_paths: scan.career_paths ?? [],
        skill_gaps: scan.skill_gaps ?? [],
        missing_skills: scan.missing_skills ?? [],
        recommended_certifications: scan.recommended_certifications ?? [],
        suggested_projects: scan.suggested_projects ?? [],
        recommended_jobs: scan.recommended_jobs ?? [],
        companies_hiring: scan.companies_hiring ?? [],
        salary_prediction: scan.salary_prediction ?? null,
        resume_improvements: scan.resume_improvements ?? [],
        interview_prep_plan: scan.interview_prep_plan ?? null,
        strengths: scan.strengths ?? [],
        weaknesses: scan.weaknesses ?? [],
        keywords: scan.keywords ?? [],
      },
    };

    const { error } = await context.supabase
      .from("resumes")
      .update(scoringUpdate)
      .eq("id", resume.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);

    // ── AI Job Matching ─────────────────────────────────────────────────────

    const skills = (scan.extracted_skills ?? []).map((s) => s.toLowerCase()).filter(Boolean);
    let matches: JobMatchResult[] = [];

    if (skills.length) {
      // Fetch user profile for better matching
      const { data: profile } = await context.supabase
        .from("profiles")
        .select("headline, experience_years, current_position, location")
        .eq("id", context.userId)
        .maybeSingle();

      // Fetch all active jobs
      const { data: jobs } = await context.supabase
        .from("jobs")
        .select(
          `
          id,
          title,
          required_skills,
          salary_min,
          salary_max,
          salary_currency,
          location,
          job_type,
          description,
          experience_level,
          company:companies(
            id,
            name,
            headquarters,
            location
          )
        `,
        )
        .eq("status", "active")
        .limit(50);

      if (jobs?.length) {
        matches = await aiMatchJobs(skills, profile, jobs);
      }
    }

    // Update profile with AI data
    const profilePatch = {
      ai_profile_data: {
        summary: scan.summary,
        skills: scan.extracted_skills ?? [],
        strengths: scan.strengths ?? [],
        keywords: scan.keywords ?? [],
        missing_skills: scan.missing_skills ?? [],
      },
    } as any;

    const { data: existingProfile } = await context.supabase
      .from("profiles")
      .select("skills")
      .eq("id", context.userId)
      .maybeSingle();

    const existingSkills = Array.isArray(existingProfile?.skills) ? existingProfile.skills : [];
    if (
      !existingSkills.length &&
      Array.isArray(scan.extracted_skills) &&
      scan.extracted_skills.length
    ) {
      profilePatch.skills = scan.extracted_skills.slice(0, 20);
    }

    await context.supabase
      .from("profiles")
      .update(profilePatch as any)
      .eq("id", context.userId);

    return { ...scoringUpdate, matches };
  });

// ── Import Functions ─────────────────────────────────────────────────────────

export const importFromGitHub = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => {
    const i = input as { username: string };
    const u = (i?.username ?? "").trim().replace(/^@/, "");
    if (!/^[a-zA-Z0-9-]{1,39}$/.test(u)) throw new Error("Invalid GitHub username");
    return { username: u };
  })
  .handler(async ({ data, context }) => {
    await requirePremium(context.userId);

    const headers = {
      Accept: "application/vnd.github+json",
      "User-Agent": "Jagire-App",
    };

    const [uRes, rRes] = await Promise.all([
      fetch(`https://api.github.com/users/${data.username}`, { headers }),
      fetch(`https://api.github.com/users/${data.username}/repos?sort=stars&per_page=100`, {
        headers,
      }),
    ]);

    if (uRes.status === 404) throw new Error("GitHub user not found");
    if (!uRes.ok) throw new Error(`GitHub error (${uRes.status})`);

    const u = await uRes.json();
    const repos: any[] = rRes.ok ? await rRes.json() : [];

    const projects = repos
      .filter((r) => !r.fork)
      .sort((a, b) => (b.stargazers_count ?? 0) - (a.stargazers_count ?? 0))
      .slice(0, 8)
      .map((r) => ({
        name: r.name,
        description: r.description ?? "",
        url: r.html_url,
        stars: r.stargazers_count ?? 0,
        language: r.language ?? null,
      }));

    const skills = Array.from(
      new Set(repos.map((r) => r.language).filter(Boolean) as string[]),
    ).slice(0, 20);

    const patch: Record<string, any> = {
      github_username: data.username,
      github_url: `https://github.com/${data.username}`,
      projects,
    };

    if (u.name) patch.full_name = u.name;
    if (u.bio) patch.about = u.bio;
    if (u.location) patch.location = u.location;
    if (u.blog) patch.website = u.blog.startsWith("http") ? u.blog : `https://${u.blog}`;
    if (u.avatar_url) patch.avatar_url = u.avatar_url;
    if (skills.length) patch.skills = skills;

    const { error } = await (context.supabase.from("profiles") as any)
      .update(patch)
      .eq("id", context.userId);

    if (error) throw new Error(error.message);
    return { imported: { projects: projects.length, skills: skills.length } };
  });

export const importFromLinkedInText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => {
    const i = input as { text: string; url?: string };
    if (!i?.text || i.text.trim().length < 50)
      throw new Error("Paste at least your LinkedIn About / Experience text");
    return { text: i.text.slice(0, 10000), url: (i.url ?? "").trim() };
  })
  .handler(async ({ data, context }) => {
    await requirePremium(context.userId);

    const parsed = await aiGenerateJsonValidated(
      data.text,
      PROMPTS.LINKEDIN_IMPORT.system,
      linkedinImportSchema,
      "linkedin-import",
    );

    const patch: Record<string, any> = {};
    if (parsed.full_name) patch.full_name = parsed.full_name;
    if (parsed.headline) patch.headline = parsed.headline;
    if (parsed.about) patch.about = parsed.about;
    if (parsed.location) patch.location = parsed.location;
    if (parsed.current_position) patch.current_position = parsed.current_position;
    if (Number.isFinite(parsed.experience_years))
      patch.experience_years = Math.max(
        0,
        Math.min(60, Math.round(Number(parsed.experience_years))),
      );
    if (parsed.skills?.length) patch.skills = parsed.skills.slice(0, 20);
    if (data.url) patch.linkedin_url = data.url;

    const { error } = await (context.supabase.from("profiles") as any)
      .update(patch)
      .eq("id", context.userId);

    if (error) throw new Error(error.message);
    return { imported: { fields: Object.keys(patch).length, skills: patch.skills?.length ?? 0 } };
  });

// ── Learning Recommendations ─────────────────────────────────────────────────

export const learningRecommendations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requirePremium(context.userId);

    const { data: profile } = await context.supabase
      .from("profiles")
      .select("skills, headline, experience_years")
      .eq("id", context.userId)
      .maybeSingle();

    const userSkills: string[] = (profile as any)?.skills ?? [];
    const skillsText = userSkills.join(", ") || "software engineering";

    const { data: dbItems } = await context.supabase
      .from("learning_items")
      .select("id, title, kind, provider, url, skills, description")
      .limit(100);

    if (dbItems && dbItems.length >= 8) {
      const shuffled = [...dbItems].sort(() => Math.random() - 0.5);
      const result = shuffled.slice(0, 8).map((item: any) => ({
        id: item.id,
        kind: item.kind || "course",
        title: item.title,
        provider: item.provider || "",
        description: item.description || "",
        skills: item.skills || [],
        url: item.url || generateSearchUrl(item.title, item.provider, item.skills),
        route: "/learn",
      }));
      return { items: result };
    }

    try {
      const timestamp = Date.now();
      const randomSeed = Math.random().toString(36).substring(2, 8);

      const prompt = `Based on these skills: ${skillsText}, suggest 8 DIFFERENT learning resources. 
      For each, provide: kind (course/video/challenge/interview), title, provider (Udemy/YouTube/Coursera/etc.), 
      skills array, and a brief description. Make the suggestions diverse and varied.`;

      const parsed = await aiGenerateJsonValidated(
        prompt,
        PROMPTS.LEARNING_RECOMMENDATIONS.system,
        learningRecommendationsSchema,
        "learning-recommendations",
      );

      return {
        items: (parsed?.items || []).map((item: any, index: number) => ({
          id: `ai-${timestamp}-${randomSeed}-${index}`,
          kind: item.kind || "course",
          title: item.title,
          provider: item.provider || "Online Platform",
          description: item.description || "",
          skills: item.skills || [],
          url: generateSearchUrl(item.title, item.provider, item.skills),
          route: "/learn",
        })),
      };
    } catch (err) {
      console.warn("AI generation failed for learning recommendations:", (err as Error).message);

      if (dbItems && dbItems.length > 0) {
        return {
          items: [...dbItems]
            .sort(() => Math.random() - 0.5)
            .slice(0, 8)
            .map((item: any) => ({
              id: item.id,
              kind: item.kind || "course",
              title: item.title,
              provider: item.provider || "",
              description: item.description || "",
              skills: item.skills || [],
              url: item.url || generateSearchUrl(item.title, item.provider, item.skills),
              route: "/learn",
            })),
        };
      }

      const fallbackSkills =
        userSkills.length > 0
          ? userSkills.slice(0, 5)
          : ["web development", "javascript", "python", "react", "node.js"];

      const timestamp = Date.now();
      return {
        items: fallbackSkills.map((skill, i) => ({
          id: `fallback-${timestamp}-${i}`,
          kind: i % 2 === 0 ? "course" : "video",
          title: `Learn ${skill} - Complete Guide`,
          provider: i % 3 === 0 ? "Udemy" : i % 3 === 1 ? "YouTube" : "Coursera",
          description: `Master ${skill} with hands-on projects and real-world examples`,
          skills: [skill],
          url: `https://www.google.com/search?q=${encodeURIComponent(`learn ${skill} course`)}`,
          route: "/learn",
        })),
      };
    }
  });

// ── Career Coach ─────────────────────────────────────────────────────────────

export const careerCoach = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => {
    const i = input as { question: string; sessionId?: string };
    if (!i?.question?.trim()) throw new Error("Question is required");
    return { question: i.question.trim().slice(0, 1000), sessionId: i.sessionId };
  })
  .handler(async ({ data, context }) => {
    await requirePremium(context.userId);

    const [{ data: profile }, { data: resume }, { data: applications }] = await Promise.all([
      context.supabase
        .from("profiles")
        .select("full_name,headline,skills,experience_years,location")
        .eq("id", context.userId)
        .maybeSingle(),
      context.supabase
        .from("resumes")
        .select("overall_score,ats_score,grammar_score,suggestions,career_roadmap")
        .eq("user_id", context.userId)
        .eq("is_default", true)
        .maybeSingle(),
      context.supabase
        .from("applications")
        .select("status, job:jobs(title)")
        .eq("applicant_id", context.userId)
        .limit(10),
    ]);

    const appSummary = (applications ?? [])
      .map((a: any) => `${a.job?.title}(${a.status})`)
      .join(", ");

    const contextBlock = [
      `Profile: ${JSON.stringify(profile ?? {})}`,
      `Resume scores: overall=${resume?.overall_score ?? "?"}, ats=${resume?.ats_score ?? "?"}, grammar=${resume?.grammar_score ?? "?"}`,
      `Recent applications: ${appSummary || "none"}`,
      `User question: ${data.question}`,
    ].join("\n");

    const response = await aiGenerateJsonValidated(
      contextBlock,
      PROMPTS.CAREER_COACH.system,
      careerCoachResponseSchema,
      "career-coach",
    );

    const sessionId = data.sessionId;
    if (sessionId) {
      const { data: existing } = await context.supabase
        .from("career_coach_sessions")
        .select("messages")
        .eq("id", sessionId)
        .eq("user_id", context.userId)
        .maybeSingle();

      const msgs = (existing?.messages as any[]) ?? [];
      msgs.push({ role: "user", content: data.question, ts: new Date().toISOString() });
      msgs.push({ role: "assistant", content: response, ts: new Date().toISOString() });

      await context.supabase
        .from("career_coach_sessions")
        .update({ messages: msgs, updated_at: new Date().toISOString() })
        .eq("id", sessionId)
        .eq("user_id", context.userId);
    }

    return response;
  });

// ── AI Assistant ─────────────────────────────────────────────────────────────

async function buildUserContext(supabase: any, userId: string, role: string | null) {
  const isEmployer = role === "employer";
  const ctx: string[] = [];

  const [{ data: profile }, { data: resume }, { data: applications }, { data: savedJobs }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select(
          "full_name,headline,bio,location,experience_years,current_position,skills,education,experience",
        )
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("resumes")
        .select("overall_score,ats_score,grammar_score,suggestions,parsed_data,career_roadmap")
        .eq("user_id", userId)
        .eq("is_default", true)
        .maybeSingle(),
      supabase
        .from("applications")
        .select("id,status,created_at, job:jobs(id,title,company:companies(name))")
        .eq("applicant_id", userId)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase.from("saved_jobs").select("job:jobs(id,title)").eq("user_id", userId).limit(5),
    ]);

  if (profile) {
    ctx.push(
      `## User Profile\n${JSON.stringify({
        name: profile.full_name,
        headline: profile.headline,
        bio: profile.bio,
        location: profile.location,
        years_experience: profile.experience_years,
        current_position: profile.current_position,
        skills: profile.skills ?? [],
        education: profile.education ?? [],
        experience: profile.experience ?? [],
        expected_salary: profile.expected_salary,
        preferred_job_type: profile.preferred_job_type,
        preferred_location: profile.preferred_location,
      })}`,
    );
  }

  if (resume) {
    const parsed = resume.parsed_data as any;
    const roadmap = resume.career_roadmap as any;
    ctx.push(
      `## Resume Analysis\n${JSON.stringify({
        overall_score: resume.overall_score,
        ats_score: resume.ats_score,
        grammar_score: resume.grammar_score,
        suggestions: resume.suggestions ?? [],
        extracted_skills: parsed?.skills ?? [],
        summary: parsed?.summary ?? "",
        missing_skills: roadmap?.missing_skills ?? [],
        strengths: roadmap?.strengths ?? [],
        weaknesses: roadmap?.weaknesses ?? [],
      })}`,
    );
  }

  if (applications?.length) {
    ctx.push(
      `## Recent Applications\n${applications
        .map((a: any) => `- ${a.job?.title} at ${a.job?.company?.name ?? "Unknown"} — ${a.status}`)
        .join("\n")}`,
    );
  }

  if (savedJobs?.length) {
    ctx.push(`## Saved Jobs\n${savedJobs.map((s: any) => `- ${s.job?.title}`).join("\n")}`);
  }

  ctx.push(`## Active Jobs (sample)`);
  const { data: activeJobs } = await supabase
    .from("jobs")
    .select(
      "id,title,required_skills,salary_min,salary_max,salary_currency,location,job_type, company:companies(name,headquarters)",
    )
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(20);

  if (activeJobs?.length) {
    ctx.push(
      activeJobs
        .map(
          (j: any) =>
            `- ${j.title} at ${j.company?.name ?? "?"} | Skills: ${(j.required_skills ?? []).join(", ")} | Salary: Rs. ${j.salary_min ?? "?"} - ${j.salary_max ?? "?"} | ${j.location ?? "Remote"}`,
        )
        .join("\n"),
    );
  }

  if (isEmployer) {
    const { data: company } = await supabase
      .from("companies")
      .select("id,name,industry,headquarters,description")
      .eq("owner_id", userId)
      .maybeSingle();

    if (company) {
      ctx.push(`## Your Company\n${JSON.stringify(company)}`);
      const { data: postedJobs } = await supabase
        .from("jobs")
        .select("id,title,status,applications_count")
        .eq("company_id", company.id)
        .limit(10);

      if (postedJobs?.length) {
        ctx.push(
          `## Posted Jobs\n${postedJobs.map((j: any) => `- ${j.title} (${j.status}, ${j.applications_count} applicants)`).join("\n")}`,
        );
      }
    }
  }

  return ctx.join("\n\n");
}

export const aiAssistantChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => {
    const i = input as { message: string; conversationId?: string; role?: string };
    if (!i?.message?.trim()) throw new Error("Message is required");
    return {
      message: i.message.trim().slice(0, 4000),
      conversationId: i.conversationId,
      role: i.role ?? "job_seeker",
    };
  })
  .handler(async ({ data, context }) => {
    await requirePremium(context.userId);

    // Resolve or create conversation
    let conversationId = data.conversationId;
    let isNewConversation = false;

    if (!conversationId) {
      const { data: newConv, error } = await context.supabase
        .from("ai_conversations")
        .insert({
          user_id: context.userId,
          title: extractConversationTitle(data.message),
        })
        .select("id")
        .single();

      if (error) throw new Error(error.message);
      conversationId = newConv.id;
      isNewConversation = true;
    } else {
      const { data: conv } = await context.supabase
        .from("ai_conversations")
        .select("id, user_id")
        .eq("id", conversationId)
        .eq("user_id", context.userId)
        .maybeSingle();

      if (!conv) throw new Error("Conversation not found");
    }

    // Save user message
    const { error: msgErr } = await context.supabase.from("ai_messages").insert({
      conversation_id: conversationId,
      role: "user",
      content: data.message,
    });
    if (msgErr) throw new Error(msgErr.message);

    // Retrieve conversation history
    const { data: history } = await context.supabase
      .from("ai_messages")
      .select("role, content, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(20);

    const historyText = (history ?? [])
      .slice(-12)
      .map((m: any) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n\n");

    // Build RAG context
    const userContext = await buildUserContext(context.supabase, context.userId, data.role);

    // Generate response
    const fullPrompt = `## Conversation History\n${historyText}\n\n## User Context (use this to personalise your answer)\n${userContext}\n\n## Current Question\n${data.message}`;

    const response = await aiGenerateText(
      fullPrompt,
      PROMPTS.AI_ASSISTANT.system,
      undefined,
      "career-assistant",
    );

    // Save assistant response
    const { error: aiMsgErr } = await context.supabase.from("ai_messages").insert({
      conversation_id: conversationId,
      role: "assistant",
      content: response,
    });
    if (aiMsgErr) throw new Error(aiMsgErr.message);

    return {
      conversationId,
      response,
      isNewConversation,
    };
  });
