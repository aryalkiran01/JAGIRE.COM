import { z } from "zod";
import { AIProvider, AIRequest, AIEmbeddingRequest, AIEmbeddingResponse, AITask } from "./types";
import { GeminiProvider } from "./gemini-provider";
import { OpenRouterProvider } from "./openrouter-provider";
import { OllamaProvider } from "./ollama-provider";
import { isTransient, isFatal } from "./errors";

const MAX_RETRIES = 3;
const BACKOFF_BASE_MS = 1000;
const VALIDATION_RETRY_LIMIT = 1;

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
    case "gemini":
      if (process.env.GEMINI_API_KEY) list.push(new GeminiProvider());
      if (process.env.OPENROUTER_API_KEY) list.push(new OpenRouterProvider());
      if (process.env.OLLAMA_HOST) list.push(new OllamaProvider());
      break;
    case "openrouter":
      if (process.env.OPENROUTER_API_KEY) list.push(new OpenRouterProvider());
      if (process.env.GEMINI_API_KEY) list.push(new GeminiProvider());
      if (process.env.OLLAMA_HOST) list.push(new OllamaProvider());
      break;
    case "ollama":
    default:
      list.push(new OllamaProvider());
      if (process.env.GEMINI_API_KEY) list.push(new GeminiProvider());
      if (process.env.OPENROUTER_API_KEY) list.push(new OpenRouterProvider());
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
    return this.executeWithFallback((p) => p.generateText(req), "generateText", req);
  }

  async generateJson<T>(req: AIRequest): Promise<T> {
    return this.executeWithFallback((p) => p.generateJson<T>(req), "generateJson", req);
  }

  async generateJsonValidated<T>(req: AIRequest, schema: z.ZodType<T>): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= VALIDATION_RETRY_LIMIT; attempt++) {
      try {
        const raw = await this.executeWithFallback(
          (p) => p.generateJson<T>(req),
          "generateJsonValidated",
          req,
        );

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
  ): Promise<T> {
    if (this.providers.length === 0) {
      throw new Error("No AI providers configured");
    }

    let lastError: unknown;
    for (let i = 0; i < this.providers.length; i++) {
      const idx = (this.providerIndex + i) % this.providers.length;
      const provider = this.providers[idx];
      try {
        log("info", `Trying provider ${provider.name} for ${label}`, {
          provider: provider.name,
          label,
          task: req.task ?? "general",
          promptLength: req.prompt.length,
        });
        const result = await retryWithBackoff(provider, fn, `${label}:${provider.name}`);
        this.providerIndex = idx;
        return result;
      } catch (err) {
        lastError = err;
        if (isFatal(err)) {
          throw err;
        }
        if (i < this.providers.length - 1) {
          log("warn", `Provider ${provider.name} failed — falling back to next provider`, {
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

export { AIServiceImpl };
