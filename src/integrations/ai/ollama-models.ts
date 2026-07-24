import type { AITask } from "./types";

export const OLLAMA_TIMEOUT_MS = 120_000;

const DEFAULT_CHAT = "qwen3";
const DEFAULT_REASONING = "deepseek-r1";
const DEFAULT_FAST = "llama3.2";
const DEFAULT_EMBEDDING = "mxbai-embed-large";

const TASK_TO_CATEGORY: Record<AITask, "chat" | "reasoning" | "fast" | "embedding"> = {
  "resume-analysis": "chat",
  "ats-score": "chat",
  grammar: "fast",
  "resume-improvement": "chat",
  "resume-summary": "fast",
  "skill-extraction": "fast",
  "experience-analysis": "chat",
  "education-analysis": "fast",
  "keyword-detection": "fast",
  "missing-skills": "chat",
  "job-matching": "chat",
  "candidate-ranking": "reasoning",
  "cover-letter": "chat",
  "interview-questions": "chat",
  "career-suggestions": "reasoning",
  "strength-weakness": "chat",
  "hiring-recommendation": "reasoning",
  "job-recommendation": "chat",
  "company-candidate-analysis": "reasoning",
  "linkedin-import": "fast",
  "learning-recommendations": "chat",
  reasoning: "reasoning",
  fast: "fast",
  general: "chat",
};

export function resolveOllamaModel(task: AITask): string {
  const category = TASK_TO_CATEGORY[task] ?? "chat";
  switch (category) {
    case "reasoning":
      return process.env.OLLAMA_REASONING_MODEL ?? DEFAULT_REASONING;
    case "fast":
      return process.env.OLLAMA_FAST_MODEL ?? DEFAULT_FAST;
    case "embedding":
      return process.env.OLLAMA_EMBEDDING_MODEL ?? DEFAULT_EMBEDDING;
    case "chat":
    default:
      return process.env.OLLAMA_CHAT_MODEL ?? DEFAULT_CHAT;
  }
}

export function getOllamaModelCategory(task: AITask): string {
  return TASK_TO_CATEGORY[task] ?? "chat";
}
