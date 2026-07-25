/* eslint-disable @typescript-eslint/no-explicit-any */

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth.middleware";
import { aiGenerateJsonValidated } from "@/integrations/ai/ai-service";
import {
  resumeAnalysisSchema,
  fullResumeScanSchema,
  careerRecommendationsSchema,
  linkedinImportSchema,
  learningRecommendationsSchema,
  careerCoachResponseSchema,
} from "@/integrations/ai/schemas";

// ── Prompts ──────────────────────────────────────────────────────────────────
// Kept tight to reduce token usage. No filler prose — models are instructed
// to return only the JSON keys listed.

const RESUME_SYSTEM =
  "ATS resume reviewer. Score 0-100. Return JSON only: {overall_score,ats_score,grammar_score,formatting_score,keyword_score,professionalism_score,suggestions[8],summary,extracted_skills[20]}";

// Combined single-call system prompt for full resume upload scan.
// Merges scoring + strengths/weaknesses + keywords + career roadmap so
// only ONE model call is made per resume upload.
const FULL_SCAN_SYSTEM =
  "Expert resume analyst and career coach. Analyse the resume and return ONE JSON object with ALL of these keys (no extra text): " +
  "overall_score(0-100), ats_score(0-100), grammar_score(0-100), formatting_score(0-100), keyword_score(0-100), professionalism_score(0-100), " +
  "suggestions(string[8]), summary(string), extracted_skills(string[20]), " +
  "strengths(string[5]), weaknesses(string[5]), missing_skills(string[10]), keywords(string[15]), " +
  "career_paths([{title,why,next_steps[]}][4]), skill_gaps(string[8]), " +
  "recommended_certifications([{name,provider}][5]), suggested_projects([{title,description}][4]), " +
  "recommended_jobs([{title,why}][5]), companies_hiring([{name,sector}][5]), " +
  "salary_prediction({low,mid,high,currency}|null), resume_improvements(string[8]), " +
  "interview_prep_plan({thirty_days[],sixty_days[],ninety_days[],one_eighty_days[]}|null). " +
  "Keep each list to the max count shown. Numbers only, no units.";

const CAREER_SYSTEM =
  "Senior career coach. JSON only: {career_paths([{title,why,next_steps[]}]),skill_gaps([]),missing_skills([]),recommended_certifications([{name,provider}]),suggested_projects([{title,description}]),recommended_jobs([{title,why}]),companies_hiring([{name,sector}]),salary_prediction({low,mid,high,currency}),resume_improvements([]),interview_prep_plan({thirty_days[],sixty_days[],ninety_days[],one_eighty_days[]}),suggested_search_keywords([])}. 3-5 items per list.";

const LINKEDIN_SYSTEM =
  "Extract LinkedIn profile. JSON only: {full_name,headline,about,location,current_position,experience_years(int),skills[20]}";

const LEARNING_SYSTEM =
  'Career coach. JSON only: {"items":[{"kind":"course|video|challenge|interview","title":"","provider":"","url":"","skills":[],"description":""}]}';

// ─────────────────────────────────────────────────────────────────────────────

function clamp(n: unknown): number {
  return Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
}

