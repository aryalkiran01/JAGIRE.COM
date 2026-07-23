import { AIProvider, AIRequest } from "./types";
import { GeminiProvider } from "./gemini-provider";
import { OpenRouterProvider } from "./openrouter-provider";
import { isTransient, isFatal } from "./errors";

const MAX_RETRIES = 3;
const BACKOFF_BASE_MS = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function log(level: "info" | "warn" | "error", message: string, meta?: Record<string, unknown>): void {
  const ts = new Date().toISOString();
  const line = `[${ts}] [AIService] [${level.toUpperCase()}] ${message}`;
  if (meta) {
    console[level === "error" ? "error" : level === "warn" ? "warn" : "log"](line, meta ?? "");
  } else {
    console[level === "error" ? "error" : level === "warn" ? "warn" : "log"](line);
  }
}

async function retryWithBackoff<T>(
  provider: AIProvider,
  fn: (p: AIProvider) => Promise<T>,
  label: string,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await fn(provider);
      if (attempt > 0) {
        log("info", `${provider.name} succeeded on retry ${attempt}`, { provider: provider.name, attempt });
      }
      return result;
    } catch (err) {
      lastError = err;
      if (isFatal(err)) {
        log("error", `${provider.name} fatal error — not retrying`, {
          provider: provider.name,
          error: (err as Error).message,
        });
        throw err;
      }
      if (!isTransient(err)) {
        log("error", `${provider.name} non-transient error — not retrying`, {
          provider: provider.name,
          error: (err as Error).message,
        });
        throw err;
      }
      if (attempt < MAX_RETRIES) {
        const delay = BACKOFF_BASE_MS * Math.pow(2, attempt);
        log("warn", `${provider.name} transient error — retrying in ${delay}ms`, {
          provider: provider.name,
          attempt: attempt + 1,
          error: (err as Error).message,
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
    this.providers = providers ?? this.buildDefaultProviders();
  }

  private buildDefaultProviders(): AIProvider[] {
    const list: AIProvider[] = [];
    if (process.env.GEMINI_API_KEY) {
      list.push(new GeminiProvider());
    }
    if (process.env.OPENROUTER_API_KEY) {
      list.push(new OpenRouterProvider());
    }
    if (list.length === 0) {
      list.push(new GeminiProvider());
    }
    return list;
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
): Promise<string> {
  return getService().generateText({ prompt, systemInstruction, model });
}

export async function aiGenerateJson<T>(
  prompt: string,
  systemInstruction: string,
  model?: string,
): Promise<T> {
  return getService().generateJson<T>({ prompt, systemInstruction, model, json: true });
}

export { AIServiceImpl };
