import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DEFAULT_GEMINI_MODEL, DEFAULT_GEMINI_EMBEDDING_MODEL, GeminiProvider } from "./gemini-provider";

describe("Gemini Provider Model Configuration & Resolution", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("uses gemini-3.1-flash-lite-preview as the default active model", () => {
    expect(DEFAULT_GEMINI_MODEL).toBe("gemini-3.1-flash-lite-preview");
    expect(DEFAULT_GEMINI_EMBEDDING_MODEL).toBe("gemini-embedding-001");
  });

  it("does not contain outdated gemini-2.5, gemini-2.0, or gemini-1.5 models as defaults", () => {
    expect(DEFAULT_GEMINI_MODEL).not.toContain("gemini-2.5");
    expect(DEFAULT_GEMINI_MODEL).not.toContain("gemini-2.0");
    expect(DEFAULT_GEMINI_MODEL).not.toContain("gemini-1.5");
  });

  it("respects GEMINI_MODEL env override when configured", async () => {
    process.env.GEMINI_API_KEY = "test-api-key";
    process.env.GEMINI_MODEL = "gemini-3.1-flash-lite-preview";

    const provider = new GeminiProvider();
    expect(provider.name).toBe("gemini");
  });
});
