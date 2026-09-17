/**
 * Production Rate Limiter Utility
 *
 * Implements a sliding-window algorithm for server functions and API handlers.
 * Designed to prevent abuse across Auth, AI generation, OCR file parsing,
 * and Payment verification endpoints.
 */

interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Periodic garbage collection to prevent memory leaks in long-running processes
const GC_INTERVAL_MS = 60_000;
let lastGc = Date.now();

function cleanupExpiredRecords(windowMs: number) {
  const now = Date.now();
  if (now - lastGc < GC_INTERVAL_MS) return;
  lastGc = now;

  for (const [key, record] of rateLimitStore.entries()) {
    const valid = record.timestamps.filter((ts) => now - ts < windowMs);
    if (valid.length === 0) {
      rateLimitStore.delete(key);
    } else {
      record.timestamps = valid;
    }
  }
}

export interface RateLimitOptions {
  /** Maximum number of requests allowed within the window */
  maxRequests: number;
  /** Window duration in milliseconds */
  windowMs: number;
  /** Custom error message when limit is exceeded */
  message?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
  error?: string;
}

/**
 * Checks and increments the rate limit for a given key (e.g. `auth:ip`, `ai:userId`, `ocr:userId`).
 */
export function checkRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  cleanupExpiredRecords(options.windowMs);

  let record = rateLimitStore.get(key);
  if (!record) {
    record = { timestamps: [] };
    rateLimitStore.set(key, record);
  }

  // Filter out timestamps outside the current sliding window
  record.timestamps = record.timestamps.filter((ts) => now - ts < options.windowMs);

  if (record.timestamps.length >= options.maxRequests) {
    const oldestTimestamp = record.timestamps[0] ?? now;
    const resetMs = Math.max(0, options.windowMs - (now - oldestTimestamp));

    return {
      allowed: false,
      remaining: 0,
      resetMs,
      error: options.message || `Rate limit exceeded. Please wait ${Math.ceil(resetMs / 1000)} seconds.`,
    };
  }

  record.timestamps.push(now);

  return {
    allowed: true,
    remaining: options.maxRequests - record.timestamps.length,
    resetMs: options.windowMs,
  };
}

/**
 * Enforces rate limit or throws an Error with status 429 semantics for server functions.
 */
export function enforceRateLimit(key: string, options: RateLimitOptions): void {
  const result = checkRateLimit(key, options);
  if (!result.allowed) {
    throw new Error(`RATE_LIMIT_EXCEEDED: ${result.error}`);
  }
}

/**
 * Standard rate limiting presets across Jagire.com
 */
export const RATE_LIMIT_PRESETS = {
  AUTH: { maxRequests: 10, windowMs: 60_000, message: "Too many authentication requests. Please wait a moment." },
  AI: { maxRequests: 20, windowMs: 60_000, message: "AI rate limit reached. Please wait a minute before sending another request." },
  OCR: { maxRequests: 5, windowMs: 60_000, message: "Document parsing limit reached. Please wait before uploading more resumes." },
  PAYMENT: { maxRequests: 10, windowMs: 60_000, message: "Payment verification limit reached. Verification is in progress." },
  FEED: { maxRequests: 30, windowMs: 60_000, message: "You are posting or commenting too quickly. Please slow down." },
} as const;
