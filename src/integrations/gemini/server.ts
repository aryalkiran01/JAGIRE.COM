/**
 * Gemini API helper — SERVER ONLY.
 *
 * This module is kept for backward compatibility.
 * All AI calls now route through the centralized AIService
 * (src/integrations/ai/ai-service.ts), which provides automatic
 * retry with exponential backoff and fallback to DeepSeek when
 * Gemini hits rate limits, quota, or transient errors.
 *
 * Gemini remains the primary provider; DeepSeek is the fallback.
 */

export { aiGenerateText as generateText } from "@/integrations/ai/ai-service";
export { aiGenerateJson as generateJson } from "@/integrations/ai/ai-service";
