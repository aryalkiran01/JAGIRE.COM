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

export function classifyError(
  status: number | undefined,
  body: string,
  cause?: unknown,
): Error {
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
  return new AIFatalError(`AI error (${status ?? "unknown"}): ${body.slice(0, 200)}`, status, cause);
}

export function isTransient(err: unknown): boolean {
  return err instanceof AITransientError;
}

export function isFatal(err: unknown): boolean {
  return err instanceof AIFatalError;
}

export function safeJsonParse<T>(text: string): T {
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
    throw new AIFatalError("AI returned invalid JSON");
  }
}
