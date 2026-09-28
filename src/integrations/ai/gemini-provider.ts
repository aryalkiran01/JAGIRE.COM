import { AIProvider, AIRequest, AIEmbeddingRequest, AIEmbeddingResponse } from "./types";
import { classifyError, safeJsonParse } from "./errors";
import { AI_CONFIG } from "./config";

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models";
export const DEFAULT_GEMINI_MODEL = "gemini-3.1-flash-lite";
export const DEFAULT_GEMINI_EMBEDDING_MODEL = "gemini-embedding-001";

const FALLBACK_CANDIDATE_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-3.1-flash-lite-preview",
  "gemini-3.5-flash-lite",
];

const FALLBACK_EMBEDDING_MODELS = ["gemini-embedding-001", "gemini-embedding-2-preview"];

function apiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");
  return key;
}

function resolveModelCandidates(req: AIRequest): string[] {
  const preferred = req.model ?? process.env.GEMINI_MODEL ?? DEFAULT_GEMINI_MODEL;
  const list = [preferred, ...FALLBACK_CANDIDATE_MODELS];
  return Array.from(new Set(list));
}

function resolveEmbeddingModelCandidates(req: AIEmbeddingRequest): string[] {
  const preferred =
    req.model ?? process.env.GEMINI_EMBEDDING_MODEL ?? DEFAULT_GEMINI_EMBEDDING_MODEL;
  const list = [preferred, ...FALLBACK_EMBEDDING_MODELS];
  return Array.from(new Set(list));
}

export class GeminiProvider implements AIProvider {
  readonly name = "gemini";

  async generateText(req: AIRequest): Promise<string> {
    const models = resolveModelCandidates(req);
    const key = apiKey();
    const timeoutMs = req.timeoutMs ?? AI_CONFIG.DEFAULT_PROVIDER_TIMEOUT_MS;
    let lastError: unknown;

    for (const model of models) {
      const url = `${GEMINI_URL}/${model}:generateContent?key=${key}`;
      const body: Record<string, unknown> = {
        contents: [{ role: "user", parts: [{ text: req.prompt }] }],
        generationConfig: {
          temperature: 0.3,
          topK: 1,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      };
      if (req.systemInstruction) {
        body.systemInstruction = { parts: [{ text: req.systemInstruction }] };
      }

      let res: Response;
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        clearTimeout(timer);
      } catch (e) {
        if ((e as Error).name === "AbortError") {
          throw classifyError(408, "Gemini request timed out", e);
        }
        lastError = classifyError(undefined, (e as Error).message, e);
        continue;
      }

      if (!res.ok) {
        const text = await res.text();
        lastError = classifyError(res.status, text);
        // Try next candidate model on 404 (not found) or 503 (temporary high traffic)
        if (res.status === 404 || res.status === 503) {
          if (res.status === 503) {
            await new Promise((r) => setTimeout(r, 400));
          }
          continue;
        }
        throw lastError;
      }

      const data = await res.json();
      const out = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!out) {
        lastError = new Error(`Gemini (${model}) returned no content`);
        continue;
      }
      return out as string;
    }

    throw lastError ?? new Error("Gemini generateText failed across candidate models");
  }

  async generateJson<T>(req: AIRequest): Promise<T> {
    const models = resolveModelCandidates(req);
    const key = apiKey();
    const timeoutMs = req.timeoutMs ?? AI_CONFIG.DEFAULT_PROVIDER_TIMEOUT_MS;
    let lastError: unknown;

    for (const model of models) {
      const url = `${GEMINI_URL}/${model}:generateContent?key=${key}`;
      const isGemma = model.startsWith("gemma-");
      const maxTokens =
        req.task === "resume-analysis" || req.task === "resume-optimizer" || req.task === "full-scan"
          ? 2500
          : (req.maxTokens ?? 1500);

      const generationConfig: Record<string, unknown> = {
        temperature: 0.2,
        topK: 1,
        topP: 0.95,
        maxOutputTokens: maxTokens,
      };

      if (!isGemma) {
        generationConfig.responseMimeType = "application/json";
        if (req.responseSchema) {
          generationConfig.responseSchema = req.responseSchema;
        }
      }

      const body: Record<string, unknown> = {
        contents: [{ role: "user", parts: [{ text: req.prompt }] }],
        ...(req.systemInstruction
          ? { systemInstruction: { parts: [{ text: req.systemInstruction }] } }
          : {}),
        generationConfig,
      };

      let res: Response;
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        clearTimeout(timer);
      } catch (e) {
        if ((e as Error).name === "AbortError") {
          throw classifyError(408, "Gemini request timed out", e);
        }
        lastError = classifyError(undefined, (e as Error).message, e);
        continue;
      }

      if (!res.ok) {
        const text = await res.text();
        lastError = classifyError(res.status, text);
        // Try next candidate model on 404 (not found) or 503 (temporary high traffic)
        if (res.status === 404 || res.status === 503) {
          if (res.status === 503) {
            await new Promise((r) => setTimeout(r, 400));
          }
          continue;
        }
        throw lastError;
      }

      const data = await res.json();
      const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!raw) {
        lastError = new Error(`Gemini (${model}) returned no content`);
        continue;
      }
      try {
        return safeJsonParse<T>(raw);
      } catch (parseErr) {
        lastError = parseErr;
        continue;
      }
    }

    throw lastError ?? new Error("Gemini generateJson failed across candidate models");
  }

  async generateEmbedding(req: AIEmbeddingRequest): Promise<AIEmbeddingResponse> {
    const models = resolveEmbeddingModelCandidates(req);
    const key = apiKey();
    const timeoutMs = req.timeoutMs ?? AI_CONFIG.DEFAULT_PROVIDER_TIMEOUT_MS;
    let lastError: unknown;

    for (const model of models) {
      const url = `${GEMINI_URL}/${model}:embedContent?key=${key}`;
      const body = {
        model: `models/${model}`,
        content: { parts: [{ text: req.input }] },
      };

      let res: Response;
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        clearTimeout(timer);
      } catch (e) {
        lastError = classifyError(undefined, (e as Error).message, e);
        continue;
      }

      if (!res.ok) {
        const text = await res.text();
        lastError = classifyError(res.status, text);
        if (res.status === 404 || res.status === 503) {
          continue;
        }
        throw lastError;
      }

      const data = await res.json();
      const embedding = data?.embedding?.values;
      if (!Array.isArray(embedding) || embedding.length === 0) {
        lastError = new Error(`Gemini (${model}) returned invalid embedding`);
        continue;
      }

      return {
        embedding,
        provider: "gemini",
        model,
      };
    }

    throw lastError ?? new Error("Gemini generateEmbedding failed across all candidate models");
  }
}
