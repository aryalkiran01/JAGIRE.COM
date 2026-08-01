import { AIFatalError, AITransientError } from "./types";

const TRANSIENT_STATUS_CODES = new Set([429, 500, 502, 503, 408]);
const TRANSIENT_PATTERNS = [
  /rate.?limit/i,
  /RESOURCE_EXHAUSTED/i,
  /quota/i,
  /timeout/i,
  /temporarily/i,
  /overloaded/i,
  /service unavailable/i,
  /internal error/i,
  /bad gateway/i,
  /ECONNRESET/i,
  /ECONNREFUSED/i,
  /ETIMEDOUT/i,
  /ENOTFOUND/i,
  /fetch failed/i,
  /network/i,
];

const FATAL_PATTERNS = [
  /API key not valid/i,
  /invalid.?api.?key/i,
  /unauthorized/i,
  /forbidden/i,
  /permission denied/i,
  /invalid request/i,
  /malformed/i,
  /bad request/i,
];

export function classifyError(status: number | undefined, body: string, cause?: unknown): Error {
  const text = `${status ?? ""} ${body}`;
  if (status !== undefined && FATAL_PATTERNS.some((p) => p.test(text))) {
    return new AIFatalError(`AI fatal error (${status}): ${body.slice(0, 200)}`, status, cause);
  }
  if (status === 400 && /API key not valid/i.test(body)) {
    return new AIFatalError("Gemini API key is invalid. Set GEMINI_API_KEY.", status, cause);
  }
  if (
    (status !== undefined && TRANSIENT_STATUS_CODES.has(status)) ||
    TRANSIENT_PATTERNS.some((p) => p.test(text))
  ) {
    return new AITransientError(
      `AI transient error (${status ?? "unknown"}): ${body.slice(0, 200)}`,
      status,
      true,
      true,
      cause,
    );
  }
  if (cause instanceof Error && TRANSIENT_PATTERNS.some((p) => p.test(cause.message))) {
    return new AITransientError(`AI network error: ${cause.message}`, undefined, true, true, cause);
  }
  return new AIFatalError(
    `AI error (${status ?? "unknown"}): ${body.slice(0, 200)}`,
    status,
    cause,
  );
}

export function isTransient(err: unknown): boolean {
  return err instanceof AITransientError;
}

export function isFatal(err: unknown): boolean {
  return err instanceof AIFatalError;
}

export function safeJsonParse<T>(text: string): T {
  if (!text || !text.trim()) {
    throw new AIFatalError("AI returned empty response");
  }

  let cleaned = text.trim();

  // Strip markdown code fences (```json ... ``` or ``` ... ```)
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  // Attempt 1: direct parse
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    /* continue to fallbacks */
  }

  // Attempt 2: extract first JSON object
  const objMatch = cleaned.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try {
      return JSON.parse(objMatch[0]) as T;
    } catch {
      /* continue */
    }
  }

  // Attempt 3: extract first JSON array
  const arrMatch = cleaned.match(/\[[\s\S]*\]/);
  if (arrMatch) {
    try {
      return JSON.parse(arrMatch[0]) as T;
    } catch {
      /* continue */
    }
  }

  // Attempt 4: fix common issues (trailing commas, single quotes)
  const fixed = cleaned.replace(/,\s*([}\]])/g, "$1").replace(/'/g, '"');
  try {
    return JSON.parse(fixed) as T;
  } catch {
    /* continue */
  }

  throw new AIFatalError("AI returned invalid JSON");
}
