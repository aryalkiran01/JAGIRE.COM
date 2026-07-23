export interface AIRequest {
  prompt: string;
  systemInstruction?: string;
  model?: string;
  json?: boolean;
}

export interface AIResponse {
  text: string;
  provider: string;
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
}
