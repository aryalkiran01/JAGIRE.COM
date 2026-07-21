/**
 * Gemini API helper — SERVER ONLY.
 * Direct calls to Google's Generative AI REST API.
 * Requires GEMINI_API_KEY environment variable.
 */

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";

function apiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");
  return key;
}

export interface GeminiMessage {
  role: "user" | "model";
  parts: string;
}

/**
 * Call Gemini and return the text response.
 */
export async function generateText(
  prompt: string,
  systemInstruction?: string,
  model = "gemini-2.0-flash",
): Promise<string> {
  const url = `${GEMINI_URL}/${model}:generateContent?key=${apiKey()}`;
  const body: Record<string, unknown> = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  };
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    if (res.status === 429) throw new Error("AI rate limit — please try again shortly.");
    if (res.status === 400 && /API key not valid/i.test(text)) {
      throw new Error("Gemini API key is invalid. Set GEMINI_API_KEY.");
    }
    throw new Error(`Gemini error (${res.status}): ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  const out = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!out) throw new Error("Gemini returned no content");
  return out as string;
}

/**
 * Call Gemini with a system instruction that demands JSON output,
 * and parse the response into the requested shape.
 */
export async function generateJson<T>(
  prompt: string,
  systemInstruction: string,
  model = "gemini-2.0-flash",
): Promise<T> {
  const url = `${GEMINI_URL}/${model}:generateContent?key=${apiKey()}`;
  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: systemInstruction }] },
    generationConfig: {
      responseMimeType: "application/json",
    },
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    if (res.status === 429) throw new Error("AI rate limit — please try again shortly.");
    throw new Error(`Gemini error (${res.status}): ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error("Gemini returned no content");
  return safeJson<T>(raw);
}

function safeJson<T>(text: string): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    const m = text.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        return JSON.parse(m[0]) as T;
      } catch {
        /* noop */
      }
    }
    throw new Error("AI returned invalid JSON");
  }
}
