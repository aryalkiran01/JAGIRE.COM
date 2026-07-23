import { AIProvider, AIRequest } from "./types";
import { classifyError, safeJsonParse } from "./errors";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "google/gemma-4-31b-it:free";

function apiKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY is not set");
  return key;
}

export class OpenRouterProvider implements AIProvider {
  readonly name = "openrouter";

  async generateText(req: AIRequest): Promise<string> {
    const model = req.model ?? DEFAULT_MODEL;
    const messages: Array<{ role: string; content: string }> = [];
    if (req.systemInstruction) {
      messages.push({ role: "system", content: req.systemInstruction });
    }
    messages.push({ role: "user", content: req.prompt });

    let res: Response;
    try {
      res = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey()}`,
        },
        body: JSON.stringify({
          model,
          messages,
          stream: false,
          reasoning: { enabled: true },
        }),
      });
    } catch (e) {
      throw classifyError(undefined, (e as Error).message, e);
    }

    if (!res.ok) {
      const text = await res.text();
      throw classifyError(res.status, text);
    }

    const data = await res.json();
    const out = data?.choices?.[0]?.message?.content;
    if (!out) throw new Error("OpenRouter returned no content");
    return out as string;
  }

  async generateJson<T>(req: AIRequest): Promise<T> {
    const model = req.model ?? DEFAULT_MODEL;
    const systemMsg =
      (req.systemInstruction ?? "") + "\n\nReturn ONLY valid JSON, no markdown fences.";
    const messages: Array<{ role: string; content: string }> = [
      { role: "system", content: systemMsg },
      { role: "user", content: req.prompt },
    ];

    let res: Response;
    try {
      res = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey()}`,
        },
        body: JSON.stringify({
          model,
          messages,
          stream: false,
          response_format: { type: "json_object" },
          reasoning: { enabled: true },
        }),
      });
    } catch (e) {
      throw classifyError(undefined, (e as Error).message, e);
    }

    if (!res.ok) {
      const text = await res.text();
      throw classifyError(res.status, text);
    }

    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content;
    if (!raw) throw new Error("OpenRouter returned no content");
    return safeJsonParse<T>(raw);
  }
}
