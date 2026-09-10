export {
  aiGenerateText,
  aiGenerateJson,
  aiGenerateJsonValidated,
  aiGenerateEmbedding,
  getAIProviders,
  AIServiceImpl,
} from "./ai-service";
export { GeminiProvider } from "./gemini-provider";
export { OllamaProvider } from "./ollama-provider";
export { zodToGeminiSchema, zodToSchemaShapeDescription } from "./schema-converter";
export type { GeminiSchema } from "./schema-converter";
export { resolveOllamaModel, getOllamaModelCategory, OLLAMA_TIMEOUT_MS } from "./ollama-models";
export {
  resumeAnalysisSchema,
  fullResumeScanSchema,
  careerRecommendationsSchema,
  linkedinImportSchema,
  learningRecommendationsSchema,
  coverLetterSchema,
  interviewQuestionsSchema,
  candidateRankingSchema,
  jobMatchingSchema,
  hiringRecommendationSchema,
  strengthWeaknessSchema,
  companyCandidateAnalysisSchema,
  careerCoachResponseSchema,
} from "./schemas";
export type {
  AIProvider,
  AIRequest,
  AIResponse,
  AIError,
  AITransientError,
  AIFatalError,
  AITask,
  AIEmbeddingRequest,
  AIEmbeddingResponse,
} from "./types";
