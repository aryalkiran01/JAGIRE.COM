import type { AITask } from "./types";

export const OLLAMA_TIMEOUT_MS = 120_000;

// Model constants — all overridable via env vars
const DEFAULT_FAST = "llama3.2";       // for analysis, extraction, scoring
const DEFAULT_GENERATIVE = "qwen3";    // for generation: cover letters, questions, suggestions
const DEFAULT_EMBEDDING = "mxbai-embed-large";
// deepseek-r1 is kept as an optional future model; set OLLAMA_REASONING_MODEL to activate it

const TASK_TO_CATEGORY: Record<AITask, "generative" | "fast" | "embedding"> = {
  // ── fast analysis tasks (llama3.2) ──────────────────────────────────────
  "resume-analysis": "fast",
  "ats-score": "fast",
  grammar: "fast",
  "resume-summary": "fast",
  "skill-extraction": "fast",
  "experience-analysis": "fast",
  "education-analysis": "fast",
  "keyword-detection": "fast",
  "missing-skills": "fast",
  "job-matching": "fast",
  "strength-weakness": "fast",
  "job-recommendation": "fast",
  "learning-recommendations": "fast",
  "linkedin-import": "fast",
  fast: "fast",

  // ── generative tasks (qwen3) ─────────────────────────────────────────────
  "resume-improvement": "generative",
  "cover-letter": "generative",
  "interview-questions": "generative",
  "candidate-ranking": "generative",
  "career-suggestions": "generative",
  "hiring-recommendation": "generative",
  "company-candidate-analysis": "generative",
  "career-coach": "generative",
  reasoning: "generative",
  general: "generative",

  // ── embeddings ───────────────────────────────────────────────────────────
  embedding: "embedding",
};

export function resolveOllamaModel(task: AITask | "embedding"): string {
  const category = TASK_TO_CATEGORY[task as AITask] ?? "fast";
  switch (category) {
    case "generative":
      return process.env.OLLAMA_CHAT_MODEL ?? DEFAULT_GENERATIVE;
    case "embedding":
      return process.env.OLLAMA_EMBEDDING_MODEL ?? DEFAULT_EMBEDDING;
    case "fast":
    default:
      return process.env.OLLAMA_FAST_MODEL ?? DEFAULT_FAST;
  }
}

export function getOllamaModelCategory(task: AITask): string {
  return TASK_TO_CATEGORY[task] ?? "fast";
}
