/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from "zod";
import { AIProvider, AIRequest, AIEmbeddingRequest, AIEmbeddingResponse, AITask } from "./types";
import { GeminiProvider } from "./gemini-provider";
import { OllamaProvider } from "./ollama-provider";
import { isTransient, isFatal } from "./errors";
import { AITransientError } from "./types";
import { zodToGeminiSchema, zodToSchemaShapeDescription } from "./schema-converter";
import { AI_CONFIG } from "./config";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function log(
  level: "info" | "warn" | "error",
  message: string,
  meta?: Record<string, unknown>,
): void {
  const ts = new Date().toISOString();
  const line = `[${ts}] [AIService] [${level.toUpperCase()}] ${message}`;
  if (meta) {
    console[level === "error" ? "error" : level === "warn" ? "warn" : "log"](line, meta);
  } else {
    console[level === "error" ? "error" : level === "warn" ? "warn" : "log"](line);
  }
}

function getConfiguredProviderOrder(): AIProvider[] {
  const isProduction =
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL === "1" ||
    Boolean(process.env.NETLIFY);

  // In production, Google Gemini is strictly the sole permitted provider
  if (isProduction) {
    return [new GeminiProvider()];
  }

  const configuredProvider = (process.env.AI_PROVIDER || "gemini").toLowerCase().trim();

  // Local development with Ollama-first: if developer sets AI_PROVIDER=ollama
  if (configuredProvider === "ollama") {
    return [new OllamaProvider(), new GeminiProvider()];
  }

  return [new GeminiProvider()];
}

async function retryWithBackoff<T>(
  provider: AIProvider,
  fn: (p: AIProvider) => Promise<T>,
  label: string,
  timeoutMs: number,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= AI_CONFIG.PROVIDER_NETWORK_RETRIES; attempt++) {
    const start = Date.now();
    try {
      const result = await fn(provider);
      const latencyMs = Date.now() - start;
      log("info", `${provider.name} succeeded for ${label}`, {
        provider: provider.name,
        label,
        attempt: attempt + 1,
        latencyMs,
        configuredTimeoutMs: timeoutMs,
      });
      return result;
    } catch (err) {
      lastError = err;
      const latencyMs = Date.now() - start;
      if (attempt < AI_CONFIG.PROVIDER_NETWORK_RETRIES && isTransient(err)) {
        const delay = AI_CONFIG.VALIDATION_BACKOFF_MS * Math.pow(2, attempt);
        log("warn", `${provider.name} transient error — retrying in ${delay}ms`, {
          provider: provider.name,
          attempt: attempt + 1,
          error: (err as Error).message,
          latencyMs,
          configuredTimeoutMs: timeoutMs,
        });
        await sleep(delay);
      } else {
        break;
      }
    }
  }
  throw lastError;
}

interface CacheEntry {
  value: unknown;
  expires: number;
}
const responseCache = new Map<string, CacheEntry>();

function cacheKey(req: AIRequest): string {
  const provider = (process.env.AI_PROVIDER || "gemini").toLowerCase();
  return `${provider}:${req.task ?? "general"}:${req.model ?? "default"}:${req.prompt}`;
}

function getCached(key: string): unknown | undefined {
  const entry = responseCache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expires) {
    responseCache.delete(key);
    return undefined;
  }
  return entry.value;
}

function setCached(key: string, value: unknown): void {
  if (responseCache.size >= AI_CONFIG.MAX_CACHE_ENTRIES) {
    const oldestKey = responseCache.keys().next().value;
    if (oldestKey) responseCache.delete(oldestKey);
  }
  responseCache.set(key, { value, expires: Date.now() + AI_CONFIG.CACHE_TTL_MS });
}

