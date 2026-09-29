import { describe, it, expect } from "vitest";
import { coverLetterGeneratorSchema } from "@/integrations/ai/jobseeker-ai-schemas";
import { zodToGeminiSchema, zodToSchemaShapeDescription } from "@/integrations/ai/schema-converter";
import { isTrivialInput, getTrivialJobSeekerResponse } from "@/integrations/ai/trivial-intent";

describe("AI Cover Letter Generator: Schema, Normalization & Intent Handling", () => {
  it("validates a compliant cover letter response object", () => {
    const raw = {
      cover_letter: "Dear Hiring Manager,\n\nI am thrilled to apply for the Senior React Developer role...",
      tone: "professional",
      word_count: 280,
      key_strengths_highlighted: ["React Architecture", "TypeScript", "Performance Tuning"],
    };

    const parsed = coverLetterGeneratorSchema.parse(raw);
    expect(parsed.cover_letter).toContain("Dear Hiring Manager");
    expect(parsed.tone).toBe("professional");
    expect(parsed.word_count).toBe(280);
    expect(parsed.key_strengths_highlighted).toHaveLength(3);
  });

  it("handles string word_count (e.g. '300 words') gracefully via transform", () => {
    const raw = {
      cover_letter: "Dear Team,\n\nI am writing to express my strong interest in the role...",
      word_count: "350 words",
    };

    const parsed = coverLetterGeneratorSchema.parse(raw);
    expect(parsed.word_count).toBe(350);
    expect(parsed.tone).toBe("professional");
    expect(parsed.key_strengths_highlighted).toEqual([]);
  });

  it("falls back to default values when optional/default fields are omitted", () => {
    const raw = {
      cover_letter: "Application letter text here...",
    };

    const parsed = coverLetterGeneratorSchema.parse(raw);
    expect(parsed.cover_letter).toBe("Application letter text here...");
    expect(parsed.tone).toBe("professional");
    expect(parsed.word_count).toBe(0);
    expect(parsed.key_strengths_highlighted).toEqual([]);
  });

  it("converts Zod schema to Gemini OpenAPI schema without marking defaulted fields as required", () => {
    const geminiSchema = zodToGeminiSchema(coverLetterGeneratorSchema);
    expect(geminiSchema.type).toBe("OBJECT");
    expect(geminiSchema.required).toBeDefined();
    // Only cover_letter should be strictly required; tone, word_count, and key_strengths_highlighted have defaults
    expect(geminiSchema.required).toContain("cover_letter");
    expect(geminiSchema.required).not.toContain("tone");
    expect(geminiSchema.required).not.toContain("word_count");
    expect(geminiSchema.required).not.toContain("key_strengths_highlighted");
  });

  it("generates a valid schema shape description for system prompts", () => {
    const shapeDesc = zodToSchemaShapeDescription(coverLetterGeneratorSchema);
    expect(shapeDesc).toContain("cover_letter");
    expect(shapeDesc).toContain("string");
  });

  it("identifies trivial greetings and returns an instant fast-path response", () => {
    expect(isTrivialInput("hi")).toBe(true);
    expect(isTrivialInput("hello there")).toBe(true);
    expect(isTrivialInput("Write a cover letter for a Frontend Developer role at Leapfrog")).toBe(false);

    const fastPath = getTrivialJobSeekerResponse("cover-letter-generator", {
      full_name: "Kiran Aryal",
      headline: "Full Stack Engineer",
    });

    expect(fastPath).toBeDefined();
    expect(fastPath?.cover_letter).toBeDefined();
    expect(fastPath?.tone).toBe("professional");
  });
});
