/**
 * Centralized AI Configuration & Timeout Policy
 *
 * Enforces strict, unified budgets, timeouts, retries, and fallback rules
 * across ALL Job Seeker, Employer, and AI Assistant features.
 *
 * ROOT CAUSE FIX (408 timeouts):
 * Previously, Ollama had a 24s timeout matching Gemini. When Ollama was slow
 * (model loading, large generation), it consumed most of the 30s total budget,
 * leaving Gemini fallback with < 6s — causing cascading 408 AbortErrors.
 *
 * Solution: Total budget = 45s, Ollama capped at 15s for fast fail-to-fallback,
 * Gemini keeps 24s, fallback budget raised to 8s to ensure real execution time.
 */

export const AI_CONFIG = {
  // Total end-to-end operation budget across all providers, retries, and fallbacks
  // 45s accommodates: Ollama attempt (up to 15s) + Gemini fallback (up to 24s) + overhead
  TOTAL_OPERATION_TIMEOUT_MS: 45_000,

  // Single Gemini HTTP request timeout — flash-lite needs 8-15s for complex structured JSON
  DEFAULT_PROVIDER_TIMEOUT_MS: 24_000,

  // Ollama local dev timeout — capped at 15s to ensure fast fail-to-fallback
  // If Ollama can't respond in 15s, Gemini gets the remaining ~28s budget
  DEFAULT_OLLAMA_TIMEOUT_MS: 15_000,

  // Maximum schema validation retries with explicit error feedback (exactly 1 targeted retry)
  VALIDATION_RETRY_LIMIT: 1,

  // Delay before executing a targeted validation correction attempt (in ms)
  VALIDATION_BACKOFF_MS: 300,

  // Provider-level network retries for the SAME provider (0 to prevent retry storms on dead/hanging endpoints)
  PROVIDER_NETWORK_RETRIES: 0,

  // Minimum remaining budget required before attempting a fallback provider call
  // Raised from 5s to 8s — Gemini flash-lite needs at least 8s for structured JSON output
  MIN_FALLBACK_BUDGET_MS: 8_000,

  // Response cache configuration
  CACHE_TTL_MS: 5 * 60 * 1000,
  MAX_CACHE_ENTRIES: 200,
} as const;
