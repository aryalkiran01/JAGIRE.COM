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

  // Attempt 2: extract outermost JSON object
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1)) as T;
    } catch {
      /* continue */
    }
  }

  // Attempt 3: extract outermost JSON array
  const firstBracket = cleaned.indexOf("[");
  const lastBracket = cleaned.lastIndexOf("]");
  if (firstBracket !== -1 && lastBracket > firstBracket) {
    try {
      return JSON.parse(cleaned.slice(firstBracket, lastBracket + 1)) as T;
    } catch {
      /* continue */
    }
  }

  // Attempt 4: fix common syntax issues (trailing commas, unescaped newlines in strings, single quotes)
  try {
    const fixed = cleaned
      .replace(/,\s*([}\]])/g, "$1")
      .replace(/'/g, '"');
    return JSON.parse(fixed) as T;
  } catch {
    /* continue */
  }

  // Attempt 5: Repair truncated JSON by closing unclosed quotes, brackets, and braces
  try {
    let candidate = cleaned.slice(firstBrace !== -1 ? firstBrace : 0);
    // If odd number of unescaped quotes, close the open string
    const quoteMatches = candidate.match(/(?<!\\)"/g);
    if (quoteMatches && quoteMatches.length % 2 !== 0) {
      candidate += '"';
    }
    // Remove any trailing dangling comma or colon
    candidate = candidate.replace(/[:,]\s*$/, "");

    // Count open vs close braces and brackets
    const openBraces = (candidate.match(/\{/g) || []).length;
    const closeBraces = (candidate.match(/\}/g) || []).length;
    const openBrackets = (candidate.match(/\[/g) || []).length;
    const closeBrackets = (candidate.match(/\]/g) || []).length;

    for (let i = 0; i < openBrackets - closeBrackets; i++) {
      candidate += "]";
    }
    for (let i = 0; i < openBraces - closeBraces; i++) {
      candidate += "}";
    }

    return JSON.parse(candidate) as T;
  } catch {
    /* final throw */
  }

  throw new AIFatalError("AI returned invalid JSON");
}
