import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateJson } from "@/integrations/gemini/server";

const RESUME_SYSTEM =
  "You are an expert ATS and resume reviewer. Score the resume from 0-100 on each dimension and return ONLY strict JSON with keys: overall_score, ats_score, grammar_score, formatting_score, keyword_score, professionalism_score, suggestions (array of short actionable strings, max 8), summary (2-3 sentences), extracted_skills (array of strings, max 20).";

const CAREER_SYSTEM =
  "You are a senior career coach. Return ONLY strict JSON with keys: career_paths (array of {title, why, next_steps[]}), skill_gaps (array of strings), recommended_certifications (array of {name, provider}), suggested_search_keywords (array of strings). Keep each list to 3-5 items.";

const LINKEDIN_SYSTEM =
  "Extract a professional profile from the pasted LinkedIn text. Return ONLY strict JSON with keys: full_name (string or null), headline (string or null), about (string), location (string or null), current_position (string or null), experience_years (integer estimate, 0 if unknown), skills (array of strings, max 20).";

const LEARNING_SYSTEM = "Return only valid JSON.";

function clamp(n: unknown): number {
  return Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
}

export const scoreResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = input as { resumeId: string; text: string };
    if (!i?.resumeId || !i?.text) throw new Error("Missing resumeId or text");
    return { resumeId: i.resumeId, text: i.text.slice(0, 20000) };
  })
  .handler(async ({ data, context }) => {
    const parsed = await generateJson<{
      overall_score: number;
      ats_score: number;
      grammar_score: number;
      formatting_score: number;
      keyword_score: number;
      professionalism_score: number;
      suggestions: string[];
      summary: string;
      extracted_skills: string[];
    }>(`Resume text:\n\n${data.text}`, RESUME_SYSTEM);

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
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("full_name, headline, bio, location, experience_years")
      .eq("id", context.userId)
      .maybeSingle();
    const { data: resume } = await context.supabase
      .from("resumes")
      .select("parsed_data")
      .eq("user_id", context.userId)
      .eq("is_default", true)
      .maybeSingle();
    const skills = (resume?.parsed_data as { skills?: string[] } | null)?.skills ?? [];

    const parsed = await generateJson<{
      career_paths?: Array<{ title: string; why: string; next_steps: string[] }>;
      skill_gaps?: string[];
      recommended_certifications?: Array<{ name: string; provider: string }>;
      suggested_search_keywords?: string[];
    }>(
      `Profile: ${JSON.stringify(profile ?? {})}\nSkills: ${skills.join(", ") || "unknown"}`,
      CAREER_SYSTEM,
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
    if (text.length > 20000) text = text.slice(0, 20000);

    const parsed = await generateJson<{
      overall_score: number;
      ats_score: number;
      grammar_score: number;
      formatting_score: number;
      keyword_score: number;
      professionalism_score: number;
      suggestions: string[];
      summary: string;
      extracted_skills: string[];
    }>(`Resume text:\n\n${text}`, RESUME_SYSTEM);

    const update = {
      overall_score: clamp(parsed.overall_score),
      ats_score: clamp(parsed.ats_score),
      grammar_score: clamp(parsed.grammar_score),
      formatting_score: clamp(parsed.formatting_score),
      keyword_score: clamp(parsed.keyword_score),
      professionalism_score: clamp(parsed.professionalism_score),
      suggestions: parsed.suggestions ?? [],
      parsed_data: {
        summary: parsed.summary,
        skills: parsed.extracted_skills ?? [],
        raw_text: text.slice(0, 5000),
      },
    };
    const { error } = await context.supabase
      .from("resumes")
      .update(update)
      .eq("id", resume.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);

    const skills = (parsed.extracted_skills ?? []).map((s) => s.toLowerCase()).filter(Boolean);
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
          if (!js.length)
            return { id: j.id, title: j.title, company: j.company?.name ?? null, score: 0 };
          const hits = js.filter((s) => skills.some((k) => s.includes(k) || k.includes(s))).length;
          const score = Math.round((hits / Math.max(js.length, 1)) * 100);
          return { id: j.id, title: j.title, company: j.company?.name ?? null, score };
        })
        .filter((m) => m.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8);
    }

    return { ...update, matches };
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

export const learningRecommendations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("skills, headline, experience_years")
      .eq("id", context.userId)
      .maybeSingle();
    const skills = ((profile as any)?.skills ?? []).join(", ") || "general software engineering";
    const prompt = `You are a career coach. Suggest 8 learning resources for a professional with these skills: ${skills}. Headline: ${(profile as any)?.headline ?? "N/A"}. Mix courses, videos, coding challenges, and interview prep. Return JSON: {"items":[{"kind":"course|video|challenge|interview","title":"","provider":"","url":"","skills":[],"description":""}]}`;

    const parsed = await generateJson<{ items: any[] }>(prompt, LEARNING_SYSTEM);
    return { items: parsed?.items ?? [] };
  });

export const importFromLinkedInText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = input as { text: string; url?: string };
    if (!i?.text || i.text.trim().length < 50)
      throw new Error("Paste at least your LinkedIn About / Experience text");
    return { text: i.text.slice(0, 20000), url: (i.url ?? "").trim() };
  })
  .handler(async ({ data, context }) => {
    const parsed = await generateJson<{
      full_name?: string | null;
      headline?: string | null;
      about?: string;
      location?: string | null;
      current_position?: string | null;
      experience_years?: number;
      skills?: string[];
    }>(data.text, LINKEDIN_SYSTEM);

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
    return {
      imported: { fields: Object.keys(patch).length, skills: patch.skills?.length ?? 0 },
    };
  });
