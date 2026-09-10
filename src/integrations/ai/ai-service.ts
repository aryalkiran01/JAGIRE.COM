/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from "zod";
import { AIProvider, AIRequest, AIEmbeddingRequest, AIEmbeddingResponse, AITask } from "./types";
import { GeminiProvider } from "./gemini-provider";
import { OllamaProvider } from "./ollama-provider";
import { isTransient, isFatal } from "./errors";
import { AITransientError } from "./types";
import { zodToGeminiSchema, zodToSchemaShapeDescription } from "./schema-converter";

const MAX_RETRIES = 1;
const BACKOFF_BASE_MS = 500;
const VALIDATION_RETRY_LIMIT = 1;
const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 200;

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
    console[level === "error" ? "error" : level === "warn" ? "warn" : "log"](line, meta ?? "");
  } else {
    console[level === "error" ? "error" : level === "warn" ? "warn" : "log"](line);
  }
}

function getConfiguredProviderOrder(): AIProvider[] {
  const list: AIProvider[] = [];
  // Primary AI Provider: Google Gemini
  if (process.env.GEMINI_API_KEY) {
    list.push(new GeminiProvider());
  }
  // Automatic fallback: Ollama (always available as fallback)
  list.push(new OllamaProvider());
  return list;
}

async function retryWithBackoff<T>(
  provider: AIProvider,
  fn: (p: AIProvider) => Promise<T>,
  label: string,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const start = Date.now();
    try {
      const result = await fn(provider);
      const latencyMs = Date.now() - start;
      log("info", `${provider.name} succeeded for ${label}`, {
        provider: provider.name,
        label,
        attempt,
        latencyMs,
      });
      return result;
    } catch (err) {
      lastError = err;
      const latencyMs = Date.now() - start;
      if (attempt < MAX_RETRIES && isTransient(err)) {
        const delay = BACKOFF_BASE_MS * Math.pow(2, attempt);
        log("warn", `${provider.name} transient error — retrying in ${delay}ms`, {
          provider: provider.name,
          attempt: attempt + 1,
          error: (err as Error).message,
          latencyMs,
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
  return `${req.task ?? "general"}:${req.model ?? "default"}:${req.prompt}`;
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
  if (responseCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = responseCache.keys().next().value;
    if (oldestKey) responseCache.delete(oldestKey);
  }
  responseCache.set(key, { value, expires: Date.now() + CACHE_TTL_MS });
}

function normalizeAndSanitizeTaskOutput(task: AITask | undefined, raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const result = { ...(raw as Record<string, any>) };

  if (task === "resume-analysis") {
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

    for (const [field, max] of Object.entries(maxLengths)) {
      if (Array.isArray(result[field]) && result[field].length > max) {
        result[field] = result[field].slice(0, max);
      }
    }

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
      }
    }

    if (typeof result.salary_prediction === "string") {
      try {
        result.salary_prediction = JSON.parse(result.salary_prediction);
      } catch {
        result.salary_prediction = null;
      }
    }

    if (typeof result.interview_prep_plan === "string") {
      try {
        result.interview_prep_plan = JSON.parse(result.interview_prep_plan);
      } catch {
        result.interview_prep_plan = null;
      }
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
        : typeof result.target_talent_profiles === "object" && result.target_talent_profiles !== null
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
            skills = p.required_skills.split(/[,•\-\n]/).map((s: string) => s.trim()).filter(Boolean);
          } else if (typeof p.skills === "string") {
            skills = p.skills.split(/[,•\-\n]/).map((s: string) => s.trim()).filter(Boolean);
          }

          return {
            role_title: String(p.role_title || p.title || p.role || p.name || "Talent Role"),
            seniority: String(p.seniority || p.level || p.experience_level || "Mid-Level"),
            required_skills: skills.length > 0 ? skills : ["Relevant Experience"],
            why: String(p.why || p.reason || p.description || p.rationale || "Key strategic role for company growth."),
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
      } else if (typeof result.compensation_benchmarks_npr === "object" && result.compensation_benchmarks_npr !== null) {
        if ("role" in result.compensation_benchmarks_npr || "min_salary" in result.compensation_benchmarks_npr) {
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
          result.compensation_benchmarks_npr = Object.entries(result.compensation_benchmarks_npr).map(
            ([role, val]: [string, any]) => {
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
                min_salary: parts[0] ? (parts[0].startsWith("Rs") ? parts[0] : `Rs. ${parts[0]}`) : "Rs. 50,000",
                max_salary: parts[1] ? (parts[1].startsWith("Rs") ? parts[1] : `Rs. ${parts[1]}`) : "Rs. 100,000",
                market_trend: "Active demand",
              };
            },
          );
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
        : typeof result.candidate_screening_criteria === "object" && result.candidate_screening_criteria !== null
          ? [result.candidate_screening_criteria]
          : [];

      result.candidate_screening_criteria = rawCriteria
        .filter((c: any) => c && typeof c === "object")
        .map((c: any) => ({
          category: String(c.category || c.name || "Core Competency"),
          must_have: String(c.must_have || c.mustHave || c.required || "Proven track record in primary domain"),
          good_to_have: String(c.good_to_have || c.goodToHave || c.preferred || c.optional || "Strong problem solving skills"),
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
          .map((s: string) => s.replace(/^\d+[\.\)]\s*/, "").trim())
          .filter(Boolean);
      } else if (!Array.isArray(result[field])) {
        result[field] = result[field] != null ? [String(result[field])] : [];
      }
    }

    // Ensure non-empty arrays for required fields
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
      result.interview_focus_areas = ["Hands-on technical assessment", "Culture and team alignment"];
    }
    if (!result.employer_branding_suggestions || result.employer_branding_suggestions.length === 0) {
      result.employer_branding_suggestions = [
        "Highlight collaborative culture and career growth opportunities",
      ];
    }

    // 5. hiring_velocity_assessment
    if (result.hiring_velocity_assessment && typeof result.hiring_velocity_assessment === "object") {
      result.hiring_velocity_assessment =
        result.hiring_velocity_assessment.summary ||
        result.hiring_velocity_assessment.assessment ||
        result.hiring_velocity_assessment.text ||
        JSON.stringify(result.hiring_velocity_assessment);
    } else if (typeof result.hiring_velocity_assessment !== "string" || !result.hiring_velocity_assessment.trim()) {
      result.hiring_velocity_assessment =
        "Active hiring pipeline with strong potential to accelerate screening and shortlisting turnaround.";
    }
  }

  return result;
}

class AIServiceImpl {
  private providers: AIProvider[];

  constructor(providers?: AIProvider[]) {
    this.providers = providers ?? getConfiguredProviderOrder();
  }

  getProviders(): string[] {
    return this.providers.map((p) => p.name);
  }

  async generateText(req: AIRequest): Promise<string> {
    const key = cacheKey(req);
    const cached = getCached(key);
    if (cached !== undefined) return cached as string;
    const result = await this.executeWithFallback((p) => p.generateText(req), "generateText", req);
    setCached(key, result);
    return result;
  }

  async generateJson<T>(req: AIRequest): Promise<T> {
    const key = cacheKey(req);
    const cached = getCached(key);
    if (cached !== undefined) return cached as T;
    const result = await this.executeWithFallback(
      (p) => p.generateJson<T>(req),
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

    // Convert Zod schema to Gemini OpenAPI format and human-readable shape description
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

    let lastError: unknown;
    let lastZodIssues: string | null = null;

    for (let i = 0; i < this.providers.length; i++) {
      const provider = this.providers[i];
      const isFallback = i > 0;
      const providerLabel = isFallback ? `${provider.name}_fallback` : provider.name;

      for (let attempt = 0; attempt <= VALIDATION_RETRY_LIMIT; attempt++) {
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
          };

          const raw = await retryWithBackoff(
            provider,
            (p) => p.generateJson<T>(providerReq),
            `generateJsonValidated:${providerLabel}`,
          );

          const normalized = normalizeAndSanitizeTaskOutput(req.task, raw);
          const parsed = schema.parse(normalized);

          log(
            "info",
            `${providerLabel} successfully produced validated output for ${req.task ?? "task"}`,
            {
              provider: provider.name,
              provider_type: isFallback ? "ollama_fallback" : "gemini",
              task: req.task,
              attempt,
            },
          );

          setCached(key, parsed);
          return parsed;
        } catch (err) {
          lastError = err;
          if (err instanceof z.ZodError) {
            lastZodIssues = err.issues
              .map((iss) => `- Field "${iss.path.join(".") || "root"}": ${iss.message}`)
              .join("\n");
          } else {
            lastZodIssues = null;
          }

          const errMessage = err instanceof Error ? err.message : String(err);
          log(
            "warn",
            `${providerLabel} attempt ${attempt + 1} validation/execution failure: ${errMessage}`,
            {
              provider: provider.name,
              task: req.task,
              attempt,
            },
          );
          if (attempt < VALIDATION_RETRY_LIMIT) {
            await sleep(BACKOFF_BASE_MS);
          }
        }
      }

      if (i < this.providers.length - 1) {
        log(
          "warn",
          `Primary provider ${provider.name} failed. Automatically falling back to ${this.providers[i + 1].name}`,
          {
            from_provider: provider.name,
            to_provider: this.providers[i + 1].name,
            task: req.task,
          },
        );
      }
    }

    const msg = "AI operation could not be completed. Please try again.";
    log("error", `All AI providers failed for ${req.task ?? "task"}`, {
      error: (lastError as Error)?.message,
    });
    throw new Error(msg);
  }

  async generateEmbedding(req: AIEmbeddingRequest): Promise<AIEmbeddingResponse> {
    for (const provider of this.providers) {
      if (!provider.generateEmbedding) continue;
      try {
        const start = Date.now();
        const res = await provider.generateEmbedding(req);
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
    fn: (p: AIProvider) => Promise<T>,
    label: string,
    req: AIRequest,
  ): Promise<T> {
    if (this.providers.length === 0) {
      throw new Error("No AI providers configured");
    }

    let lastError: unknown;
    for (let i = 0; i < this.providers.length; i++) {
      const provider = this.providers[i];
      const isFallback = i > 0;
      const providerLabel = isFallback ? `${provider.name}_fallback` : provider.name;

      try {
        const result = await retryWithBackoff(provider, fn, `${label}:${providerLabel}`);
        log("info", `${providerLabel} successfully handled request`, {
          provider: provider.name,
          provider_type: isFallback ? "ollama_fallback" : "gemini",
          label,
        });
        return result;
      } catch (err) {
        lastError = err;
        if (i < this.providers.length - 1) {
          log(
            "warn",
            `Provider ${provider.name} failed (${(err as Error).message}) — automatically falling back to ${this.providers[i + 1].name}`,
            {
              from_provider: provider.name,
              to_provider: this.providers[i + 1].name,
              error: (err as Error).message,
            },
          );
        }
      }
    }

    const msg = "AI service temporarily unavailable. Please try again shortly.";
    log("error", `All AI providers failed for ${label}`, { error: (lastError as Error)?.message });
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