// scoreResume: used when the caller passes raw text directly (no file upload).
// Uses the lightweight resumeAnalysisSchema — no career roadmap needed here.
export const scoreResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = input as { resumeId: string; text: string };
    if (!i?.resumeId || !i?.text) throw new Error("Missing resumeId or text");
    return { resumeId: i.resumeId, text: i.text.slice(0, 12000) };
  })
  .handler(async ({ data, context }) => {
    const parsed = await aiGenerateJsonValidated(
      `Resume:\n${data.text}`,
      RESUME_SYSTEM,
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
      CAREER_SYSTEM,
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

// scanResumeFromStorage: full upload scan.
// A SINGLE AI call returns scores + career roadmap + strengths/weaknesses + improvements.
// Result stored and reused — no second AI call.
export const scanResumeFromStorage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = input as { resumeId: string };
    if (!i?.resumeId) throw new Error("Missing resumeId");
    return { resumeId: i.resumeId };
  })
  .handler(async ({ data, context }) => {
    const { data: resume, error: rErr } = await context.supabase
      .from("resumes")
      .select("id, file_path, mime_type, file_name, user_id")
      .eq("id", data.resumeId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (rErr || !resume) throw new Error("Resume not found");
    if (!resume.file_path) throw new Error("Resume has no uploaded file");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const dl = await supabaseAdmin.storage.from("resumes").download(resume.file_path);
    if (dl.error || !dl.data) throw new Error(dl.error?.message ?? "Failed to download resume");
    const buf = new Uint8Array(await dl.data.arrayBuffer());

    let text = "";
    const name = (resume.file_name ?? "").toLowerCase();
    const isDocx = name.endsWith(".docx") || resume.mime_type?.includes("wordprocessingml");
    const isPdf = name.endsWith(".pdf") || resume.mime_type?.includes("pdf");

    try {
      if (isDocx) {
        const mammoth = await import("mammoth");
        const res = await mammoth.extractRawText({ buffer: Buffer.from(buf) });
        text = res.value ?? "";
      } else if (isPdf) {
        const { extractText, getDocumentProxy } = await import("unpdf");
        const pdf = await getDocumentProxy(buf);
        const out = await extractText(pdf, { mergePages: true });
        text = Array.isArray(out.text) ? out.text.join("\n") : (out.text as string);
      } else {
        text = new TextDecoder().decode(buf);
      }
    } catch (e) {
      throw new Error(`Failed to parse resume: ${(e as Error).message}`);
    }

    text = text.replace(/\s+/g, " ").trim();
    if (text.length < 50) throw new Error("Could not extract enough text from the resume file");
    // Truncate to 8 000 chars — enough signal for analysis; saves ~30% tokens vs 20 000
    if (text.length > 8000) text = text.slice(0, 8000);

    // ONE AI call — returns both scoring and career roadmap
    const scan = await aiGenerateJsonValidated(
      `Resume:\n${text}`,
      FULL_SCAN_SYSTEM,
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

    // Job matching is pure client-side math — no extra AI call needed
    const skills = (scan.extracted_skills ?? []).map((s) => s.toLowerCase()).filter(Boolean);
    let matches: Array<{ id: string; title: string; company: string | null; score: number }> = [];
    if (skills.length) {
      const { data: jobs } = await context.supabase
        .from("jobs")
        .select("id, title, required_skills, company:companies(name)")
        .eq("status", "active")
        .limit(200);
      matches = (jobs ?? [])
        .map((j: any) => {
          const js = ((j.required_skills ?? []) as string[]).map((s) => s.toLowerCase());
          if (!js.length) return { id: j.id, title: j.title, company: j.company?.name ?? null, score: 0 };
          const hits = js.filter((s) => skills.some((k) => s.includes(k) || k.includes(s))).length;
          const score = Math.round((hits / Math.max(js.length, 1)) * 100);
          return { id: j.id, title: j.title, company: j.company?.name ?? null, score };
        })
        .filter((m) => m.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8);
    }

    // Profile auto-update from resume scan
    const profilePatch: Record<string, any> = {
      ai_profile_data: {
        summary: scan.summary,
        skills: scan.extracted_skills ?? [],
        strengths: scan.strengths ?? [],
        keywords: scan.keywords ?? [],
        missing_skills: scan.missing_skills ?? [],
      },
    };
    // Only overwrite skills if user has none set yet
    const { data: existingProfile } = await context.supabase
      .from("profiles")
      .select("skills")
      .eq("id", context.userId)
      .maybeSingle();
    if (!existingProfile?.skills?.length && scan.extracted_skills?.length) {
      profilePatch.skills = scan.extracted_skills.slice(0, 20);
    }
    await context.supabase.from("profiles").update(profilePatch).eq("id", context.userId);

    return { ...scoringUpdate, matches };
  });

export const importFromGitHub = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = input as { username: string };
    const u = (i?.username ?? "").trim().replace(/^@/, "");
    if (!/^[a-zA-Z0-9-]{1,39}$/.test(u)) throw new Error("Invalid GitHub username");
    return { username: u };
  })
  .handler(async ({ data, context }) => {
    const headers = {
      Accept: "application/vnd.github+json",
      "User-Agent": "Jagire-App",
    };
    const [uRes, rRes] = await Promise.all([
      fetch(`https://api.github.com/users/${data.username}`, { headers }),
      fetch(`https://api.github.com/users/${data.username}/repos?sort=stars&per_page=100`, { headers }),
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

export const learningRecommendations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("skills, headline, experience_years")
      .eq("id", context.userId)
      .maybeSingle();
    const skills = ((profile as any)?.skills ?? []).join(", ") || "software engineering";
    const prompt = `Suggest 8 learning resources for: skills=${skills}, headline=${(profile as any)?.headline ?? "N/A"}. Mix courses, videos, challenges, interview prep.`;

    const parsed = await aiGenerateJsonValidated(
      prompt,
      LEARNING_SYSTEM,
      learningRecommendationsSchema,
      "learning-recommendations",
    );
    return { items: parsed?.items ?? [] };
  });

export const importFromLinkedInText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = input as { text: string; url?: string };
    if (!i?.text || i.text.trim().length < 50)
      throw new Error("Paste at least your LinkedIn About / Experience text");
    return { text: i.text.slice(0, 10000), url: (i.url ?? "").trim() };
  })
  .handler(async ({ data, context }) => {
    const parsed = await aiGenerateJsonValidated(
      data.text,
      LINKEDIN_SYSTEM,
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
      patch.experience_years = Math.max(0, Math.min(60, Math.round(Number(parsed.experience_years))));
    if (parsed.skills?.length) patch.skills = parsed.skills.slice(0, 20);
    if (data.url) patch.linkedin_url = data.url;

    const { error } = await (context.supabase.from("profiles") as any)
      .update(patch)
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { imported: { fields: Object.keys(patch).length, skills: patch.skills?.length ?? 0 } };
  });

const CAREER_COACH_SYSTEM =
  "You are Jagire AI Career Coach. You have the user's profile, resume scores, skills, and application history. " +
  "Give personalised, actionable career advice. " +
  "JSON only: {advice(string),recommended_skills(string[8]),action_plan(string[6]),improvement_suggestions(string[6]),follow_up_questions(string[3])}";

export const careerCoach = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = input as { question: string; sessionId?: string };
    if (!i?.question?.trim()) throw new Error("Question is required");
    return { question: i.question.trim().slice(0, 1000), sessionId: i.sessionId };
  })
  .handler(async ({ data, context }) => {
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
      `Profile: ${JSON.stringify({ ...profile })}`,
      `Resume scores: overall=${resume?.overall_score ?? "?"}, ats=${resume?.ats_score ?? "?"}, grammar=${resume?.grammar_score ?? "?"}`,
      `Recent applications: ${appSummary || "none"}`,
      `User question: ${data.question}`,
    ].join("\n");

    const response = await aiGenerateJsonValidated(
      contextBlock,
      CAREER_COACH_SYSTEM,
      careerCoachResponseSchema,
      "career-coach",
    );

    // Persist session history
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

// ── AI Assistant (RAG-powered career companion) ──────────────────────────────

const ASSISTANT_SYSTEM =
  "You are Jagire AI Assistant, an expert career mentor for a Nepal-focused job platform. " +
  "Help users: find better jobs, improve resumes, develop skills, prepare interviews, make career decisions. " +
  "Use the provided user context to give personalised, practical answers — not generic advice. " +
  "Give concrete steps and recommendations. Be professional, supportive, career-focused. " +
  "Always display salary in NPR / Rs. (e.g. Rs. 50,000/month). Never use dollars. " +
  "Format responses in clean markdown with headings, bullet points, and bold where helpful. " +
  "Keep responses concise but thorough — typically 150-400 words.";

async function buildUserContext(supabase: any, userId: string, role: string | null) {
  const isEmployer = role === "employer";
  const ctx: string[] = [];

  const [{ data: profile }, { data: resume }, { data: applications }, { data: savedJobs }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select(
          "full_name,headline,bio,location,years_experience,current_position,skills,expected_salary_usd,job_type_preference,preferred_location,education,experience,technologies",
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
        .eq("seeker_id", userId)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("saved_jobs")
        .select("job:jobs(id,title)")
        .eq("user_id", userId)
        .limit(5),
    ]);

  if (profile) {
    ctx.push(`## User Profile\n${JSON.stringify({
      name: profile.full_name,
      headline: profile.headline,
      bio: profile.bio,
      location: profile.location,
      years_experience: profile.years_experience,
      current_position: profile.current_position,
      skills: profile.skills ?? [],
      technologies: profile.technologies ?? [],
      education: profile.education ?? [],
      experience: profile.experience ?? [],
      expected_salary_usd: profile.expected_salary_usd,
      preferred_job_type: profile.job_type_preference,
      preferred_location: profile.preferred_location,
    })}`);
  }

  if (resume) {
    const parsed = resume.parsed_data as any;
    const roadmap = resume.career_roadmap as any;
    ctx.push(`## Resume Analysis\n${JSON.stringify({
      overall_score: resume.overall_score,
      ats_score: resume.ats_score,
      grammar_score: resume.grammar_score,
      suggestions: resume.suggestions ?? [],
      extracted_skills: parsed?.skills ?? [],
      summary: parsed?.summary ?? "",
      missing_skills: roadmap?.missing_skills ?? [],
      strengths: roadmap?.strengths ?? [],
      weaknesses: roadmap?.weaknesses ?? [],
    })}`);
  }

  if (applications?.length) {
    ctx.push(
      `## Recent Applications\n${applications
        .map((a: any) => `- ${a.job?.title} at ${a.job?.company?.name ?? "Unknown"} — ${a.status}`)
        .join("\n")}`,
    );
  }

  if (savedJobs?.length) {
    ctx.push(
      `## Saved Jobs\n${savedJobs.map((s: any) => `- ${s.job?.title}`).join("\n")}`,
    );
  }

  // For job-related questions, fetch active jobs
  ctx.push(`## Active Jobs (sample)`);
  const { data: activeJobs } = await supabase
    .from("jobs")
    .select("id,title,required_skills,salary_min,salary_max,salary_currency,location,job_type, company:companies(name)")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(20);
  if (activeJobs?.length) {
    ctx.push(
      activeJobs
        .map((j: any) =>
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

function extractConversationTitle(question: string): string {
  const cleaned = question.trim().replace(/\s+/g, " ");
  return cleaned.length > 50 ? cleaned.slice(0, 50) + "…" : cleaned || "New conversation";
}

export const aiAssistantChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = input as { message: string; conversationId?: string; role?: string };
    if (!i?.message?.trim()) throw new Error("Message is required");
    return {
      message: i.message.trim().slice(0, 4000),
      conversationId: i.conversationId,
      role: i.role ?? "job_seeker",
    };
  })
  .handler(async ({ data, context }) => {
    // 1. Resolve or create conversation
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
      // Verify ownership
      const { data: conv } = await context.supabase
        .from("ai_conversations")
        .select("id, user_id")
        .eq("id", conversationId)
        .eq("user_id", context.userId)
        .maybeSingle();
      if (!conv) throw new Error("Conversation not found");
    }

    // 2. Save user message
    const { error: msgErr } = await context.supabase
      .from("ai_messages")
      .insert({
        conversation_id: conversationId,
        role: "user",
        content: data.message,
      });
    if (msgErr) throw new Error(msgErr.message);

    // 3. Retrieve conversation history (last 10 messages for context)
    const { data: history } = await context.supabase
      .from("ai_messages")
      .select("role, content, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(20);

    const historyText = (history ?? [])
      .slice(-12) // last 12 messages = 6 turns
      .map((m: any) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n\n");

    // 4. Build RAG context from user data
    const userContext = await buildUserContext(context.supabase, context.userId, data.role);

    // 5. Generate response
    const fullPrompt = `## Conversation History\n${historyText}\n\n## User Context (use this to personalise your answer)\n${userContext}\n\n## Current Question\n${data.message}`;

    const response = await aiGenerateText(
      fullPrompt,
      ASSISTANT_SYSTEM,
      undefined,
      "career-assistant",
    );

    // 6. Save assistant response
    const { error: aiMsgErr } = await context.supabase
      .from("ai_messages")
      .insert({
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
