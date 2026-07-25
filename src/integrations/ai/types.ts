export type AITask =
  | "resume-analysis"
  | "ats-score"
  | "grammar"
  | "resume-improvement"
  | "resume-summary"
  | "skill-extraction"
  | "experience-analysis"
  | "education-analysis"
  | "keyword-detection"
  | "missing-skills"
  | "job-matching"
  | "candidate-ranking"
  | "cover-letter"
  | "interview-questions"
  | "career-suggestions"
  | "strength-weakness"
  | "hiring-recommendation"
  | "job-recommendation"
  | "company-candidate-analysis"
  | "linkedin-import"
  | "learning-recommendations"
  | "career-coach"
  | "career-assistant"
  | "reasoning"
  | "fast"
  | "general";

export interface AIRequest {
  prompt: string;
  systemInstruction?: string;
  model?: string;
  task?: AITask;
  json?: boolean;
}

export interface AIResponse {
  text: string;
  provider: string;
  model?: string;
  latencyMs?: number;
  tokensUsed?: number;
}

export interface AIEmbeddingRequest {
  input: string;
  model?: string;
}

export interface AIEmbeddingResponse {
  embedding: number[];
  provider: string;
  model: string;
}

export class AITransientError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly isTransient = true,
    public readonly retryable = true,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "AITransientError";
  }
}

export class AIFatalError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "AIFatalError";
  }
}

export type AIError = AITransientError | AIFatalError;

export interface AIProvider {
  readonly name: string;
  generateText(req: AIRequest): Promise<string>;
  generateJson<T>(req: AIRequest): Promise<T>;
  generateEmbedding?(req: AIEmbeddingRequest): Promise<AIEmbeddingResponse>;
}
