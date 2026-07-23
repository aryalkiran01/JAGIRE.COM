/**
 * AI helper — SERVER ONLY.
 *
 * This module is kept for backward compatibility.
 * All AI calls route through the centralized AIService
 * (src/integrations/ai/ai-service.ts), which provides automatic
 * retry with exponential backoff and fallback between Gemini
 * and OpenRouter when a provider hits rate limits, quota,
 * or transient errors.
 */

export { aiGenerateText as generateText } from "@/integrations/ai/ai-service";
export { aiGenerateJson as generateJson } from "@/integrations/ai/ai-service";
