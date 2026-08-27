import { AIProvider, AIRequest } from "./types";
import { classifyError, safeJsonParse } from "./errors";

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_MODEL = "gemini-3.5-flash-lite";
const GEMINI_TIMEOUT_MS = 25_000;

function apiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");
  return key;
}

function resolveModel(req: AIRequest): string {
  return req.model ?? process.env.GEMINI_MODEL ?? DEFAULT_MODEL;
}

export class GeminiProvider implements AIProvider {
  readonly name = "gemini";

  async generateText(req: AIRequest): Promise<string> {
    const model = resolveModel(req);
    const url = `${GEMINI_URL}/${model}:generateContent?key=${apiKey()}`;
    const body: Record<string, unknown> = {
      contents: [{ role: "user", parts: [{ text: req.prompt }] }],
      generationConfig: {
        temperature: 0.3,
        topK: 1,
        topP: 0.95,
      },
    };
    if (req.systemInstruction) {
      body.systemInstruction = { parts: [{ text: req.systemInstruction }] };
    }

    let res: Response;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);
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
      throw classifyError(undefined, (e as Error).message, e);
    }

    if (!res.ok) {
      const text = await res.text();
      throw classifyError(res.status, text);
    }

    const data = await res.json();
    const out = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!out) throw new Error("Gemini returned no content");
    return out as string;
  }

  async generateJson<T>(req: AIRequest): Promise<T> {
    const model = resolveModel(req);
    const url = `${GEMINI_URL}/${model}:generateContent?key=${apiKey()}`;
    const body = {
      contents: [{ role: "user", parts: [{ text: req.prompt }] }],
      ...(req.systemInstruction
        ? { systemInstruction: { parts: [{ text: req.systemInstruction }] } }
        : {}),
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.3,
        topK: 1,
        topP: 0.95,
      },
    };

    let res: Response;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);
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
      throw classifyError(undefined, (e as Error).message, e);
    }

    if (!res.ok) {
      const text = await res.text();
      throw classifyError(res.status, text);
    }

    const data = await res.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) throw new Error("Gemini returned no content");
    return safeJsonParse<T>(raw);
  }
}