function normalizeAndSanitizeTaskOutput(task: AITask | undefined, raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const result = { ...(raw as Record<string, any>) };

  if (task === "resume-analysis") {
    const scoreFields = [
      "overall_score",
      "ats_score",
      "grammar_score",
      "formatting_score",
      "keyword_score",
      "professionalism_score",
    ];
    for (const sf of scoreFields) {
      if (typeof result[sf] === "string") {
        const parsed = parseInt(result[sf].replace(/[^0-9]/g, ""), 10);
        result[sf] = isNaN(parsed) ? 75 : Math.max(0, Math.min(100, parsed));
      } else if (typeof result[sf] !== "number") {
        result[sf] = 75;
      } else {
        result[sf] = Math.max(0, Math.min(100, Math.round(result[sf])));
      }
    }

    if (typeof result.summary !== "string" || !result.summary.trim()) {
      result.summary = "Professional candidate resume profile with relevant industry experience.";
    }

    const maxLengths: Record<string, number> = {
      suggestions: 8,
      extracted_skills: 20,
      strengths: 5,
      weaknesses: 5,
      missing_skills: 10,
      keywords: 15,
      skill_gaps: 8,
      resume_improvements: 8,
      career_paths: 4,
      recommended_certifications: 5,
      suggested_projects: 4,
      recommended_jobs: 5,
      companies_hiring: 5,
    };

    const arrayFields = [
      "suggestions",
      "extracted_skills",
      "strengths",
      "weaknesses",
      "missing_skills",
      "keywords",
      "skill_gaps",
      "resume_improvements",
    ];

    for (const field of arrayFields) {
      if (typeof result[field] === "string") {
        result[field] = result[field]
          .split(/[,•\-\n]/)
          .map((s: string) => s.trim())
          .filter(Boolean)
          .slice(0, maxLengths[field] || 20);
      } else if (!Array.isArray(result[field])) {
        result[field] = [];
      } else {
        result[field] = result[field]
          .filter((s: any) => typeof s === "string" && s.trim())
          .slice(0, maxLengths[field] || 20);
      }
    }

    if (!Array.isArray(result.career_paths)) {
      result.career_paths = [];
    } else {
      result.career_paths = result.career_paths
        .filter((cp: any) => cp && typeof cp === "object")
        .map((cp: any, idx: number) => ({
          title: typeof cp.title === "string" ? cp.title : `Career Path ${idx + 1}`,
          why: typeof cp.why === "string" ? cp.why : "Strategic fit based on your background.",
          next_steps: Array.isArray(cp.next_steps)
            ? cp.next_steps.filter((s: any) => typeof s === "string")
            : typeof cp.next_steps === "string"
              ? [cp.next_steps]
              : ["Upskill in relevant technologies", "Build portfolio projects"],
        }))
        .slice(0, 4);
    }

    if (!Array.isArray(result.recommended_certifications)) {
      result.recommended_certifications = [];
    } else {
      result.recommended_certifications = result.recommended_certifications
        .filter((c: any) => c && (typeof c === "object" || typeof c === "string"))
        .map((c: any, idx: number) => ({
          name: typeof c.name === "string" ? c.name : typeof c === "string" ? c : `Certification ${idx + 1}`,
          provider: typeof c.provider === "string" ? c.provider : "Industry Standard",
        }))
        .slice(0, 5);
    }

    if (!Array.isArray(result.suggested_projects)) {
      result.suggested_projects = [];
    } else {
      result.suggested_projects = result.suggested_projects
        .filter((p: any) => p && (typeof p === "object" || typeof p === "string"))
        .map((p: any, idx: number) => ({
          title: typeof p.title === "string" ? p.title : typeof p === "string" ? p : `Project ${idx + 1}`,
          description: typeof p.description === "string" ? p.description : "Hands-on project to demonstrate skills.",
        }))
        .slice(0, 4);
    }

    if (!Array.isArray(result.recommended_jobs)) {
      result.recommended_jobs = [];
    } else {
      result.recommended_jobs = result.recommended_jobs
        .filter((j: any) => j && (typeof j === "object" || typeof j === "string"))
        .map((j: any, idx: number) => ({
          title: typeof j.title === "string" ? j.title : typeof j === "string" ? j : `Role ${idx + 1}`,
          why: typeof j.why === "string" ? j.why : "Direct match for your core skill set.",
        }))
        .slice(0, 5);
    }

    if (!Array.isArray(result.companies_hiring)) {
      result.companies_hiring = [];
    } else {
      result.companies_hiring = result.companies_hiring
        .filter((c: any) => c && (typeof c === "object" || typeof c === "string"))
        .map((c: any, idx: number) => ({
          name: typeof c.name === "string" ? c.name : typeof c === "string" ? c : `Company ${idx + 1}`,
          sector: typeof c.sector === "string" ? c.sector : "Technology / IT",
        }))
        .slice(0, 5);
    }

    if (typeof result.salary_prediction === "string") {
      try {
        result.salary_prediction = JSON.parse(result.salary_prediction);
      } catch {
        result.salary_prediction = null;
      }
    }
    if (result.salary_prediction && typeof result.salary_prediction === "object") {
      const sp = result.salary_prediction;
      const low = typeof sp.low === "number" ? sp.low : parseInt(String(sp.low || "").replace(/[^0-9]/g, ""), 10) || 40000;
      const mid = typeof sp.mid === "number" ? sp.mid : parseInt(String(sp.mid || "").replace(/[^0-9]/g, ""), 10) || 80000;
      const high = typeof sp.high === "number" ? sp.high : parseInt(String(sp.high || "").replace(/[^0-9]/g, ""), 10) || 150000;
      result.salary_prediction = {
        low,
        mid,
        high,
        currency: typeof sp.currency === "string" && sp.currency ? sp.currency : "NPR",
      };
    } else {
      result.salary_prediction = {
        low: 40000,
        mid: 80000,
        high: 150000,
        currency: "NPR",
      };
    }

    if (typeof result.interview_prep_plan === "string") {
      try {
        result.interview_prep_plan = JSON.parse(result.interview_prep_plan);
      } catch {
        result.interview_prep_plan = null;
      }
    }
    if (result.interview_prep_plan && typeof result.interview_prep_plan === "object") {
      const ip = result.interview_prep_plan;
      result.interview_prep_plan = {
        thirty_days: Array.isArray(ip.thirty_days) ? ip.thirty_days.map(String) : [],
        sixty_days: Array.isArray(ip.sixty_days) ? ip.sixty_days.map(String) : [],
        ninety_days: Array.isArray(ip.ninety_days) ? ip.ninety_days.map(String) : [],
        one_eighty_days: Array.isArray(ip.one_eighty_days) ? ip.one_eighty_days.map(String) : [],
      };
    } else {
      result.interview_prep_plan = {
        thirty_days: ["Review core fundamentals", "Update resume with latest achievements"],
        sixty_days: ["Practice system design and behavioral questions"],
        ninety_days: ["Complete mock interviews", "Begin targeted applications"],
        one_eighty_days: ["Evaluate offers and negotiate compensation"],
      };
    }
  } else if (task === "career-coach") {
    const maxLengths: Record<string, number> = {
      recommended_skills: 8,
      action_plan: 6,
      improvement_suggestions: 6,
      follow_up_questions: 3,
    };

    const arrayFields = [
      "recommended_skills",
      "action_plan",
      "improvement_suggestions",
      "follow_up_questions",
    ];

    for (const field of arrayFields) {
      if (typeof result[field] === "string") {
        result[field] = result[field]
          .split(/\r?\n|,|•|;|\d+\.\s*/)
          .map((s: string) => s.trim())
          .filter(Boolean)
          .slice(0, maxLengths[field]);
      } else if (!Array.isArray(result[field])) {
        result[field] = [];
      }
    }
  } else if (task === "learning-recommendations") {
    if (!Array.isArray(result.items)) {
      if (typeof result.items === "string") {
        try {
          result.items = JSON.parse(result.items);
        } catch {
          result.items = [];
        }
      } else {
        result.items = [];
      }
    }

    result.items = (result.items || [])
      .filter((item: any) => item && typeof item === "object")
      .map((item: any, index: number) => {
        const searchTerms = `${item.title || ""} ${item.provider || "course"}`.trim();
        const searchUrl = searchTerms
          ? `https://www.google.com/search?q=${encodeURIComponent(searchTerms + " course")}`
          : `https://www.google.com/search?q=${encodeURIComponent("learn " + (item.skills?.[0] || "programming"))}`;

        let url = item.url || "";
        if (!url || !url.includes("google.com/search?q=")) {
          if (item.provider?.toLowerCase().includes("udemy")) {
            url = `https://www.udemy.com/courses/search/?q=${encodeURIComponent(item.title || item.skills?.[0] || "")}`;
          } else if (item.provider?.toLowerCase().includes("youtube")) {
            url = `https://www.youtube.com/results?search_query=${encodeURIComponent(item.title || "")}`;
          } else if (item.provider?.toLowerCase().includes("coursera")) {
            url = `https://www.coursera.org/search?query=${encodeURIComponent(item.title || "")}`;
          } else {
            url = searchUrl;
          }
        }

        return {
          kind: ["course", "video", "challenge", "interview"].includes(item.kind)
            ? item.kind
            : "course",
          title: item.title || `Learning Resource ${index + 1}`,
          provider: item.provider || "Online Platform",
          description: item.description || "",
          skills: Array.isArray(item.skills)
            ? item.skills.filter((s: any) => typeof s === "string")
            : [],
          url: url,
        };
      })
      .slice(0, 8);

    if (result.items.length === 0) {
      result.items = [
        {
          kind: "course",
          title: "Professional Skills Development",
          provider: "Coursera",
          description: "Develop your professional skills",
          skills: ["professional development"],
          url: "https://www.coursera.org/search?query=professional+development",
        },
      ];
    }
  } else if (
    task === "company-intelligence" ||
    result.target_talent_profiles !== undefined ||
    result.compensation_benchmarks_npr !== undefined
  ) {
    // 1. target_talent_profiles
    if (result.target_talent_profiles !== undefined) {
      const rawProfiles = Array.isArray(result.target_talent_profiles)
        ? result.target_talent_profiles
        : typeof result.target_talent_profiles === "object" &&
            result.target_talent_profiles !== null
          ? [result.target_talent_profiles]
          : [];

      result.target_talent_profiles = rawProfiles
        .filter((p: any) => p && typeof p === "object")
        .map((p: any) => {
          let skills: string[] = [];
          if (Array.isArray(p.required_skills)) {
            skills = p.required_skills.map(String).filter(Boolean);
          } else if (Array.isArray(p.skills)) {
            skills = p.skills.map(String).filter(Boolean);
          } else if (typeof p.required_skills === "string") {
            skills = p.required_skills
              .split(/[,•\-\n]/)
              .map((s: string) => s.trim())
              .filter(Boolean);
          } else if (typeof p.skills === "string") {
            skills = p.skills
              .split(/[,•\-\n]/)
              .map((s: string) => s.trim())
              .filter(Boolean);
          }

          return {
            role_title: String(p.role_title || p.title || p.role || p.name || "Talent Role"),
            seniority: String(p.seniority || p.level || p.experience_level || "Mid-Level"),
            required_skills: skills.length > 0 ? skills : ["Relevant Experience"],
            why: String(
              p.why ||
                p.reason ||
                p.description ||
                p.rationale ||
                "Key strategic role for company growth.",
            ),
          };
        });

      if (result.target_talent_profiles.length === 0) {
        result.target_talent_profiles = [
          {
            role_title: "Core Specialist",
            seniority: "Mid-Level",
            required_skills: ["Domain Expertise", "Team Collaboration"],
            why: "Supports core operational and engineering deliverables.",
          },
        ];
      }
    }

    // 2. compensation_benchmarks_npr
    if (result.compensation_benchmarks_npr !== undefined) {
      if (Array.isArray(result.compensation_benchmarks_npr)) {
        result.compensation_benchmarks_npr = result.compensation_benchmarks_npr
          .filter((b: any) => b && typeof b === "object")
          .map((b: any) => ({
            role: String(b.role || b.title || "Key Role"),
            min_salary: String(b.min_salary || b.min || "Rs. 50,000"),
            max_salary: String(b.max_salary || b.max || "Rs. 100,000"),
            market_trend: String(b.market_trend || b.trend || "Stable market demand"),
          }));
      } else if (
        typeof result.compensation_benchmarks_npr === "object" &&
        result.compensation_benchmarks_npr !== null
      ) {
        if (
          "role" in result.compensation_benchmarks_npr ||
          "min_salary" in result.compensation_benchmarks_npr
        ) {
          const b = result.compensation_benchmarks_npr;
          result.compensation_benchmarks_npr = [
            {
              role: String(b.role || "Key Role"),
              min_salary: String(b.min_salary || "Rs. 50,000"),
              max_salary: String(b.max_salary || "Rs. 100,000"),
              market_trend: String(b.market_trend || "High demand"),
            },
          ];
        } else {
          result.compensation_benchmarks_npr = Object.entries(
            result.compensation_benchmarks_npr,
          ).map(([role, val]: [string, any]) => {
            if (val && typeof val === "object") {
              return {
                role: String(val.role || role),
                min_salary: String(val.min_salary || val.min || "Rs. 50,000"),
                max_salary: String(val.max_salary || val.max || "Rs. 100,000"),
                market_trend: String(val.market_trend || val.trend || "Active market"),
              };
            }
            const strVal = String(val || "");
            const parts = strVal.split(/[-–—to]/i).map((s) => s.trim());
            return {
              role,
              min_salary: parts[0]
                ? parts[0].startsWith("Rs")
                  ? parts[0]
                  : `Rs. ${parts[0]}`
                : "Rs. 50,000",
              max_salary: parts[1]
                ? parts[1].startsWith("Rs")
                  ? parts[1]
                  : `Rs. ${parts[1]}`
                : "Rs. 100,000",
              market_trend: "Active demand",
            };
          });
        }
      } else {
        result.compensation_benchmarks_npr = [];
      }

      if (result.compensation_benchmarks_npr.length === 0) {
        result.compensation_benchmarks_npr = [
          {
            role: "Software Engineer",
            min_salary: "Rs. 60,000",
            max_salary: "Rs. 130,000",
            market_trend: "High market demand",
          },
        ];
      }
    }

    // 3. candidate_screening_criteria
    if (result.candidate_screening_criteria !== undefined) {
      const rawCriteria = Array.isArray(result.candidate_screening_criteria)
        ? result.candidate_screening_criteria
        : typeof result.candidate_screening_criteria === "object" &&
            result.candidate_screening_criteria !== null
          ? [result.candidate_screening_criteria]
          : [];

      result.candidate_screening_criteria = rawCriteria
        .filter((c: any) => c && typeof c === "object")
        .map((c: any) => ({
          category: String(c.category || c.name || "Core Competency"),
          must_have: String(
            c.must_have || c.mustHave || c.required || "Proven track record in primary domain",
          ),
          good_to_have: String(
            c.good_to_have ||
              c.goodToHave ||
              c.preferred ||
              c.optional ||
              "Strong problem solving skills",
          ),
        }));

      if (result.candidate_screening_criteria.length === 0) {
        result.candidate_screening_criteria = [
          {
            category: "Technical Foundation",
            must_have: "Required core stack skills",
            good_to_have: "Production project portfolio",
          },
        ];
      }
    }

    // 4. String array fields
    const stringArrayFields = [
      "skill_demands",
      "recruitment_strategy",
      "interview_focus_areas",
      "employer_branding_suggestions",
    ];

    for (const field of stringArrayFields) {
      if (typeof result[field] === "string") {
        result[field] = result[field]
          .split(/[\r\n•;]+/)
          .map((s: string) => s.replace(/^\d+[.)]\s*/, "").trim())
          .filter(Boolean);
      } else if (!Array.isArray(result[field])) {
        result[field] = result[field] != null ? [String(result[field])] : [];
      }
    }

    if (!result.skill_demands || result.skill_demands.length === 0) {
      result.skill_demands = ["Technical Skills", "Problem Solving", "Communication"];
    }
    if (!result.recruitment_strategy || result.recruitment_strategy.length === 0) {
      result.recruitment_strategy = [
        "Optimize job descriptions for clarity",
        "Screen and respond to applicants within 48 hours",
      ];
    }
    if (!result.interview_focus_areas || result.interview_focus_areas.length === 0) {
      result.interview_focus_areas = [
        "Hands-on technical assessment",
        "Culture and team alignment",
      ];
    }
    if (
      !result.employer_branding_suggestions ||
      result.employer_branding_suggestions.length === 0
    ) {
      result.employer_branding_suggestions = [
        "Highlight collaborative culture and career growth opportunities",
      ];
    }

    // 5. hiring_velocity_assessment
    if (
      result.hiring_velocity_assessment &&
      typeof result.hiring_velocity_assessment === "object"
    ) {
      result.hiring_velocity_assessment =
        result.hiring_velocity_assessment.summary ||
        result.hiring_velocity_assessment.assessment ||
        result.hiring_velocity_assessment.text ||
        JSON.stringify(result.hiring_velocity_assessment);
    } else if (
      typeof result.hiring_velocity_assessment !== "string" ||
      !result.hiring_velocity_assessment.trim()
    ) {
      result.hiring_velocity_assessment =
        "Active hiring pipeline with strong potential to accelerate screening and shortlisting turnaround.";
    }
  }

  return result;
}

