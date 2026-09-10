/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "vitest";
import { z } from "zod";
import { AIServiceImpl } from "./ai-service";
import { AIProvider, AIRequest } from "./types";

describe("AIService Robust JSON Handling & Normalization", () => {
  const companyHiringStrategySchema = z.object({
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

  it("normalizes dictionary/object-based compensation_benchmarks_npr and non-standard profile keys", async () => {
    // Mock provider returning loose JSON format (common LLM failure mode)
    const mockProvider: AIProvider = {
      name: "mock-gemini",
      async generateText() {
        return "";
      },
      async generateJson<T>(_req: AIRequest): Promise<T> {
        return {
          target_talent_profiles: [
            {
              title: "Senior Fullstack Engineer",
              level: "Lead",
              skills: ["React", "Node.js", "PostgreSQL"],
              reason: "Lead product engineering team",
            },
          ],
          skill_demands: "React, Node.js, Cloud Infrastructure",
          recruitment_strategy: "1. Screen candidates fast\n2. Technical challenge",
          candidate_screening_criteria: [
            {
              name: "Technical Ability",
              required: "5+ years fullstack",
              optional: "GraphQL experience",
            },
          ],
          interview_focus_areas: "System Architecture, Team Culture",
          // Object/map format instead of array
          compensation_benchmarks_npr: {
            "Senior Fullstack Engineer": {
              min_salary: "Rs. 120,000",
              max_salary: "Rs. 200,000",
              market_trend: "High Demand",
            },
          },
          employer_branding_suggestions: "Emphasize flexible work environment",
          hiring_velocity_assessment: {
            assessment: "High hiring velocity expected within 3-4 weeks.",
          },
        } as unknown as T;
      },
    };

    const service = new AIServiceImpl([mockProvider]);

    const result = await service.generateJsonValidated(
      {
        prompt: "Analyze company hiring strategy",
        task: "company-intelligence",
      },
      companyHiringStrategySchema,
    );

    expect(result).toBeDefined();
    expect(Array.isArray(result.target_talent_profiles)).toBe(true);
    expect(result.target_talent_profiles[0]).toEqual({
      role_title: "Senior Fullstack Engineer",
      seniority: "Lead",
      required_skills: ["React", "Node.js", "PostgreSQL"],
      why: "Lead product engineering team",
    });

    expect(Array.isArray(result.compensation_benchmarks_npr)).toBe(true);
    expect(result.compensation_benchmarks_npr[0]).toEqual({
      role: "Senior Fullstack Engineer",
      min_salary: "Rs. 120,000",
      max_salary: "Rs. 200,000",
      market_trend: "High Demand",
    });

    expect(Array.isArray(result.candidate_screening_criteria)).toBe(true);
    expect(result.candidate_screening_criteria[0]).toEqual({
      category: "Technical Ability",
      must_have: "5+ years fullstack",
      good_to_have: "GraphQL experience",
    });

    expect(Array.isArray(result.skill_demands)).toBe(true);
    expect(Array.isArray(result.recruitment_strategy)).toBe(true);
    expect(typeof result.hiring_velocity_assessment).toBe("string");
  });

  it("retries with error feedback when initial response fails schema validation", async () => {
    let callCount = 0;
    let receivedPromptOnRetry = "";

    const mockProvider: AIProvider = {
      name: "mock-retry-provider",
      async generateText() {
        return "";
      },
      async generateJson<T>(req: AIRequest): Promise<T> {
        callCount++;
        if (callCount === 1) {
          // Return invalid payload on attempt 1
          return {
            target_talent_profiles: "invalid string",
          } as unknown as T;
        }

        receivedPromptOnRetry = req.prompt;
        // Return valid payload on attempt 2 (retry)
        return {
          target_talent_profiles: [
            {
              role_title: "Product Manager",
              seniority: "Senior",
              required_skills: ["Roadmapping", "Agile"],
              why: "Strategic leadership",
            },
          ],
          skill_demands: ["Product Strategy"],
          recruitment_strategy: ["Direct sourcing"],
          candidate_screening_criteria: [
            {
              category: "Leadership",
              must_have: "Prior PM experience",
              good_to_have: "Technical background",
            },
          ],
          interview_focus_areas: ["Product design", "Execution"],
          compensation_benchmarks_npr: [
            {
              role: "Product Manager",
              min_salary: "Rs. 100,000",
              max_salary: "Rs. 180,000",
              market_trend: "Active",
            },
          ],
          employer_branding_suggestions: ["Highlight product impact"],
          hiring_velocity_assessment: "Standard cycle 4 weeks",
        } as unknown as T;
      },
    };

    const service = new AIServiceImpl([mockProvider]);

    const result = await service.generateJsonValidated(
      {
        prompt: "Generate hiring strategy",
        task: "company-intelligence",
      },
      companyHiringStrategySchema,
    );

    expect(callCount).toBe(2);
    expect(receivedPromptOnRetry).toContain("[CRITICAL CORRECTION REQUIRED]");
    expect(result.target_talent_profiles[0].role_title).toBe("Product Manager");
  });
});
