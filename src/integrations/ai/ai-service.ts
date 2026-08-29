/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from "zod";
import {
  AIProvider,
  AIRequest,
  AIEmbeddingRequest,
  AIEmbeddingResponse,
  AITask,
  AIResult,
} from "./types";
import { GeminiProvider } from "./gemini-provider";
import { OllamaProvider } from "./ollama-provider";
import { isTransient, isFatal } from "./errors";
import { AITransientError } from "./types";

const MAX_RETRIES = 2;
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
  const declared = process.env.AI_PROVIDER?.toLowerCase() ?? "ollama";
  const list: AIProvider[] = [];
  switch (declared) {
    case "ollama":
    default:
      if (process.env.OLLAMA_HOST) list.push(new OllamaProvider());
      if (process.env.GEMINI_API_KEY) list.push(new GeminiProvider());
      break;
    case "gemini":
      if (process.env.GEMINI_API_KEY) list.push(new GeminiProvider());
      if (process.env.OLLAMA_HOST) list.push(new OllamaProvider());
      break;
  }
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
      if (isFatal(err)) {
        log("error", `${provider.name} fatal error — not retrying`, {
          provider: provider.name,
          error: (err as Error).message,
          latencyMs,
        });
        throw err;
      }
      if (!isTransient(err)) {
        log("error", `${provider.name} non-transient error — not retrying`, {
          provider: provider.name,
          error: (err as Error).message,
          latencyMs,
        });
        throw err;
      }
      if (attempt < MAX_RETRIES) {
        const delay = BACKOFF_BASE_MS * Math.pow(2, attempt);
        log("warn", `${provider.name} transient error — retrying in ${delay}ms`, {
          provider: provider.name,
          attempt: attempt + 1,
          error: (err as Error).message,
          latencyMs,
        });
        await sleep(delay);
      }
    }
  }
  log("error", `${label} exhausted retries`, {
    provider: provider.name,
    error: (lastError as Error)?.message,
  });
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

function coerceNumber(val: unknown): number | undefined {
  if (typeof val === "number" && !isNaN(val)) return val;
  if (typeof val === "string") {
    const n = Number(val.replace(/[^0-9.-]/g, ""));
    return isNaN(n) ? undefined : n;
  }
  return undefined;
}

function coerceStringArray(val: unknown, max?: number): string[] | undefined {
  if (Array.isArray(val)) {
    const arr = val.filter((s) => typeof s === "string" && s.trim());
    return max ? arr.slice(0, max) : arr;
  }
  if (typeof val === "string" && val.trim()) {
    const arr = val
      .split(/[,•;\n]|\d+\.\s*/)
      .map((s) => s.trim())
      .filter(Boolean);
    return max ? arr.slice(0, max) : arr;
  }
  return undefined;
}

function tryParseFormattedNumber(s: string): number | undefined {
  const trimmed = s.trim();
  if (!trimmed) return undefined;

  // Pure number: "85", "85.5", "-3"
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    const n = Number(trimmed);
    return isNaN(n) ? undefined : n;
  }

  // Percentage: "85%", "85.5%"
  const pctMatch = trimmed.match(/^(-?\d+(?:\.\d+)?)\s*%$/);
  if (pctMatch) {
    const n = Number(pctMatch[1]);
    return isNaN(n) ? undefined : n;
  }

  // Fraction/score: "85/100", "85 / 100"
  const fracMatch = trimmed.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
  if (fracMatch) {
    const num = Number(fracMatch[1]);
    const denom = Number(fracMatch[2]);
    if (!isNaN(num) && !isNaN(denom) && denom !== 0) {
      return denom === 100 ? num : Math.round((num / denom) * 100);
    }
    return undefined;
  }

  // "X out of Y": "85 out of 100"
  const outOfMatch = trimmed.match(/^(-?\d+(?:\.\d+)?)\s+out\s+of\s+(\d+(?:\.\d+)?)$/i);
  if (outOfMatch) {
    const num = Number(outOfMatch[1]);
    const denom = Number(outOfMatch[2]);
    if (!isNaN(num) && !isNaN(denom) && denom !== 0) {
      return denom === 100 ? num : Math.round((num / denom) * 100);
    }
    return undefined;
  }

  // Currency-prefixed: "Rs. 50,000", "NPR 50,000", "$ 1,200", "USD 1200"
  const currencyMatch = trimmed.match(
    /^(?:rs\.?|npr|usd|\$|eur|gbp|inr|jpy|kr)\s*(-?\d[\d,]*(?:\.\d+)?)\s*$/i,
  );
  if (currencyMatch) {
    const n = Number(currencyMatch[1].replace(/,/g, ""));
    return isNaN(n) ? undefined : n;
  }

  // Comma-separated number: "50,000", "1,200.50"
  const commaMatch = trimmed.match(/^-?\d{1,3}(?:,\d{3})+(?:\.\d+)?$/);
  if (commaMatch) {
    const n = Number(trimmed.replace(/,/g, ""));
    return isNaN(n) ? undefined : n;
  }

  // Number with suffix: "85 score", "85 points", "score: 85"
  const suffixMatch = trimmed.match(
    /^(?:score|points?)?:?\s*(-?\d+(?:\.\d+)?)\s*(?:score|points?)?$/i,
  );
  if (suffixMatch) {
    const n = Number(suffixMatch[1]);
    return isNaN(n) ? undefined : n;
  }

  return undefined;
}

