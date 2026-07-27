import { Ollama } from "ollama";
import type { ChatRequest } from "ollama";
import { AIProvider, AIRequest, AIEmbeddingRequest, AIEmbeddingResponse, AITask } from "./types";
import { classifyError, safeJsonParse } from "./errors";
import { resolveOllamaModel, OLLAMA_TIMEOUT_MS } from "./ollama-models";

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
  // Ensure we always return a string
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

  // Build the request with explicit typing to match Ollama's overloads
  const chatRequest = {
    model: String(model),
    messages,
    stream: false as const, // Use 'as const' to make it literal type 'false'
    options: { temperature: 0.3 },
    ...(json ? { format: "json" as const } : {}),
  } satisfies ChatRequest; // Use 'satisfies' for type checking without widening

  let response;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);
    response = await ollama.chat(chatRequest);
    clearTimeout(timer);
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
    const systemWithJson =
      (req.systemInstruction ?? "") +
      "\n\nReturn ONLY valid JSON, no markdown fences, no commentary.";
    const raw = await callChat({ ...req, systemInstruction: systemWithJson }, true);
    return safeJsonParse<T>(raw);
  }

  async generateEmbedding(req: AIEmbeddingRequest): Promise<AIEmbeddingResponse> {
    const model = String(req.model ?? resolveOllamaModel("embedding"));
    const ollama = getClient();
    try {
      const res = await ollama.embeddings({ model, prompt: req.input });
      return { embedding: res.embedding, provider: this.name, model };
    } catch (e) {
      const msg = (e as Error).message ?? "Ollama embedding failed";
      if (/model.*not.*found/i.test(msg)) {
        throw classifyError(
          404,
          `Ollama embedding model not found: ${model}. Run: ollama pull ${model}`,
          e,
        );
      }
      throw classifyError(undefined, msg, e);
    }
  }
}
