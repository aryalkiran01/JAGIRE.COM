/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from "zod";
import { AIProvider, AIRequest, AIEmbeddingRequest, AIEmbeddingResponse, AITask } from "./types";
import { GeminiProvider } from "./gemini-provider";
import { OllamaProvider } from "./ollama-provider";
import { isTransient, isFatal } from "./errors";
import { AITransientError } from "./types";

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

    let lastError: unknown;

    for (let i = 0; i < this.providers.length; i++) {
      const provider = this.providers[i];
      const isFallback = i > 0;
      const providerLabel = isFallback ? `${provider.name}_fallback` : provider.name;

      for (let attempt = 0; attempt <= VALIDATION_RETRY_LIMIT; attempt++) {
        try {
          const raw = await retryWithBackoff(
            provider,
            (p) => p.generateJson<T>(req),
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
