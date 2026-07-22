import { AIProvider, AIRequest } from "./types";
import { classifyError, safeJsonParse } from "./errors";

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_MODEL = "gemini-2.0-flash";

function apiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");
  return key;
}

export class GeminiProvider implements AIProvider {
  readonly name = "gemini";

  async generateText(req: AIRequest): Promise<string> {
    const model = req.model ?? DEFAULT_MODEL;
    const url = `${GEMINI_URL}/${model}:generateContent?key=${apiKey()}`;
    const body: Record<string, unknown> = {
      contents: [{ role: "user", parts: [{ text: req.prompt }] }],
    };
    if (req.systemInstruction) {
      body.systemInstruction = { parts: [{ text: req.systemInstruction }] };
    }

    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (e) {
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
    const model = req.model ?? DEFAULT_MODEL;
    const url = `${GEMINI_URL}/${model}:generateContent?key=${apiKey()}`;
    const body = {
      contents: [{ role: "user", parts: [{ text: req.prompt }] }],
      ...(req.systemInstruction
        ? { systemInstruction: { parts: [{ text: req.systemInstruction }] } }
        : {}),
      generationConfig: { responseMimeType: "application/json" },
    };

    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (e) {
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
