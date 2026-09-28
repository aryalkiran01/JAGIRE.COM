// LOCAL DEVELOPMENT ONLY — Ollama Provider for offline local AI execution
import { Ollama } from "ollama";
import type { ChatRequest } from "ollama";
import { AIProvider, AIRequest, AIEmbeddingRequest, AIEmbeddingResponse } from "./types";
import { classifyError, safeJsonParse } from "./errors";
import { resolveOllamaModel } from "./ollama-models";
import { AI_CONFIG } from "./config";

function host(): string {
  return process.env.OLLAMA_HOST ?? "http://localhost:11434";
}

let client: Ollama | null = null;

function getClient(): Ollama {
  if (!client) {
    client = new Ollama({ host: host() });
  }
  return client;
}

function buildMessages(req: AIRequest): Array<{ role: "system" | "user"; content: string }> {
  const messages: Array<{ role: "system" | "user"; content: string }> = [];
  if (req.systemInstruction) {
    messages.push({ role: "system", content: req.systemInstruction });
  }
  messages.push({ role: "user", content: req.prompt });
  return messages;
}

function pickModel(req: AIRequest): string {
  if (req.model) {
    return String(req.model);
  }
  const resolvedModel = resolveOllamaModel(req.task ?? "general");
  return String(resolvedModel);
}

async function callChat(req: AIRequest, json: boolean): Promise<string> {
  const model = pickModel(req);
  const messages = buildMessages(req);
  const ollama = getClient();
  const timeoutMs = req.timeoutMs ?? AI_CONFIG.DEFAULT_OLLAMA_TIMEOUT_MS;

  const chatRequest = {
    model: String(model),
    messages,
    stream: false as const,
    options: { temperature: 0.3 },
    ...(json ? { format: "json" as const } : {}),
  } satisfies ChatRequest;

  let response;
  try {
    let timeout: ReturnType<typeof setTimeout>;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeout = setTimeout(() => {
        const error = new Error("Ollama request timed out");
        error.name = "AbortError";
        reject(error);
      }, timeoutMs);
    });
    try {
      response = await Promise.race([ollama.chat(chatRequest), timeoutPromise]);
    } finally {
      clearTimeout(timeout!);
    }
  } catch (e) {
    const err = e as Error;
    if (err.name === "AbortError") {
      throw classifyError(408, "Ollama request timed out", e);
    }
    const msg = err.message ?? "Ollama request failed";
    if (/model.*not.*found|model.*not.*loaded/i.test(msg)) {
      throw classifyError(404, `Ollama model not found: ${model}. Run: ollama pull ${model}`, e);
    }
    if (/connection refused|ECONNREFUSED|fetch failed/i.test(msg)) {
      throw classifyError(
        503,
        `Ollama is not running at ${host()}. Start it with: ollama serve`,
        e,
      );
    }
    throw classifyError(undefined, msg, e);
  }

  const out = response?.message?.content;
  if (!out) throw new Error("Ollama returned no content");
  return out as string;
}

export class OllamaProvider implements AIProvider {
  readonly name = "ollama";

  async generateText(req: AIRequest): Promise<string> {
    return callChat(req, false);
  }

  async generateJson<T>(req: AIRequest): Promise<T> {
    const raw = await callChat(req, true);
    return safeJsonParse<T>(raw);
  }

  async generateEmbedding(req: AIEmbeddingRequest): Promise<AIEmbeddingResponse> {
    const ollama = getClient();
    const model = req.model ?? "nomic-embed-text";
    try {
      const res = await ollama.embeddings({ model, prompt: req.input });
      return {
        embedding: res.embedding,
        provider: "ollama",
        model,
      };
    } catch (e) {
      throw classifyError(undefined, `Ollama embedding failed: ${(e as Error).message}`, e);
    }
  }
}
