import { describe, it, expect } from "vitest";
import { z } from "zod";
import { zodToGeminiSchema, zodToSchemaShapeDescription } from "./schema-converter";

describe("zodToGeminiSchema", () => {
  it("converts primitive Zod types correctly", () => {
    expect(zodToGeminiSchema(z.string())).toEqual({ type: "STRING" });
    expect(zodToGeminiSchema(z.number())).toEqual({ type: "NUMBER" });
    expect(zodToGeminiSchema(z.number().int())).toEqual({ type: "INTEGER" });
    expect(zodToGeminiSchema(z.boolean())).toEqual({ type: "BOOLEAN" });
  });

  it("converts ZodEnum and ZodLiteral", () => {
    const enumSchema = z.enum(["low", "mid", "high"]);
    expect(zodToGeminiSchema(enumSchema)).toEqual({
      type: "STRING",
      enum: ["low", "mid", "high"],
    });

    const literalSchema = z.literal("NPR");
    expect(zodToGeminiSchema(literalSchema)).toEqual({
      type: "STRING",
      enum: ["NPR"],
    });
  });

  it("converts ZodArray and nested ZodObjects", () => {
    const itemSchema = z.object({
      name: z.string(),
      score: z.number(),
    });
    const arraySchema = z.array(itemSchema);

    expect(zodToGeminiSchema(arraySchema)).toEqual({
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          score: { type: "NUMBER" },
        },
        required: ["name", "score"],
      },
    });
  });

  it("handles optional and nullable fields without adding them to required list", () => {
    const schema = z.object({
      required_field: z.string(),
      optional_field: z.string().optional(),
      nullable_field: z.number().nullable(),
    });

    const converted = zodToGeminiSchema(schema);
    expect(converted.type).toBe("OBJECT");
    expect(converted.required).toEqual(["required_field", "nullable_field"]);
    expect(converted.properties?.nullable_field).toEqual({
      type: "NUMBER",
      nullable: true,
    });
  });

  it("converts complex Company Hiring Strategy schema accurately", () => {
    const schema = z.object({
      target_talent_profiles: z.array(
        z.object({
          role_title: z.string(),
          seniority: z.string(),
          required_skills: z.array(z.string()),
          why: z.string(),
        }),
      ),
      skill_demands: z.array(z.string()),
      recruitment_strategy: z.array(z.string()),
      candidate_screening_criteria: z.array(
        z.object({
          category: z.string(),
          must_have: z.string(),
          good_to_have: z.string(),
        }),
      ),
      interview_focus_areas: z.array(z.string()),
      compensation_benchmarks_npr: z.array(
        z.object({
          role: z.string(),
          min_salary: z.string(),
          max_salary: z.string(),
          market_trend: z.string(),
        }),
      ),
      employer_branding_suggestions: z.array(z.string()),
      hiring_velocity_assessment: z.string(),
    });

    const converted = zodToGeminiSchema(schema);

    expect(converted.type).toBe("OBJECT");
    expect(converted.required).toContain("target_talent_profiles");
    expect(converted.required).toContain("compensation_benchmarks_npr");
    expect(converted.properties?.target_talent_profiles.type).toBe("ARRAY");
    expect(
      converted.properties?.target_talent_profiles.items?.properties?.role_title.type,
    ).toBe("STRING");
    expect(
      converted.properties?.target_talent_profiles.items?.properties?.required_skills.type,
    ).toBe("ARRAY");
    expect(converted.properties?.compensation_benchmarks_npr.type).toBe("ARRAY");
    expect(
      converted.properties?.compensation_benchmarks_npr.items?.properties?.min_salary.type,
    ).toBe("STRING");
  });

  it("generates clean JSON shape description", () => {
    const schema = z.object({
      title: z.string(),
      skills: z.array(z.string()),
      salary: z.object({
        amount: z.number(),
        currency: z.enum(["NPR", "USD"]),
      }),
    });

    const description = zodToSchemaShapeDescription(schema);
    const parsed = JSON.parse(description);

    expect(parsed).toEqual({
      title: "string",
      skills: ["string"],
      salary: {
        amount: "number",
        currency: "NPR | USD",
      },
    });
  });
});