function normalizeRawResponse(raw: unknown): void {
  if (typeof raw !== "object" || raw === null) return;
  const obj = raw as Record<string, any>;
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val === null || val === undefined) continue;
    if (typeof val === "number") continue;
    if (typeof val === "string") {
      const parsed = tryParseFormattedNumber(val);
      if (parsed !== undefined) obj[key] = parsed;
      continue;
    }
    if (Array.isArray(val)) {
      const coerced = val.map((item) => {
        if (item === null || item === undefined) return item;
        if (typeof item === "object") {
          normalizeRawResponse(item);
          return item;
        }
        return item;
      });
      obj[key] = coerced;
      continue;
    }
    if (typeof val === "object") {
      normalizeRawResponse(val);
    }
  }
}

class AIServiceImpl {
  private providers: AIProvider[];
  private providerIndex = 0;

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
    const { result } = await this.executeWithFallback(
      (p) => p.generateText(req),
      "generateText",
      req,
    );
    setCached(key, result);
    return result;
  }

  async generateJson<T>(req: AIRequest): Promise<T> {
    const key = cacheKey(req);
    const cached = getCached(key);
    if (cached !== undefined) return cached as T;
    const { result } = await this.executeWithFallback(
      (p) => p.generateJson<T>(req),
      "generateJson",
      req,
    );
    setCached(key, result);
    return result;
  }

  async generateTextResult(req: AIRequest): Promise<AIResult<string>> {
    try {
      const { result, providerName } = await this.executeWithFallback(
        (p) => p.generateText(req),
        "generateTextResult",
        req,
      );
      return { success: true, data: result, provider: providerName };
    } catch (err) {
      const msg = (err as Error).message ?? "AI text generation failed";
      log("error", `generateTextResult failed: ${msg}`);
      return {
        success: false,
        data: null,
        error: { code: "AI_TEXT_FAILED", message: "Unable to generate a response right now." },
        provider: null,
      };
    }
  }

  async generateJsonResult<T>(req: AIRequest, schema: z.ZodType<T>): Promise<AIResult<T>> {
    try {
      const data = await this.generateJsonValidated(req, schema);
      return {
        success: true,
        data,
        provider: this.providers[this.providerIndex]?.name ?? "unknown",
      };
    } catch (err) {
      const msg = (err as Error).message ?? "AI JSON generation failed";
      log("error", `generateJsonResult failed: ${msg}`);
      return {
        success: false,
        data: null,
        error: {
          code: "AI_ANALYSIS_FAILED",
          message: "Unable to complete the analysis right now.",
        },
        provider: null,
      };
    }
  }

  async generateJsonValidated<T>(req: AIRequest, schema: z.ZodType<T>): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= VALIDATION_RETRY_LIMIT; attempt++) {
      try {
        const skipCache = attempt > 0;
        const { result: raw } = await this.executeWithFallback(
          (p) => p.generateJson<T>(req),
          `generateJsonValidated:attempt${attempt}`,
          req,
          skipCache,
        );

        normalizeRawResponse(raw);

        // Universal pre-processing: runs for every task before task-specific fixes.
        // Handles three common LLM mistakes that break Zod validation:
        //   1. Arrays returned as comma/newline-separated strings
        //   2. Arrays with far more items than any schema expects
        //   3. Object fields returned as JSON strings
        if (typeof raw === "object" && raw !== null) {
          const obj = raw as Record<string, any>;
          for (const key of Object.keys(obj)) {
            const val = obj[key];
            if (val === null || val === undefined) continue;

            // Parse stringified JSON objects/arrays into real ones
            if (typeof val === "string" && val.trim().startsWith("[") && val.trim().endsWith("]")) {
              try {
                const parsed = JSON.parse(val);
                if (Array.isArray(parsed)) {
                  obj[key] = parsed;
                  continue;
                }
              } catch {
                /* not valid JSON, fall through to split logic */
              }
            }
            if (typeof val === "string" && val.trim().startsWith("{") && val.trim().endsWith("}")) {
              try {
                const parsed = JSON.parse(val);
                if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
                  obj[key] = parsed;
                  continue;
                }
              } catch {
                /* not valid JSON, leave as string */
              }
            }

            // Split comma/newline-separated strings into arrays
            if (typeof val === "string" && val.length > 2) {
              const looksDelimited = /[,•;\n]|\d+\.\s/.test(val);
              const hasMultipleWords =
                val.split(/[,•;\n]|\d+\.\s/).filter((s) => s.trim()).length > 1;
              if (looksDelimited && hasMultipleWords) {
                const arr = val
                  .split(/[,•;\n]|\d+\.\s*/)
                  .map((s) => s.trim())
                  .filter(Boolean);
                if (arr.length > 1) {
                  obj[key] = arr;
                }
              }
            }

            // Truncate overly long arrays to a sane cap
            if (Array.isArray(val) && val.length > 25) {
              obj[key] = val.slice(0, 25);
            }
          }
        }

        if (req.task === "resume-analysis" && typeof raw === "object" && raw !== null) {
          const result = raw as Record<string, any>;

          // Truncate arrays that exceed maximum lengths
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

          // Fix string arrays that came as comma-separated strings
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

          // ✅ FIX: Convert summary from array to string if the AI returns it as an array
          if (Array.isArray(result.summary)) {
            result.summary =
              result.summary
                .filter((item: any) => typeof item === "string" && item.trim())
                .join(" ")
                .trim() || "Resume analysis summary";
          }

          // Fix salary_prediction
          if (typeof result.salary_prediction === "string") {
            try {
              result.salary_prediction = JSON.parse(result.salary_prediction);
            } catch {
              result.salary_prediction = null;
            }
          }

          // Fix interview_prep_plan
          if (typeof result.interview_prep_plan === "string") {
            try {
              result.interview_prep_plan = JSON.parse(result.interview_prep_plan);
            } catch {
              result.interview_prep_plan = null;
            }
          }

          // Assign back to raw
          Object.assign(raw as any, result);
        }

        if (req.task === "career-coach" && typeof raw === "object" && raw !== null) {
          const result = raw as Record<string, any>;

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

          Object.assign(raw as any, result);
        }
        // In generateJsonValidated method, add this block after the career-coach handling:

        if (req.task === "learning-recommendations" && typeof raw === "object" && raw !== null) {
          const result = raw as Record<string, any>;

          // Ensure items is an array
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

          // Validate and fix each item - Generate search URLs instead of fake course URLs
          result.items = result.items
            .filter((item: any) => item && typeof item === "object")
            .map((item: any, index: number) => {
              // Generate a search URL based on the course details
              const searchTerms = `${item.title || ""} ${item.provider || "course"}`.trim();
              const searchUrl = searchTerms
                ? `https://www.google.com/search?q=${encodeURIComponent(searchTerms + " course")}`
                : `https://www.google.com/search?q=${encodeURIComponent("learn " + (item.skills?.[0] || "programming"))}`;

              // If provider is known, create a more specific search
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

          // Ensure we have at least 1 item
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

          Object.assign(raw as any, result);
        }

        // Then validate
        const parsed = schema.parse(raw);
        if (attempt > 0) {
          log("info", `Validation succeeded on retry ${attempt}`, { label: req.task });
        }
        return parsed;
      } catch (err) {
        lastError = err;
        if (err instanceof z.ZodError) {
          log("warn", `Zod validation failed — retrying once`, {
            task: req.task,
            errors: err.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
            attempt,
          });
          if (attempt < VALIDATION_RETRY_LIMIT) continue;
        }
        throw err;
      }
    }
    throw lastError;
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
    skipCache = false,
  ): Promise<{ result: T; providerName: string }> {
    if (this.providers.length === 0) {
      throw new Error("No AI providers configured");
    }

    const key = cacheKey(req);
    if (!skipCache) {
      const cached = getCached(key);
      if (cached !== undefined) return { result: cached as T, providerName: "cache" };
    }

    let lastError: unknown;
    for (let i = 0; i < this.providers.length; i++) {
      const idx = (this.providerIndex + i) % this.providers.length;
      const provider = this.providers[idx];

      try {
        const result = await retryWithBackoff(provider, fn, `${label}:${provider.name}`);
        this.providerIndex = idx;
        setCached(key, result);
        return { result, providerName: provider.name };
      } catch (err) {
        lastError = err;
        if (isFatal(err)) {
          throw err;
        }
        if (i < this.providers.length - 1) {
          log("warn", `Provider ${provider.name} failed — falling back`, {
            provider: provider.name,
            nextProvider: this.providers[(idx + 1) % this.providers.length].name,
            error: (err as Error).message,
          });
        }
      }
    }

    const msg =
      lastError instanceof Error
        ? `All AI providers failed. Last error: ${lastError.message}`
        : "All AI providers failed with an unknown error";
    log("error", msg, { error: (lastError as Error)?.message });
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

export async function aiGenerateTextResult(
  prompt: string,
  systemInstruction: string,
  task: AITask,
  model?: string,
): Promise<AIResult<string>> {
  return getService().generateTextResult({ prompt, systemInstruction, model, task });
}

export async function aiGenerateJsonResult<T>(
  prompt: string,
  systemInstruction: string,
  schema: z.ZodType<T>,
  task: AITask,
  model?: string,
): Promise<AIResult<T>> {
  return getService().generateJsonResult<T>(
    { prompt, systemInstruction, model, task, json: true },
    schema,
  );
}

export { AIServiceImpl };