class AIServiceImpl {
  private explicitProviders?: AIProvider[];

  constructor(providers?: AIProvider[]) {
    this.explicitProviders = providers;
  }

  private get providers(): AIProvider[] {
    return this.explicitProviders ?? getConfiguredProviderOrder();
  }

  getProviders(): string[] {
    return this.providers.map((p) => p.name);
  }

  async generateText(req: AIRequest): Promise<string> {
    const key = cacheKey(req);
    const cached = getCached(key);
    if (cached !== undefined) return cached as string;
    const result = await this.executeWithFallback((p, timeout) => p.generateText({ ...req, timeoutMs: timeout }), "generateText", req);
    setCached(key, result);
    return result;
  }

  async generateJson<T>(req: AIRequest): Promise<T> {
    const key = cacheKey(req);
    const cached = getCached(key);
    if (cached !== undefined) return cached as T;
    const result = await this.executeWithFallback(
      (p, timeout) => p.generateJson<T>({ ...req, timeoutMs: timeout }),
      "generateJson",
      req,
    );
    setCached(key, result);
    return result;
  }

  async generateJsonValidated<T>(req: AIRequest, schema: z.ZodType<T>): Promise<T> {
    const key = cacheKey(req);
    const cached = getCached(key);
    if (cached !== undefined) return cached as T;

    if (this.providers.length === 0) {
      throw new Error("No AI providers configured");
    }

    // Convert Zod schema to OpenAPI format and shape description
    const responseSchema = zodToGeminiSchema(schema) as unknown as Record<string, unknown>;
    const schemaShape = zodToSchemaShapeDescription(schema);

    // Build base system instruction that explicitly defines JSON schema for all providers (Gemini & Ollama)
    const baseSystemInstruction = req.systemInstruction || "";
    const systemInstructionWithSchema = [
      baseSystemInstruction,
      `CRITICAL JSON OUTPUT FORMAT:`,
      `You MUST return a valid, complete JSON object conforming strictly to this schema:`,
      schemaShape,
      `Ensure all required fields are included with exact field names and appropriate types. Do not wrap in markdown fences or include explanatory commentary outside the JSON.`,
    ]
      .filter(Boolean)
      .join("\n\n");

    const overallStart = Date.now();
    let lastError: unknown;
    let lastZodIssues: string | null = null;

    for (let i = 0; i < this.providers.length; i++) {
      const elapsedSoFar = Date.now() - overallStart;
      const remainingBudgetMs = Math.max(0, AI_CONFIG.TOTAL_OPERATION_TIMEOUT_MS - elapsedSoFar);

      if (remainingBudgetMs < AI_CONFIG.MIN_FALLBACK_BUDGET_MS) {
        log("warn", `Total AI operation budget exceeded (${elapsedSoFar}ms elapsed), stopping provider attempts`, {
          task: req.task ?? "general",
          elapsedMs: elapsedSoFar,
          remainingBudgetMs,
        });
        break;
      }

      const provider = this.providers[i];
      const isFallback = i > 0;
      const providerLabel = isFallback ? `${provider.name}_fallback` : provider.name;

      for (let attempt = 0; attempt <= AI_CONFIG.VALIDATION_RETRY_LIMIT; attempt++) {
        const attemptRemainingBudget = Math.max(0, AI_CONFIG.TOTAL_OPERATION_TIMEOUT_MS - (Date.now() - overallStart));
        if (attemptRemainingBudget < 2_000) {
          log("warn", `Insufficient remaining budget (${attemptRemainingBudget}ms) for validation retry`, {
            task: req.task ?? "general",
            provider: provider.name,
            attempt: attempt + 1,
          });
          break;
        }

        // Use per-provider timeout cap: Ollama gets shorter timeout for fast fail-to-fallback
        const providerMaxTimeout = provider.name === "ollama" ? AI_CONFIG.DEFAULT_OLLAMA_TIMEOUT_MS : AI_CONFIG.DEFAULT_PROVIDER_TIMEOUT_MS;
        const providerTimeoutMs = Math.min(providerMaxTimeout, attemptRemainingBudget);
        const callStart = Date.now();

        try {
          // If this is a retry attempt, augment the prompt with the exact validation errors
          let effectivePrompt = req.prompt;
          if (attempt > 0 && lastZodIssues) {
            effectivePrompt = `${req.prompt}\n\n[CRITICAL CORRECTION REQUIRED]:\nYour previous JSON output was rejected due to schema validation errors:\n${lastZodIssues}\nYou MUST fix these exact issues and provide the complete JSON object with all required fields.`;
          }

          const providerReq: AIRequest = {
            ...req,
            prompt: effectivePrompt,
            systemInstruction: systemInstructionWithSchema,
            responseSchema,
            json: true,
            timeoutMs: providerTimeoutMs,
          };

          const raw = await retryWithBackoff(
            provider,
            (p) => p.generateJson<T>(providerReq),
            `generateJsonValidated:${providerLabel}`,
            providerTimeoutMs,
          );

          const normalized = normalizeAndSanitizeTaskOutput(req.task, raw);
          const parsed = schema.parse(normalized);
          const actualElapsedMs = Date.now() - callStart;

          log(
            "info",
            `${providerLabel} successfully produced validated output for ${req.task ?? "task"}`,
            {
              task: req.task ?? "general",
              provider: provider.name,
              provider_type: isFallback ? `${provider.name}_fallback` : provider.name,
              attempt: attempt + 1,
              configuredTimeoutMs: providerTimeoutMs,
              actualElapsedMs,
              remainingBudgetMs: Math.max(0, AI_CONFIG.TOTAL_OPERATION_TIMEOUT_MS - (Date.now() - overallStart)),
            },
          );

          setCached(key, parsed);
          return parsed;
        } catch (err) {
          lastError = err;
          const actualElapsedMs = Date.now() - callStart;
          const hasFallback = i < this.providers.length - 1;
          const fallbackProvider = hasFallback ? this.providers[i + 1].name : null;

          if (err instanceof z.ZodError) {
            lastZodIssues = err.issues
              .map((iss) => `- Field "${iss.path.join(".") || "root"}": ${iss.message}`)
              .join("\n");

            log(
              "warn",
              `${providerLabel} attempt ${attempt + 1} validation failure (schema mismatch)`,
              {
                task: req.task ?? "general",
                provider: provider.name,
                attempt: attempt + 1,
                configuredTimeoutMs: providerTimeoutMs,
                actualElapsedMs,
                remainingBudgetMs: Math.max(0, AI_CONFIG.TOTAL_OPERATION_TIMEOUT_MS - (Date.now() - overallStart)),
                errorType: "ZodValidationError",
                validationIssues: lastZodIssues,
              },
            );

            if (attempt < AI_CONFIG.VALIDATION_RETRY_LIMIT) {
              await sleep(AI_CONFIG.VALIDATION_BACKOFF_MS);
              continue;
            }
          } else {
            lastZodIssues = null;
            const errMessage = err instanceof Error ? err.message : String(err);
            const errorType = (err as any)?.name || (err as any)?.statusCode || "UnknownExecutionError";

            log(
              "warn",
              `${providerLabel} attempt ${attempt + 1} execution failure: ${errMessage}`,
              {
                task: req.task ?? "general",
                provider: provider.name,
                attempt: attempt + 1,
                configuredTimeoutMs: providerTimeoutMs,
                actualElapsedMs,
                remainingBudgetMs: Math.max(0, AI_CONFIG.TOTAL_OPERATION_TIMEOUT_MS - (Date.now() - overallStart)),
                errorType,
                fallbackAttempted: hasFallback,
                fallbackProvider,
              },
            );

            // CRITICAL: Non-validation errors (e.g. 408 timeout, 503, connection drop) must NOT retry the same provider; break immediately to fallback.
            break;
          }
        }
      }

      if (i < this.providers.length - 1) {
        log(
          "warn",
          `Primary provider ${provider.name} failed. Automatically falling back to ${this.providers[i + 1].name}`,
          {
            task: req.task ?? "general",
            from_provider: provider.name,
            to_provider: this.providers[i + 1].name,
            remainingBudgetMs: Math.max(0, AI_CONFIG.TOTAL_OPERATION_TIMEOUT_MS - (Date.now() - overallStart)),
          },
        );
      }
    }

    const msg = "AI operation could not be completed. Please try again.";
    log("error", `All AI providers failed for ${req.task ?? "task"}`, {
      task: req.task ?? "general",
      totalElapsedMs: Date.now() - overallStart,
      error: (lastError as Error)?.message,
    });
    throw new Error(msg);
  }

