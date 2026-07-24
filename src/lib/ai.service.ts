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
