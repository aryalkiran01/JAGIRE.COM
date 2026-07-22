import { AIProvider, AIRequest } from "./types";
import { classifyError, safeJsonParse } from "./errors";

const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";
const DEFAULT_MODEL = "deepseek-chat";

function apiKey(): string {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) throw new Error("DEEPSEEK_API_KEY is not set");
  return key;
}

export class DeepSeekProvider implements AIProvider {
  readonly name = "deepseek";

  async generateText(req: AIRequest): Promise<string> {
    const model = req.model ?? DEFAULT_MODEL;
    const messages: Array<{ role: string; content: string }> = [];
    if (req.systemInstruction) {
      messages.push({ role: "system", content: req.systemInstruction });
    }
    messages.push({ role: "user", content: req.prompt });

    let res: Response;
    try {
      res = await fetch(DEEPSEEK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey()}`,
        },
        body: JSON.stringify({ model, messages, stream: false }),
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
    if (!out) throw new Error("DeepSeek returned no content");
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
      res = await fetch(DEEPSEEK_URL, {
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
    if (!raw) throw new Error("DeepSeek returned no content");
    return safeJsonParse<T>(raw);
  }
}