  async generateEmbedding(req: AIEmbeddingRequest): Promise<AIEmbeddingResponse> {
    for (const provider of this.providers) {
      if (!provider.generateEmbedding) continue;
      try {
        const start = Date.now();
        const res = await provider.generateEmbedding({ ...req, timeoutMs: AI_CONFIG.DEFAULT_PROVIDER_TIMEOUT_MS });
        log("info", `Embedding generated`, {
          provider: provider.name,
          model: res.model,
          latencyMs: Date.now() - start,
          dimensions: res.embedding.length,
        });
        return res;
      } catch (err) {
        log("warn", `Embedding provider ${provider.name} failed`, {
          error: (err as Error).message,
        });
      }
    }
    throw new Error("No embedding provider available");
  }

  private async executeWithFallback<T>(
    fn: (p: AIProvider, timeoutMs: number) => Promise<T>,
    label: string,
    req: AIRequest,
  ): Promise<T> {
    if (this.providers.length === 0) {
      throw new Error("No AI providers configured");
    }

    const overallStart = Date.now();
    let lastError: unknown;

    for (let i = 0; i < this.providers.length; i++) {
      const elapsed = Date.now() - overallStart;
      const remainingBudgetMs = Math.max(0, AI_CONFIG.TOTAL_OPERATION_TIMEOUT_MS - elapsed);

      if (remainingBudgetMs < AI_CONFIG.MIN_FALLBACK_BUDGET_MS) {
        log("warn", `Total AI operation budget exceeded for ${label}, stopping provider attempts`, {
          label,
          elapsedMs: elapsed,
          remainingBudgetMs,
        });
        break;
      }

      const provider = this.providers[i];
      const isFallback = i > 0;
      const providerLabel = isFallback ? `${provider.name}_fallback` : provider.name;
      // Use per-provider timeout cap: Ollama gets shorter timeout for fast fail-to-fallback
      const providerMaxTimeout = provider.name === "ollama" ? AI_CONFIG.DEFAULT_OLLAMA_TIMEOUT_MS : AI_CONFIG.DEFAULT_PROVIDER_TIMEOUT_MS;
      const providerTimeoutMs = Math.min(providerMaxTimeout, remainingBudgetMs);
      const callStart = Date.now();

      try {
        const result = await retryWithBackoff(provider, (p) => fn(p, providerTimeoutMs), `${label}:${providerLabel}`, providerTimeoutMs);
        const actualElapsedMs = Date.now() - callStart;
        log("info", `${providerLabel} successfully handled request`, {
          task: req.task ?? "general",
          provider: provider.name,
          provider_type: isFallback ? `${provider.name}_fallback` : provider.name,
          label,
          actualElapsedMs,
          remainingBudgetMs: Math.max(0, AI_CONFIG.TOTAL_OPERATION_TIMEOUT_MS - (Date.now() - overallStart)),
        });
        return result;
      } catch (err) {
        lastError = err;
        const actualElapsedMs = Date.now() - callStart;
        const hasFallback = i < this.providers.length - 1;
        const fallbackProvider = hasFallback ? this.providers[i + 1].name : null;

        log(
          "warn",
          `Provider ${provider.name} failed (${(err as Error).message})`,
          {
            task: req.task ?? "general",
            provider: provider.name,
            label,
            configuredTimeoutMs: providerTimeoutMs,
            actualElapsedMs,
            remainingBudgetMs: Math.max(0, AI_CONFIG.TOTAL_OPERATION_TIMEOUT_MS - (Date.now() - overallStart)),
            errorType: (err as any)?.name || (err as any)?.statusCode || "UnknownError",
            fallbackAttempted: hasFallback,
            fallbackProvider,
          },
        );
      }
    }

    const msg = "AI service temporarily unavailable. Please try again shortly.";
    log("error", `All AI providers failed for ${label}`, {
      task: req.task ?? "general",
      totalElapsedMs: Date.now() - overallStart,
      error: (lastError as Error)?.message,
    });
    throw new Error(msg);
  }
}

let singleton: AIServiceImpl | null = null;

function getService(): AIServiceImpl {
  if (!singleton) {
    singleton = new AIServiceImpl();
  }
  return singleton;
}

export function getAIProviders(): string[] {
  return getService().getProviders();
}

export async function aiGenerateText(
  prompt: string,
  systemInstruction?: string,
  model?: string,
  task?: AITask,
): Promise<string> {
  return getService().generateText({ prompt, systemInstruction, model, task });
}

export async function aiGenerateJson<T>(
  prompt: string,
  systemInstruction: string,
  model?: string,
  task?: AITask,
): Promise<T> {
  return getService().generateJson<T>({ prompt, systemInstruction, model, task, json: true });
}

export async function aiGenerateJsonValidated<T>(
  prompt: string,
  systemInstruction: string,
  schema: z.ZodType<T>,
  task: AITask,
  model?: string,
): Promise<T> {
  return getService().generateJsonValidated<T>(
    { prompt, systemInstruction, model, task, json: true },
    schema,
  );
}

export async function aiGenerateEmbedding(
  input: string,
  model?: string,
): Promise<AIEmbeddingResponse> {
  return getService().generateEmbedding({ input, model });
}

export { AIServiceImpl };
